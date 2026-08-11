#!/usr/bin/env python3
"""Write Plex episode titles from their filenames, and lock them.

Plex's series scanner never extracts episode titles from filenames, so the
title has to be pushed back through the API. `title.locked=1` keeps a later
"refresh all metadata" from wiping it.

    export PLEX_URL=http://plex.local:32400
    export PLEX_TOKEN=your-token

    python3 plex_titles.py <showRatingKey>          # dry run, prints changes
    python3 plex_titles.py <showRatingKey> apply    # write and lock

Expects filenames shaped like:
    <Show> - S2014E03 - <Title>[ - pt1].<ext>
"""
import os
import re
import sys
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

HOST = os.environ.get("PLEX_URL", "http://127.0.0.1:32400").rstrip("/")
TOKEN = os.environ.get("PLEX_TOKEN", "")
TYPE_EPISODE = 4

# Everything between " - SxxxxEyy - " and an optional stacking suffix.
TITLE_RE = re.compile(
    r" - [Ss]\d+[Ee]\d+ - (.+?)(?: - (?:pt|part|cd|disc|disk|dvd)\d+)?\.[A-Za-z0-9]+$"
)


def fetch(path):
    try:
        with urllib.request.urlopen(f"{HOST}{path}", timeout=30) as r:
            return ET.fromstring(r.read())
    except urllib.error.HTTPError as exc:
        if exc.code == 404:
            sys.exit(f"no such item on {HOST}: {path.split('?')[0]}")
        sys.exit(f"{HOST} returned HTTP {exc.code} for {path.split('?')[0]}")
    except urllib.error.URLError as exc:
        sys.exit(f"cannot reach {HOST}: {exc.reason}")


def main():
    if not TOKEN:
        sys.exit("PLEX_TOKEN is not set")
    if len(sys.argv) < 2:
        sys.exit(__doc__)

    show_key = sys.argv[1]
    apply_mode = len(sys.argv) > 2 and sys.argv[2] == "apply"

    root = fetch(f"/library/metadata/{show_key}/allLeaves?X-Plex-Token={TOKEN}")
    section = root.get("librarySectionID")
    if not section:
        sys.exit("could not read librarySectionID from the response")

    rows, skipped = [], 0
    for video in root.iter("Video"):
        parts = [p for m in video.iter("Media") for p in m.iter("Part")]
        if not parts:
            continue
        fname = parts[0].get("file", "").rsplit("/", 1)[-1]
        m = TITLE_RE.search(fname)
        if not m:
            print(f"!! no title in filename: {fname}")
            skipped += 1
            continue
        rows.append((video.get("ratingKey"), video.get("parentIndex"),
                     video.get("index"), video.get("title"), m.group(1)))

    for key, season, ep, old, new in rows:
        flag = "" if old != new else "   (unchanged)"
        print(f"S{season}E{ep}  [{old}]  ->  [{new}]{flag}")
        if not apply_mode:
            continue
        query = urllib.parse.urlencode({
            "type": TYPE_EPISODE,
            "id": key,
            "title.value": new,
            "title.locked": 1,
            "X-Plex-Token": TOKEN,
        })
        req = urllib.request.Request(
            f"{HOST}/library/sections/{section}/all?{query}", method="PUT")
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                if r.status not in (200, 204):
                    print(f"   !! HTTP {r.status}")
        except Exception as exc:  # noqa: BLE001 - surface any transport failure
            print(f"   !! failed: {exc}")

    state = "written and locked" if apply_mode else "dry run"
    print(f"\n{len(rows)} episodes, {skipped} skipped ({state})")
    if skipped:
        sys.exit(1)


if __name__ == "__main__":
    main()
