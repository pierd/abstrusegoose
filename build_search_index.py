"""Generate src/searchIndex.json from src/strips.json.

Reads the strips data, strips HTML from blog text to plain text, runs OCR on
each comic image to extract any in-image text, and emits a flat list of
entries suitable for client-side fuzzy search.

OCR results are cached in .ocr_cache.json (keyed by image path + mtime) so
reruns are cheap.
"""

import json
import os
import re
import sys

import pytesseract
from bs4 import BeautifulSoup
from PIL import Image

OCR_CACHE_PATH = ".ocr_cache.json"
PUBLIC_DIR = "public"


def html_to_plain(html_text):
    if not html_text:
        return ""
    soup = BeautifulSoup(html_text, "html.parser")
    text = soup.get_text(" ")
    # Collapse runs of whitespace.
    return re.sub(r"\s+", " ", text).strip()


def load_cache():
    if not os.path.exists(OCR_CACHE_PATH):
        return {}
    try:
        with open(OCR_CACHE_PATH) as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return {}


def save_cache(cache):
    with open(OCR_CACHE_PATH, "w") as f:
        json.dump(cache, f, indent=2, ensure_ascii=False, sort_keys=True)


def resolve_image_path(image_url):
    if not image_url:
        return None
    # image_url is like "/strips/foo.png" -> public/strips/foo.png
    if image_url.startswith("/"):
        rel = image_url.lstrip("/")
        return os.path.join(PUBLIC_DIR, rel)
    return None


def ocr_image(path, cache):
    """Run OCR on path, using cache keyed by path + mtime."""
    try:
        mtime = os.path.getmtime(path)
    except OSError:
        return ""
    key = path
    cached = cache.get(key)
    if cached and cached.get("mtime") == mtime:
        return cached["text"]
    try:
        with Image.open(path) as img:
            text = pytesseract.image_to_string(img)
    except Exception as e:
        print(f"OCR failed for {path}: {e}", file=sys.stderr)
        text = ""
    text = re.sub(r"\s+", " ", text).strip()
    cache[key] = {"mtime": mtime, "text": text}
    return text


def main():
    with open("src/strips.json") as f:
        strips = json.load(f)

    cache = load_cache()
    total = len(strips)

    entries = []
    for i, (strip_id, strip) in enumerate(strips.items(), start=1):
        title = strip.get("title") or strip.get("image_alt") or strip_id
        ocr_text = ""
        image_path = resolve_image_path(strip.get("image_url"))
        if image_path and os.path.exists(image_path):
            ocr_text = ocr_image(image_path, cache)
        if i % 25 == 0 or i == total:
            print(f"  ocr {i}/{total}", file=sys.stderr)
            save_cache(cache)
        entries.append({
            "id": strip_id,
            "title": title,
            "blog": html_to_plain(strip.get("blog_text", "")),
            "ocr": ocr_text,
            "image_alt": strip.get("image_alt"),
            "image_title": strip.get("image_title"),
        })

    save_cache(cache)
    json.dump(entries, sys.stdout, indent=2, ensure_ascii=False)
    sys.stdout.write("\n")


if __name__ == "__main__":
    main()
