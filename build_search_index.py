"""Generate src/searchIndex.json.

Pipeline (idempotent across runs):

  1. Read src/strips.json and build entries: title, blog (HTML stripped),
     image_alt, image_title.
  2. OCR each comic image (cached in .ocr_cache.json by image path + mtime).
  3. Write the entries to src/searchIndex.json.

Semantic-search embeddings are generated from this index by
build_search_embeddings.mjs (it must use the same model as the browser).

OCR requires the `tesseract` binary (e.g. `brew install tesseract`).
"""

from __future__ import annotations

import json
import os
import re
import sys

import pytesseract
from bs4 import BeautifulSoup
from PIL import Image

OCR_CACHE_PATH = ".ocr_cache.json"
PUBLIC_DIR = "public"
STRIPS_PATH = "src/strips.json"
INDEX_PATH = "src/searchIndex.json"


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
# CLI
# --------------------------------------------------------------------------- #


def main():
    entries = build_entries()
    save_json(INDEX_PATH, entries)
    print(f"Wrote {len(entries)} entries to {INDEX_PATH}", file=sys.stderr)


if __name__ == "__main__":
    main()
