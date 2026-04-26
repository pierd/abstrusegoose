"""Generate src/searchIndex.json (and optionally src/searchEmbeddings.json).

Pipeline (idempotent across runs):

  1. Read src/strips.json and build entries: title, blog (HTML stripped),
     image_alt, image_title.
  2. OCR each comic image (cached in .ocr_cache.json by image path + mtime).
  3. Write the entries to src/searchIndex.json.
  4. If --embed is given, run the Universal Sentence Encoder (TF-Hub) over
     each entry's combined text and write 512-dim float embeddings to
     src/searchEmbeddings.json (a separate file so the fuzzy-search bundle
     isn't bloated). Embeddings are cached in .embedding_cache.json by
     sha256 of the input text.

OCR requires the `tesseract` binary (e.g. `brew install tesseract`).
Embedding requires `tensorflow` and `tensorflow-hub` (slow first run while
the model downloads; subsequent runs reuse the on-disk TF-Hub cache).
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys

import pytesseract
from bs4 import BeautifulSoup
from PIL import Image

OCR_CACHE_PATH = ".ocr_cache.json"
EMBEDDING_CACHE_PATH = ".embedding_cache.json"
PUBLIC_DIR = "public"
STRIPS_PATH = "src/strips.json"
INDEX_PATH = "src/searchIndex.json"
EMBEDDINGS_PATH = "src/searchEmbeddings.json"
USE_MODEL_URL = "https://tfhub.dev/google/universal-sentence-encoder/4"
EMBED_DIM = 512
EMBED_MAX_CHARS = 4000  # truncate per-entry text fed to the encoder


# --------------------------------------------------------------------------- #
# Generic helpers
# --------------------------------------------------------------------------- #


def html_to_plain(html_text):
    if not html_text:
        return ""
    soup = BeautifulSoup(html_text, "html.parser")
    text = soup.get_text(" ")
    return re.sub(r"\s+", " ", text).strip()


def load_json(path, default):
    if not os.path.exists(path):
        return default
    try:
        with open(path) as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return default


def save_json(path, data, sort_keys=False):
    with open(path, "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False, sort_keys=sort_keys)
        f.write("\n")


# --------------------------------------------------------------------------- #
# OCR
# --------------------------------------------------------------------------- #


def resolve_image_path(image_url):
    if not image_url:
        return None
    if image_url.startswith("/"):
        return os.path.join(PUBLIC_DIR, image_url.lstrip("/"))
    return None


def ocr_image(path, cache):
    """Run OCR on path; cached by path + mtime."""
    try:
        mtime = os.path.getmtime(path)
    except OSError:
        return ""
    cached = cache.get(path)
    if cached and cached.get("mtime") == mtime:
        return cached["text"]
    try:
        with Image.open(path) as img:
            text = pytesseract.image_to_string(img)
    except Exception as e:
        print(f"OCR failed for {path}: {e}", file=sys.stderr)
        text = ""
    text = re.sub(r"\s+", " ", text).strip()
    cache[path] = {"mtime": mtime, "text": text}
    return text


# --------------------------------------------------------------------------- #
# Entry construction
# --------------------------------------------------------------------------- #


def build_entries():
    with open(STRIPS_PATH) as f:
        strips = json.load(f)

    ocr_cache = load_json(OCR_CACHE_PATH, {})
    total = len(strips)
    entries = []

    for i, (strip_id, strip) in enumerate(strips.items(), start=1):
        title = strip.get("title") or strip.get("image_alt") or strip_id
        blog = html_to_plain(strip.get("blog_text", ""))

        ocr_text = ""
        image_path = resolve_image_path(strip.get("image_url"))
        if image_path and os.path.exists(image_path):
            ocr_text = ocr_image(image_path, ocr_cache)

        if i % 25 == 0 or i == total:
            print(f"  ocr {i}/{total}", file=sys.stderr)
            save_json(OCR_CACHE_PATH, ocr_cache, sort_keys=True)

        entries.append({
            "id": strip_id,
            "title": title,
            "blog": blog,
            "ocr": ocr_text,
            "image_alt": strip.get("image_alt"),
            "image_title": strip.get("image_title"),
        })

    save_json(OCR_CACHE_PATH, ocr_cache, sort_keys=True)
    return entries


# --------------------------------------------------------------------------- #
# Embeddings (Universal Sentence Encoder via TF-Hub)
# --------------------------------------------------------------------------- #


def embed_text_for_entry(entry):
    parts = [
        entry.get("title") or "",
        entry.get("blog") or "",
        entry.get("ocr") or "",
        entry.get("image_alt") or "",
        entry.get("image_title") or "",
    ]
    text = " \n\n ".join(p for p in parts if p)
    return text[:EMBED_MAX_CHARS]


def text_hash(text):
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def build_embeddings(entries):
    print("Loading TensorFlow + Universal Sentence Encoder...", file=sys.stderr)
    import tensorflow_hub as hub  # noqa: WPS433

    model = hub.load(USE_MODEL_URL)
    print("Model loaded.", file=sys.stderr)

    cache = load_json(EMBEDDING_CACHE_PATH, {})
    total = len(entries)
    computed = 0
    reused = 0

    # Embeddings indexed positionally to the entries list.
    vectors: list[list[float] | None] = [None] * total
    ids: list[str] = [e["id"] for e in entries]

    batch_size = 16
    pending_indices: list[int] = []
    pending_texts: list[str] = []

    def flush():
        nonlocal computed
        if not pending_indices:
            return
        result = model(pending_texts).numpy()
        for idx, text, vec in zip(pending_indices, pending_texts, result):
            vec_list = [float(x) for x in vec]
            vectors[idx] = vec_list
            cache[text_hash(text)] = vec_list
            computed += 1
        pending_indices.clear()
        pending_texts.clear()

    for i, entry in enumerate(entries):
        text = embed_text_for_entry(entry)
        if not text.strip():
            vectors[i] = [0.0] * EMBED_DIM
            continue
        h = text_hash(text)
        cached_vec = cache.get(h)
        if cached_vec is not None:
            vectors[i] = cached_vec
            reused += 1
            continue
        pending_indices.append(i)
        pending_texts.append(text)
        if len(pending_indices) >= batch_size:
            flush()
            print(
                f"  embed {i + 1}/{total} (computed={computed}, reused={reused})",
                file=sys.stderr,
            )
            save_json(EMBEDDING_CACHE_PATH, cache, sort_keys=True)

    flush()
    save_json(EMBEDDING_CACHE_PATH, cache, sort_keys=True)
    print(
        f"Embeddings done: computed={computed}, reused={reused}, total={total}",
        file=sys.stderr,
    )

    return {
        "model": "universal-sentence-encoder/4",
        "dim": EMBED_DIM,
        "ids": ids,
        "vectors": vectors,
    }


# --------------------------------------------------------------------------- #
# CLI
# --------------------------------------------------------------------------- #


def parse_args(argv):
    p = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    p.add_argument(
        "--embed",
        action="store_true",
        help="Also compute Universal Sentence Encoder embeddings (slow; "
        "writes src/searchEmbeddings.json).",
    )
    return p.parse_args(argv)


def main(argv=None):
    args = parse_args(argv)

    entries = build_entries()
    save_json(INDEX_PATH, entries)
    print(f"Wrote {len(entries)} entries to {INDEX_PATH}", file=sys.stderr)

    if args.embed:
        embeddings = build_embeddings(entries)
        save_json(EMBEDDINGS_PATH, embeddings)
        print(
            f"Wrote {len(embeddings['ids'])} embeddings to {EMBEDDINGS_PATH}",
            file=sys.stderr,
        )


if __name__ == "__main__":
    main()
