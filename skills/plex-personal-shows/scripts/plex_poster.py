#!/usr/bin/env python3
"""Render a logo into a Plex 2:3 poster, optionally labelled with a year,
and upload it.

    export PLEX_URL=http://plex.local:32400
    export PLEX_TOKEN=your-token

    python3 plex_poster.py --logo emblem.png --out poster.jpg --upload 25668
    python3 plex_poster.py --logo https://.../ucl.png --out s2017.jpg \
        --year 2017 --ink '#0a1a4a' --upload 25701

--logo takes a local path or a URL. Season ratingKeys come from
/library/metadata/<showRatingKey>/children.
"""
import argparse
import io
import os
import sys
import urllib.request

from PIL import Image, ImageDraw, ImageFont

W, H = 1000, 1500

FONT_CANDIDATES = [
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "/Library/Fonts/Arial Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    "C:/Windows/Fonts/arialbd.ttf",
]


def load_font(size):
    for path in FONT_CANDIDATES:
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    sys.exit("no bold TrueType font found; add one to FONT_CANDIDATES")


def load_logo(src):
    if src.startswith(("http://", "https://")):
        req = urllib.request.Request(src, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=60) as r:
            return Image.open(io.BytesIO(r.read())).convert("RGBA")
    return Image.open(src).convert("RGBA")


def build(logo, year, ink, background):
    canvas = Image.new("RGB", (W, H), background)

    # Leave room under the logo when a year label is drawn.
    box_w, box_h, cy = (740, 860, 620) if year else (820, 1150, H // 2)
    scale = min(box_w / logo.width, box_h / logo.height)
    logo = logo.resize(
        (round(logo.width * scale), round(logo.height * scale)), Image.LANCZOS)
    canvas.paste(logo, ((W - logo.width) // 2, cy - logo.height // 2), logo)

    if year:
        draw = ImageDraw.Draw(canvas)
        font = load_font(175)
        left, top, right, bottom = draw.textbbox((0, 0), year, font=font)
        draw.text(((W - (right - left)) // 2 - left,
                   1210 - (bottom - top) // 2 - top),
                  year, font=font, fill=ink)
    return canvas


def upload(rating_key, path):
    host = os.environ.get("PLEX_URL", "http://127.0.0.1:32400").rstrip("/")
    token = os.environ.get("PLEX_TOKEN", "")
    if not token:
        sys.exit("PLEX_TOKEN is not set")
    with open(path, "rb") as fh:
        data = fh.read()
    req = urllib.request.Request(
        f"{host}/library/metadata/{rating_key}/posters?X-Plex-Token={token}",
        data=data, method="POST",
        headers={"Content-Type": "image/jpeg"})
    with urllib.request.urlopen(req, timeout=120) as r:
        print(f"  uploaded to {rating_key}: HTTP {r.status}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--logo", required=True, help="local path or URL")
    ap.add_argument("--out", required=True)
    ap.add_argument("--year", help="label drawn under the logo, e.g. 2017")
    ap.add_argument("--ink", default="#1a1a1a", help="year colour")
    ap.add_argument("--bg", default="white")
    ap.add_argument("--upload", help="Plex ratingKey to POST the poster to")
    args = ap.parse_args()

    poster = build(load_logo(args.logo), args.year, args.ink, args.bg)
    poster.save(args.out, "JPEG", quality=92, optimize=True)
    print(f"  {args.out}  {poster.size}")

    if args.upload:
        upload(args.upload, args.out)


if __name__ == "__main__":
    main()
