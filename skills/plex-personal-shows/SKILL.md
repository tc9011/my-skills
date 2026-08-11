---
name: plex-personal-shows
description: "Organize personal media that Plex cannot match online — sports match recordings, home videos, course series, concerts — into a clean TV library with correct seasons, stacked multi-part episodes, written-back episode titles, and posters. Use when the user wants recordings (世界杯, 欧冠, 西甲, 球赛, 比赛录像) organized into or repaired inside Plex; when Plex shows 'Episode 1' / '剧集 1' instead of real titles; when unrelated folders merged into one show; when a date in the path became the season or episode number; or when posters are needed for a show and its seasons. Triggers: 整理比赛, 加进 Plex, Plex 不识别, 剧集标题不对, plex dance, episode stacking, season poster."
---

# Plex Personal Shows

Personal media has no online match. Plex's scanner extracts only **show / season / episode** from the path; everything else you want — the episode title above all — is **written back** through the API afterwards and locked.

Internalize that sentence before touching anything. Four rounds of failed guessing come from assuming the filename's title survives the scan. It never does.

## Ground truths

Consult before planning; each one is a rule some earlier run learned the hard way.

| Fact | Consequence |
|---|---|
| Plex never derives episode titles from filenames | Titles arrive via API `title.value` + `title.locked=1`; the filename title is only for humans and for Emby/Jellyfin portability |
| An online agent gives two different folders the same GUID | Library agent must be **Personal Media** (`tv.plex.agents.none`), or unrelated shows silently merge |
| "Refresh metadata" re-runs the agent, never the scanner | Scanner-derived data is fixed at first scan; changing it needs a **Plex Dance** — and a reorganize into new paths *is* a free Plex Dance |
| A date in the path outranks `SxxExx` | Strip every date from show / season / episode names; `2026.07.12` became season 12 episode 2026 |
| 4-digit season numbers work | `Season 2014` + `S2014E03` is valid and reads better than mapping tournaments to `S01`–`S04` |
| mp4 carries an embedded title tag | Plex shows it instead of `Episode N`; the API write-back overrides it |

## Naming template

```
<Library root>/<Show>/Season <YYYY>/<Show> - S<YYYY>E<NN> - <Title>[ - pt<N>].<ext>
```

- **`<Title>`** — round + matchup, no dates: `决赛 德国vs阿根廷`, `八分之一决赛次回合 巴萨vs巴黎圣日耳曼`
- **`pt<N>`** — **stacking**: several files playing as one episode. Only `ptN`/`partN`/`cdN`/`discN`/`diskN`/`dvdN`, max 8, filenames byte-identical apart from the suffix. Order by play order: 上半场→pt1, 下半场→pt2, 加时→pt3, 点球/颁奖→pt4. Single-file episodes take no suffix.
- **`E<NN>`** — official match numbers when they exist and run chronologically (2014 World Cup: E03, E07, E64); otherwise sequential by date.
- Titles must be unique within a season. Two same-matchup fixtures need a discriminator that is not a date — a round number (`国家德比第33轮` vs `国家德比第17轮`) works; verify it rather than guessing.

## Pipeline

Preconditions: library type **TV Shows**, agent **Personal Media**, and `PLEX_URL` + `PLEX_TOKEN` exported. Get a token from Plex Web: any item → `...` → 获取信息 → 查看 XML → `X-Plex-Token=` in the address bar.

### 1. Inventory

List every media file with its byte size and record the **byte total**. That number is the safety gate for the whole run.

Done when: a source→target row exists for every media file, and the byte total is written down.

### 2. Probe

`ffprobe` every file. Within one episode, codec / resolution / frame rate / audio codec / channels must match, or stacking misbehaves.

```bash
ffprobe -v quiet -select_streams v:0 -show_entries stream=codec_name,width,height,avg_frame_rate,field_order -of csv=p=0 FILE
ffprobe -v quiet -select_streams a:0 -show_entries stream=codec_name,channels,sample_rate -of csv=p=0 FILE
```

`-v quiet` matters — decoder warnings otherwise flood the values. Sum each episode's durations now; step 7 checks Plex against these numbers.

Done when: every multi-file episode is confirmed uniform, or split into separate episodes.

### 3. Dry-run

Write the mapping as an explicit source→target table in a script — one row per file, no pattern guessing — with a `dry`/`apply` switch that prints every row and flags unmapped ones. Run `dry` and read all of it.

Done when: printed rows equal the file count and nothing is flagged.

### 4. Apply

`mv` only. On the same volume this is a metadata rename — instant, no bytes move, even over AFP/SMB to a NAS. Never `cp` hundreds of GB across a network mount.

Done when: the target byte total equals the recorded source total, exactly.

### 5. Prune

Delete `.DS_Store` / `.vsmeta` leftovers, then `rmdir` the old tree. `rmdir` refuses non-empty directories, so it fails loudly if a file was missed — that safety is the whole reason to prefer it over `rm -rf`.

Done when: `rmdir` succeeded and the old paths are gone.

### 6. Scan

`scripts/plex_scan.sh <sectionId>` triggers the scan, polls until `refreshing=0`, then empties the trash. Emptying is what removes the stale shows whose files just moved.

Done when: `/library/sections/<id>/all` no longer lists the stale shows, and the target show reports the expected season and episode counts.

### 7. Write back and verify

`scripts/plex_titles.py <showRatingKey>` prints the change list; re-run with `apply` to write and lock. It parses the title out of the filename, so the on-disk name and Plex agree.

Then read back through the API — titles, durations, part counts — and compare durations against step 2's sums. A stacked episode reporting only one part's duration means the stack did not form.

Done when: every episode's title, duration and part count is confirmed by an API read, not by assumption.

### 8. Posters (optional)

Only when the user asks for artwork → read [`references/posters.md`](references/posters.md).

## When something looks wrong

Symptom-driven diagnosis — merged shows, `Episode N` titles surviving a refresh, phantom seasons, missing episodes → read [`references/troubleshooting.md`](references/troubleshooting.md).

## Reporting

Give the user a table per season: episode number, title, duration, part count. State the byte-total match explicitly. Flag every judgement you made that the source files did not state — round numbers, group letters, matchup order taken from the filename over the folder name — and say plainly when you refused to invent one.

Delete temp scripts at the end; they carry the token in plaintext. Remind the user they can revoke it under 设置 → 授权设备.
