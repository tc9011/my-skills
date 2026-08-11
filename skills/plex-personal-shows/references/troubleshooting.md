# Troubleshooting

Symptom first. Each entry ends in the fix that actually worked.

## Two unrelated shows merged into one

**Symptom** — `2022年卡塔尔世界杯` displays 11 episodes and contains a `季 2014` that belongs to a different folder.

**Cause** — the library agent is an online one (`Plex TV Series` / TMDB / TVDB). It resolved both Chinese show names to the same online entry, and identical GUID means Plex merges them. Blank posters and missing summaries are the tell: matching failed at the metadata level but still bound the two together.

**Fix** — set the agent to **Personal Media** first (otherwise the next refresh re-merges), then split: show page → `...` → 拆分. If the merge returns, Plex Dance it.

## Titles stay `Episode N` / `剧集 N` after switching agent and refreshing

**Cause** — refresh re-runs the *agent*, never the *scanner*. And even a correct scanner would not help: Plex's series scanner does not extract titles from filenames at all. Plex's own docs on home series media say any extra information in the filename "is currently ignored".

**Fix** — write titles through the API and lock them (`scripts/plex_titles.py`). This is the normal path, not a workaround.

## An episode vanished, and phantom seasons appeared

**Symptom** — 9 files scanned into seasons 1, 12 and 20; `S1E7` missing; two episodes numbered `E2026`.

**Cause** — dates in the path. `2026年世界杯.S01E07.2026.07.12.世界杯 阿根廷 vs 瑞士` contains a dot-separated date that Plex's date-based episode pattern matches ahead of `S01E07`.

**Related** — two matches sharing a date collapse into one episode with all parts stacked together: `06.27` appeared twice in the 2018 folder, so 7 matches scanned as 6 episodes.

**Fix** — remove every date from show, season and episode names. The pipeline's naming template already does this; a reorganize into date-free paths also delivers a free Plex Dance, since Plex treats new paths as new items.

## Plex Dance

Needed when metadata must be rebuilt at unchanged paths.

1. Move the show folder outside the library root (`mv`, same volume, instant)
2. Scan the library — the entries drop into the trash
3. Empty the trash — this is the step that actually forgets them
4. Move the folder back
5. Scan again

Renaming into a new directory structure accomplishes the same thing in one pass, which is why the pipeline never needs an explicit dance.

## A stacked episode reports only one part's duration

**Cause** — the stack did not form. Filenames must be byte-identical apart from the `- ptN` suffix; check for a double space, a different extension, or a mismatched codec between parts.

**Fix** — re-probe (pipeline step 2) and rename. If parts genuinely differ in encoding, either keep them as separate episodes or join them losslessly: same-parameter MPEG-TS concatenates with `ffmpeg -f concat -c copy`, no re-encode. Run that on the NAS over SSH rather than pulling hundreds of GB across a network mount.

## Episode titles show upload-site junk, or two episodes share a title

**Cause** — mp4 files carry an embedded title tag, and Plex prefers it over `Episode N`. Uploaders often tag a whole batch with the first match's name.

**Fix** — the API write-back overrides it. No need to touch the file.

## Verify against the API, never the assumption

Every claim in the final report should come from a read-back:

```bash
curl -s "$PLEX_URL/library/sections/5/all?X-Plex-Token=$PLEX_TOKEN"
curl -s "$PLEX_URL/library/metadata/<showRatingKey>/allLeaves?X-Plex-Token=$PLEX_TOKEN"
```

`allLeaves` returns every episode with `title`, `duration`, `parentIndex` (season), `index` (episode) and one `<Part>` per stacked file — enough to confirm titles, durations and stack formation in a single call.
