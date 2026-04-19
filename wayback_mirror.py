#!/usr/bin/env python3
"""
Mirror a Wayback-hosted site into ./raw with resumable state.

Default seed:
  https://web.archive.org/web/20150227100638/http://abstrusegoose.com/

The script stores downloaded files in ./raw and keeps crawl state in
./raw/.download_state.json so re-runs only fetch missing pages/resources.
"""

from __future__ import annotations

import argparse
import hashlib
import importlib
import json
import re
import sys
import time
from collections import deque
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from typing import Iterable, Optional
from urllib.parse import ParseResult, unquote, urljoin, urlparse, urlunparse


DEFAULT_SEED = "https://web.archive.org/web/20150227100638/http://abstrusegoose.com/"
WAYBACK_HOST = "web.archive.org"
STATE_FILE = ".download_state.json"

CSS_URL_RE = re.compile(r"url\(\s*['\"]?([^)'\"\s]+)['\"]?\s*\)", re.IGNORECASE)


class LinkExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.links: set[str] = set()

    def handle_starttag(self, tag: str, attrs: list[tuple[str, Optional[str]]]) -> None:
        attrs_dict = {k.lower(): (v or "") for k, v in attrs}
        for key in ("href", "src", "action", "data-src", "poster"):
            if attrs_dict.get(key):
                self.links.add(attrs_dict[key].strip())

        srcset = attrs_dict.get("srcset", "")
        if srcset:
            for part in srcset.split(","):
                candidate = part.strip().split(" ")[0]
                if candidate:
                    self.links.add(candidate)

        style = attrs_dict.get("style", "")
        if style:
            self.links.update(extract_css_urls(style))


def extract_css_urls(text: str) -> set[str]:
    return {m.group(1).strip() for m in CSS_URL_RE.finditer(text)}


def parse_wayback_url(url: str) -> Optional[dict[str, str]]:
    parsed = urlparse(url)
    if parsed.netloc.lower() != WAYBACK_HOST:
        return None
    if not parsed.path.startswith("/web/"):
        return None

    rest = parsed.path[len("/web/") :]
    if "/" not in rest:
        return None

    token, target = rest.split("/", 1)
    m = re.match(r"^(\d+)(.*)$", token)
    if not m:
        return None
    timestamp, mode = m.group(1), m.group(2)

    target = unquote(target)
    if not target.startswith(("http://", "https://")):
        return None

    return {
        "timestamp": timestamp,
        "mode": mode,
        "original_url": strip_fragment(target),
    }


def strip_fragment(url: str) -> str:
    p = urlparse(url)
    return urlunparse((p.scheme, p.netloc, p.path, p.params, p.query, ""))


def normalize_host(host: str) -> str:
    host = host.lower()
    return host[4:] if host.startswith("www.") else host


def in_scope(original_url: str, allowed_hosts: set[str]) -> bool:
    try:
        host = urlparse(original_url).netloc.split("@")[-1].split(":")[0]
    except Exception:
        return False
    return normalize_host(host) in allowed_hosts


def to_archive_url(original_url: str, timestamp: str) -> str:
    return f"https://{WAYBACK_HOST}/web/{timestamp}id_/{strip_fragment(original_url)}"


def sanitize_part(part: str) -> str:
    part = part.strip()
    if not part:
        return "_"
    return re.sub(r"[^A-Za-z0-9._-]", "_", part)


def local_path_for(original_url: str, output_dir: Path, content_type: str) -> Path:
    p: ParseResult = urlparse(original_url)
    host = sanitize_part(p.netloc.split("@")[-1].split(":")[0].lower())

    path = unquote(p.path or "/")
    parts = [sanitize_part(x) for x in path.split("/") if x]

    is_html = "html" in (content_type or "").lower()

    if not parts:
        parts = ["index.html"]
    elif path.endswith("/"):
        parts.append("index.html")
    else:
        last = parts[-1]
        if "." not in last and is_html:
            parts[-1] = f"{last}.html"

    rel = Path(host, *parts)
    if p.query:
        digest = hashlib.sha1(p.query.encode("utf-8")).hexdigest()[:10]
        rel = rel.with_name(f"{rel.name}__q_{digest}")
    return output_dir / rel


def load_state(path: Path) -> dict:
    if not path.exists():
        return {"version": 1, "queue": [], "downloaded": {}, "failed": {}}
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def save_state(path: Path, state: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    with tmp.open("w", encoding="utf-8") as f:
        json.dump(state, f, indent=2, sort_keys=True)
    tmp.replace(path)


class WaybackClient:
    def __init__(
        self,
        user_agent: str,
        timeout: int,
        retries: int,
        retry_backoff: float,
        target_window_days: int,
    ) -> None:
        try:
            wayback = importlib.import_module("wayback")
        except ImportError as exc:
            raise RuntimeError(
                "Missing dependency 'wayback'. Install it with: uv add wayback"
            ) from exc
        self.wayback = wayback
        self.session = wayback.WaybackSession(
            retries=max(1, retries),
            backoff=max(0.0, retry_backoff),
            timeout=timeout,
            user_agent=user_agent,
        )
        self.client = wayback.WaybackClient(session=self.session)
        self.target_window_seconds = max(1, int(target_window_days) * 24 * 60 * 60)

    def fetch(self, url: str) -> tuple[str, int, str, bytes]:
        wb = parse_wayback_url(url)
        if wb:
            when = datetime.strptime(wb["timestamp"], "%Y%m%d%H%M%S").replace(tzinfo=timezone.utc)
            memento = self.client.get_memento(
                wb["original_url"],
                timestamp=when,
                exact=False,
                target_window=self.target_window_seconds,
            )
        else:
            memento = self.client.get_memento(url)
        final_url = memento.memento_url
        status = memento.status_code
        content_type = memento.headers.get("Content-Type", "")
        body = memento.content
        return final_url, status, content_type, body

    def close(self) -> None:
        self.session.close()


def decode_text(blob: bytes) -> str:
    for enc in ("utf-8", "latin-1"):
        try:
            return blob.decode(enc)
        except UnicodeDecodeError:
            continue
    return blob.decode("utf-8", errors="replace")


def extract_links_from_content(content_type: str, body: bytes) -> set[str]:
    ctype = (content_type or "").lower()
    links: set[str] = set()

    if "html" in ctype:
        text = decode_text(body)
        parser = LinkExtractor()
        parser.feed(text)
        links |= parser.links
        links |= extract_css_urls(text)
    elif "css" in ctype:
        links |= extract_css_urls(decode_text(body))

    return links


def pick_timestamp(seed_url: str) -> str:
    parsed = parse_wayback_url(seed_url)
    if not parsed:
        raise ValueError("Seed URL must be a Wayback URL like /web/<timestamp>/<original-url>")
    return parsed["timestamp"]


def canonicalize_candidate(
    candidate: str,
    current_archive_url: str,
    timestamp: str,
    allowed_hosts: set[str],
) -> Optional[str]:
    candidate = candidate.strip()
    if not candidate:
        return None
    if candidate.startswith(("#", "mailto:", "javascript:", "data:", "tel:")):
        return None

    absolute = urljoin(current_archive_url, candidate)

    wb = parse_wayback_url(absolute)
    if wb:
        original = wb["original_url"]
    else:
        original = strip_fragment(absolute)
        if not original.startswith(("http://", "https://")):
            return None

    if not in_scope(original, allowed_hosts):
        return None

    return to_archive_url(original, timestamp)


def iter_queue_pop(queue: deque[str]) -> Iterable[str]:
    while queue:
        yield queue.popleft()


def main() -> int:
    parser = argparse.ArgumentParser(description="Mirror a site from Wayback into raw/")
    parser.add_argument("--seed", default=DEFAULT_SEED, help="Wayback seed URL")
    parser.add_argument("--output", default="raw", help="Output directory")
    parser.add_argument("--delay", type=float, default=0.25, help="Delay between requests in seconds")
    parser.add_argument("--timeout", type=int, default=30, help="Per-request timeout in seconds")
    parser.add_argument("--retries", type=int, default=5, help="Per-request retry attempts")
    parser.add_argument("--retry-backoff", type=float, default=1.0, help="Retry backoff base seconds")
    parser.add_argument(
        "--target-window-days",
        type=int,
        default=3650,
        help="When exact timestamp is missing, allow nearest capture within this many days",
    )
    parser.add_argument("--max-pages", type=int, default=0, help="Optional cap; 0 means no limit")
    parser.add_argument(
        "--retry-failed",
        action="store_true",
        help="Re-queue URLs from previous failed list on startup",
    )
    parser.add_argument(
        "--user-agent",
        default="abstrusegoose-wayback-mirror/1.0 (+https://web.archive.org)",
        help="HTTP user agent",
    )
    args = parser.parse_args()

    output_dir = Path(args.output).resolve()
    state_path = output_dir / STATE_FILE

    timestamp = pick_timestamp(args.seed)
    seed_info = parse_wayback_url(args.seed)
    assert seed_info is not None

    seed_host = urlparse(seed_info["original_url"]).netloc.split(":")[0]
    base = normalize_host(seed_host)
    allowed_hosts = {base}

    state = load_state(state_path)
    queue = deque(state.get("queue", []))
    downloaded: dict[str, dict] = state.get("downloaded", {})
    failed: dict[str, str] = state.get("failed", {})

    if args.retry_failed and failed:
        for failed_url in list(failed.keys()):
            if failed_url not in downloaded and failed_url not in queue:
                queue.append(failed_url)

    client = WaybackClient(
        user_agent=args.user_agent,
        timeout=args.timeout,
        retries=args.retries,
        retry_backoff=args.retry_backoff,
        target_window_days=args.target_window_days,
    )

    if not queue and not downloaded:
        queue.append(to_archive_url(seed_info["original_url"], timestamp))

    seen_queued = set(queue)
    processed = 0

    print(f"Output directory: {output_dir}")
    print(f"State file: {state_path}")
    print(f"Allowed host scope: {sorted(allowed_hosts)}")
    print(f"Starting queue size: {len(queue)}")

    for archive_url in iter_queue_pop(queue):
        seen_queued.discard(archive_url)
        if archive_url in downloaded:
            continue

        if args.max_pages and processed >= args.max_pages:
            queue.appendleft(archive_url)
            break

        try:
            final_url, status, ctype, body = client.fetch(archive_url)
            wb = parse_wayback_url(final_url) or parse_wayback_url(archive_url)
            if not wb:
                raise RuntimeError("Response is not a valid Wayback URL")

            original_url = wb["original_url"]
            destination = local_path_for(original_url, output_dir, ctype)
            destination.parent.mkdir(parents=True, exist_ok=True)
            with destination.open("wb") as f:
                f.write(body)

            discovered = 0
            for link in extract_links_from_content(ctype, body):
                nxt = canonicalize_candidate(link, final_url, timestamp, allowed_hosts)
                if not nxt:
                    continue
                if nxt in downloaded or nxt in seen_queued:
                    continue
                queue.append(nxt)
                seen_queued.add(nxt)
                discovered += 1

            downloaded[archive_url] = {
                "status": status,
                "content_type": ctype,
                "original_url": original_url,
                "path": str(destination.relative_to(output_dir)),
                "size": len(body),
            }
            failed.pop(archive_url, None)
            processed += 1

            print(
                f"[{processed}] {status} {original_url} -> {destination.relative_to(output_dir)}"
                f" (+{discovered} links, queue={len(queue)})"
            )

        except Exception as e:
            ex = client.wayback.exceptions
            if isinstance(e, ex.WaybackRetryError):
                failed[archive_url] = f"WaybackRetryError: {e}"
                print(f"[WARN] {archive_url} -> retry error: {e}", file=sys.stderr)
            elif isinstance(e, ex.RateLimitError):
                retry_after = getattr(e, "retry_after", None)
                failed[archive_url] = f"RateLimitError: retry_after={retry_after}"
                print(f"[WARN] {archive_url} -> rate limited (retry_after={retry_after})", file=sys.stderr)
            elif isinstance(e, ex.MementoPlaybackError):
                failed[archive_url] = f"MementoPlaybackError: {e}"
                print(f"[WARN] {archive_url} -> memento playback error: {e}", file=sys.stderr)
            else:
                failed[archive_url] = f"Error: {e}"
                print(f"[WARN] {archive_url} -> {e}", file=sys.stderr)

        state["queue"] = list(queue)
        state["downloaded"] = downloaded
        state["failed"] = failed
        save_state(state_path, state)

        if args.delay > 0:
            time.sleep(args.delay)

    state["queue"] = list(queue)
    state["downloaded"] = downloaded
    state["failed"] = failed
    save_state(state_path, state)
    client.close()

    print("Done.")
    print(f"Downloaded entries: {len(downloaded)}")
    print(f"Pending queue: {len(queue)}")
    print(f"Failures: {len(failed)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
