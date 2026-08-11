# Posters

Personal Media downloads no artwork, so both show and season posters are supplied by hand. Deploy each one **twice** — to disk for portability across a library rebuild or a move to Emby/Jellyfin, and through the API for immediate effect without waiting on a scan.

```
<Show>/poster.jpg
<Show>/Season <YYYY>/season-poster.jpg
```

## Sourcing

Wikipedia and Commons carry official emblems and logos as SVG, which the API will render to PNG at any width — sharper than any screenshot, and consistent in style across a set.

```bash
# Find the file
curl -s -G "https://en.wikipedia.org/w/api.php" \
  --data-urlencode "action=query" --data-urlencode "list=search" \
  --data-urlencode "srsearch=UEFA Champions League logo" \
  --data-urlencode "srnamespace=6" --data-urlencode "format=json"

# Get a rendered PNG URL at 1200px wide
curl -s -G "https://en.wikipedia.org/w/api.php" \
  --data-urlencode "action=query" --data-urlencode "titles=File:2014 FIFA World Cup.svg" \
  --data-urlencode "prop=imageinfo" --data-urlencode "iiprop=url|size" \
  --data-urlencode "iiurlwidth=1200" --data-urlencode "format=json"
```

Swap the host to `commons.wikimedia.org` when a file is not on en.wikipedia. `prop=pageimages` silently returns nothing for non-free logos — use `prop=images` or `list=search` in namespace 6 instead.

Tournament **emblems** beat official tournament posters here: reliably available, uniform in style across editions, and legible at thumbnail size. Reject busy photographs — a museum shot of the trophy carried a glass case, reflections and a caption placard.

## Compositing

Plex posters are 2:3. `scripts/plex_poster.py` renders a logo onto a 1000×1500 white canvas and uploads it.

```bash
export PLEX_URL=http://plex.local:32400 PLEX_TOKEN=your-token

# Show poster
python3 scripts/plex_poster.py --logo emblem.png --out poster.jpg --upload 25668

# Season poster with a year label
python3 scripts/plex_poster.py --logo ucl.png --out s2017.jpg --year 2017 --ink '#0a1a4a' --upload 25701
```

`--logo` accepts a local path or a URL. White background suits official emblems, which are designed for light surfaces.

Competitions with a single unchanging logo — a league, a cup — look identical season to season, so pass `--year` to label each one. Tournaments with a per-edition emblem need no label.

## Verify by fetching from Plex

Confirm the right image landed on the right item by pulling it back through Plex's own transcoder and looking at it — a season key off by one is invisible in the HTTP status.

```bash
curl -s "$PLEX_URL/photo/:/transcode?width=400&height=600&url=%2Flibrary%2Fmetadata%2F<key>%2Fthumb%3FX-Plex-Token%3D$PLEX_TOKEN&X-Plex-Token=$PLEX_TOKEN" -o check.jpg
```

Season `ratingKey`s come from `/library/metadata/<showRatingKey>/children`.

Watch the shell: `curl -w` has no `%-22s`, and a stray label argument after `-w` is parsed as another URL, producing a phantom `HTTP 000` beside the real `200`.
