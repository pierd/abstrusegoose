"""Generate src/searchIndex.json from src/strips.json.

Reads the strips data, strips HTML from blog text to plain text, and emits
a flat list of entries suitable for client-side fuzzy search.
"""

import json
import re
import sys

from bs4 import BeautifulSoup


def html_to_plain(html_text):
    if not html_text:
        return ""
    soup = BeautifulSoup(html_text, "html.parser")
    text = soup.get_text(" ")
    # Collapse runs of whitespace.
    return re.sub(r"\s+", " ", text).strip()


def main():
    with open("src/strips.json") as f:
        strips = json.load(f)

    entries = []
    for strip_id, strip in strips.items():
        title = strip.get("title") or strip.get("image_alt") or strip_id
        entries.append({
            "id": strip_id,
            "title": title,
            "blog": html_to_plain(strip.get("blog_text", "")),
            "image_alt": strip.get("image_alt"),
            "image_title": strip.get("image_title"),
        })

    json.dump(entries, sys.stdout, indent=2, ensure_ascii=False)
    sys.stdout.write("\n")


if __name__ == "__main__":
    main()
