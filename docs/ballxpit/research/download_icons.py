#!/usr/bin/env python3
"""Download all BALL x PIT ball icons from the source tool to local assets."""

import json
import urllib.request
from pathlib import Path


def download_images(data_path, base_url, out_dir, proxy=None):
    """Download all images referenced in a JSON data file."""
    out_dir.mkdir(parents=True, exist_ok=True)

    if proxy:
        handler = urllib.request.ProxyHandler(proxy)
        opener = urllib.request.build_opener(handler)
        urllib.request.install_opener(opener)

    data = json.loads(data_path.read_text(encoding="utf-8"))

    # Support both ball data ("balls") and passive item data ("items")
    collection = data.get("balls") or data.get("items") or {}
    images = sorted(set(b.get("img") for b in collection.values() if b.get("img")))

    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }

    failed = []
    for img in images:
        path = out_dir / img
        if path.exists():
            print("skip", img)
            continue
        req = urllib.request.Request(base_url + img, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                path.write_bytes(resp.read())
            print("ok", img)
        except Exception as e:
            print("fail", img, e)
            failed.append(img)

    print(f"done: {len(images) - len(failed)}/{len(images)}")
    if failed:
        print("failed:", failed)
    return failed


def main():
    root = Path(__file__).resolve().parent.parent.parent.parent
    out_dir = root / "frontend" / "public" / "images" / "ballxpit"
    base_url = "https://ballxpit-query-tool.pages.dev/img/"
    proxy = {"http": "http://127.0.0.1:7897", "https": "http://127.0.0.1:7897"}

    print("=== balls ===")
    download_images(
        root / "frontend" / "public" / "data" / "ballxpit.json",
        base_url,
        out_dir,
        proxy,
    )

    print("\n=== passives ===")
    download_images(
        root / "frontend" / "public" / "data" / "ballxpit-passives.json",
        base_url,
        out_dir,
        proxy,
    )


if __name__ == "__main__":
    main()
