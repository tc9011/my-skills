---
name: blog-to-wechat-pipeline
description: "End-to-end pipeline that takes a blog article and produces a complete 微信公众号 publishing package: WeChat-formatted content (copied to clipboard) + cover image. Optionally includes fetching from URLs, downloading embedded images, and translation for non-Chinese sources. Use this skill when the user wants multiple publishing steps handled together — formatting + cover, or translate + format + cover. Triggers on: '转公众号格式并配图', '公众号排版+封面', 'blog-to-wechat-pipeline', '翻译后发公众号', '做成公众号发布素材', '和上面一样的流程', '走一下公众号流程', '翻译成中文放进blog', '把这个链接翻译发公众号', or any bundled article-to-WeChat workflow. Also triggers when user shares a URL and mentions both translation and blog/公众号. If the user only needs one step, prefer the specific skill: wechat-md (formatting), baoyu-cover-image (cover), or baoyu-translate (translation)."
---

# Blog → WeChat Pipeline

Fetch source → download images → (optionally translate) → save as blog post → format for 微信公众号 → generate cover image → report.

## When to use this skill

The user wants **two or more** of these for a blog article:
1. Fetch and translate a foreign-language article into Chinese
2. Save as a blog post with images in the correct directory structure
3. WeChat 公众号排版 (copied to clipboard)
4. Cover image generation

If they only want one, use the specific skill directly:
- formatting only → `wechat-md`
- cover only → `baoyu-cover-image`
- translation only → `baoyu-translate`

## Deciding what phases to run

| Signal | Phases |
|--------|--------|
| User provides a URL | Fetch → rest of pipeline |
| Source is in a foreign language | Fetch → Translate → Blog post → rest |
| Source article is already a local Chinese markdown | Skip fetch/translate → Blog post (if needed) → rest |
| User says "翻译" / "translate" | Include translation regardless |
| User says "放进 blog" / "存到博客" | Include blog post creation |
| User says "公众号排版" / "微信格式" | Include WeChat formatting |
| User says "封面" / "配图" / "cover" | Include cover image generation |

## Execution flow

### Phase -1 (conditional): Fetch source content

When the user provides a URL instead of a local file, fetch the article content first.

#### Fetching strategy (try in order)

1. **Jina Reader** (most reliable for general web): `https://r.jina.ai/<url>` — returns clean markdown
2. **`defuddle` skill** — good for standard web pages, strips navigation/ads
3. **`agent-reach` skill** — for platform-specific content (Twitter/X, 小红书, YouTube, etc.)
4. **Direct `webfetch`** — last resort, may include navigation clutter

#### Platform-specific notes

| Platform | Best method | Gotchas |
|----------|-------------|---------|
| Twitter/X long posts | Jina Reader (`r.jina.ai`) | Thread posts need full unrolling; `xreach` requires auth |
| Blog/article sites | Jina Reader or defuddle | Standard approach works well |
| WeChat articles | agent-reach (微信公众号 channel) | May need browser session |
| YouTube | agent-reach (transcript extraction) | Video → text transcription |

#### Save source content

Save the fetched raw content to `translate/<slug>.md` as a working copy. This preserves the original for reference throughout the pipeline.

### Phase 0 (conditional): Download embedded images

Source articles often contain images hosted on external CDNs. These must be downloaded **before** translation or blog post creation, because the blog needs local image paths.

1. **Extract image URLs** from the fetched markdown (look for `![...](https://...)` patterns)
2. **Create the image directory**: `src/content/posts/_images/<post-title>/`
   - The folder name must match the blog post filename (without `.md`)
   - For translated posts, include the `【译】` prefix in the folder name
3. **Download each image** via `curl` or `webfetch` to the image directory
   - Name files descriptively: `image-01-<brief-description>.jpg`
   - Preserve original format (jpg, png, webp)
4. **Rewrite image paths** in the article content to use blog-relative paths:
   ```markdown
   ![alt text](../_images/<post-title>/image-01-description.jpg)
   ```

### Phase 1 (conditional): Translation

Only run when translation is needed. Follow the `baoyu-translate` skill — check its EXTEND.md for the user's preferred translation mode (quick/normal/refined).

The `baoyu-translate` EXTEND.md typically specifies `default_mode: refined` for this user, which means a multi-pass workflow:
1. Content analysis → `01-analysis.md`
2. Translation prompt → `02-prompt.md`
3. Initial draft → `03-draft.md`
4. Critical review → `04-critique.md`
5. Revised translation → `05-revision.md`
6. Final polish pass

Save translation artifacts to `translate/<slug>-zh-CN/`.

#### Translation quality bar
- Preserve facts, numbers, links, code blocks, and citations exactly
- Write natural Chinese suitable for a technical blog — not literal translation
- Keep the article structure, headings, lists, and footnotes
- Keep widely-understood English terms as-is (API, SDK, Agent, RAG, Claude Code, Skills, etc.) rather than forcing translations
- Place `<!--more-->` after the source attribution block (original URL, author, date)

### Phase 2: Create blog post

Save the translated (or original Chinese) article as a blog post.

#### Blog structure conventions

The blog is an Astro project at `/Users/tangcheng/Documents/Projects/blog/`.

**Posts directory**: `src/content/posts/<YYYY>/` (grouped by year)

**Image directory**: `src/content/posts/_images/<post-title>/`
- Folder name = exact post filename without `.md`
- For translated posts: `_images/【译】Full Title Here/`

**Content schema** (from `src/content.config.ts`):
```yaml
---
title: string       # required
published: date      # required (format: YYYY-MM-DD HH:mm:ss)
description: string  # optional, defaults to ''
updated: date        # optional
tags: string[]       # optional, defaults to []
draft: boolean       # optional, defaults to false
pin: number          # optional (0-99), defaults to 0
toc: boolean         # optional, defaults to theme setting
lang: string         # optional ('zh', 'en', '', etc.)
abbrlink: string     # optional
---
```

There is NO `cover`, `image`, or `thumbnail` field in the schema. Cover images live in the `_images/` directory but are not referenced in frontmatter.

#### Translated post conventions

Examine existing translated posts (e.g., `【译】从原型到生产.md`) for patterns:
- Filename starts with `【译】`
- Title in frontmatter also starts with `【译】`
- Tags include `翻译` plus topic-specific tags
- Source attribution as a blockquote right after frontmatter:
  ```markdown
  > 原文：[Original Title](https://original-url.com)
  > 作者：Author Name
  > 发布日期：YYYY 年 M 月 D 日
  ```
- `<!--more-->` placed after the attribution block
- `lang: zh` for Chinese translations
- `toc: true` for long-form articles

#### Image path format

All image references use relative paths from the post file:
```markdown
![描述](../_images/【译】Post Title/image-01-description.jpg)
```

#### Validation checklist

Before moving to the next phase:
- [ ] Frontmatter has `title`, `published`, `tags`, `toc`, `lang`
- [ ] File is in the correct `src/content/posts/<YYYY>/` directory
- [ ] All image paths resolve to actual files in `_images/`
- [ ] No broken image references
- [ ] `<!--more-->` is present for excerpt control
- [ ] Run `pnpm build` to verify the post renders without errors

### Phase 3: WeChat formatting

Follow the `wechat-md` SKILL.md workflow. Key steps:

1. **Prepare**: `node <wechat-md-skill>/scripts/prepare-markdown.js <article> --strip-frontmatter`
2. **Serve**: `python3 <wechat-md-skill>/scripts/temp-http.py /tmp` (background, capture SERVER_URL)
3. **Navigate**: open `https://md-wechat.vercel.app/`
4. **Style**: evaluate JS to set localStorage preset, then reload
5. **Inject**: evaluate JS — fetch from local server + `focus()` + `selectAll` + `execCommand('insertText')`
   - The CodeMirror view API (`cmView.dispatch()`) is not accessible on this site — use `execCommand` which works through CodeMirror's native input handling
6. **Verify**: snapshot — check first paragraph matches article
7. **Mermaid diagrams** (if any): widen clipped labels right before copying (lesson 9)
8. **Copy**: click 复制 button (toast auto-dismisses, click success = copy success)
9. **Diagram backups** (if any): export each mermaid diagram as a PNG next to the cover (lesson 10)
10. **Clean**: kill HTTP server

### Phase 4: Cover image generation

**Can run in parallel with Phase 3** — start the image generation while browser automation runs.

#### Default style (the user's published covers)

The user's published covers share one look: a dark tech scene with neon glow, rendered in 3D. Match it unless the user asks otherwise.

| Dimension | Value |
|-----------|-------|
| Type | conceptual — one hero object in the center (e.g., a glowing chip carrying the topic's symbol), with the article's key ideas as stations around it |
| Palette | dark — deep navy to black; neon cyan and electric blue as the main glow; amber/orange for arrows and highlights; a little violet |
| Rendering | digital — 3D isometric render from an elevated three-quarter view, cinematic lighting, bloom, glossy chips, frosted glass panels |
| Text | no article title; a few short English UI labels are fine (e.g., `SKILL.md`, `PASS`, stage names) |
| Mood | bold |
| Aspect | 16:9, hero exactly centered, key elements inside the central band |
| Watermark | disabled |

Recurring elements: circuit-board traces and a faint grid on the floor; loops drawn as glowing ring tracks or orbit rings with arrows; floating holographic cards with tiny code or markdown; small dark terminal panels near the edges, slightly out of focus.

Override only the dimensions the user explicitly mentions. If user says "带标题" → `text: title-only`.

#### Image generation methods (try in order)

Use a raster image model. Write the full prompt to `cover-image/<topic-slug>/prompts/NN-cover-<slug>.md` first (baoyu-cover-image rule), then:

1. **Runtime-native image tool** (OpenCode: `experimental_image_generate`). It has no aspect-ratio parameter, so state the ratio in the prompt and check the output size with `sips -g pixelWidth -g pixelHeight`.
2. **`nano-banana-pro` skill** (if installed):
   ```bash
   uv run <nano-banana-pro-skill>/scripts/generate_image.py \
     --prompt "<detailed visual description>" \
     --filename "<workspace>/cover-image/<topic-slug>/cover.png" \
     --resolution 1K
   ```
3. **Codex CLI** (`codex-imagegen` in baoyu-cover-image), only when `codex login status` shows a login.
4. **Other image generation skills** (if installed).

If a backend fails with a credential error (`API key not valid`, `Invalid credential`), retrying won't help:
- List the image models (OpenCode: the `models` tool with `type: "image"`) and the stored credentials (`opencode auth list`). Models from the same provider share one credential, so they fail together.
- Ask the user which working model to use, or which credential to fix. Pass `model` only after the user picks one.
- Keep the prompt file; regenerate from it once a backend works.

If no backend works, offer the user two options: fix a credential, or draw the cover in the browser yourself ("Code-rendered cover" below). baoyu-cover-image forbids code-rendered substitutes by default, so draw it only after the user agrees. Don't use flat Pillow drawings: they don't match the house style.

#### Cover image prompt design

1. Analyze the article → pick the core concept and a visual metaphor (for a workflow or loop: a ring track around a central chip, one station per stage).
2. Write the prompt in this order: house style (dark background, 3D isometric, neon glow, palette with hex values) → scene → composition → constraints.
3. Put every readable label in quotes and add "no other text". Keep labels to a few short English words: models misspell long text, and baoyu-cover-image forbids fixing text with code afterwards.
4. Compose for WeChat's crops: WeChat crops the cover to 2.35:1 for the article card and 1:1 for the share thumbnail. Put the hero exactly in the center and keep important elements inside the central band (top and bottom ~12% background only).
5. NO logos, NO watermark, NO human figures (unless specifically requested)

#### Code-rendered cover (only after the user agrees)

Start from [templates/neon-cover.html](templates/neon-cover.html): an HTML/SVG scene with a perspective-projected circuit floor, a glowing ring with stations, a 3D chip in the center, glass panels and corner code cards. The comment at the top of its script lists what to change per article.

1. Copy the template to `cover-image/<topic-slug>/`, then change the stations, panel drawings, corner cards and chip icon to fit the article. Labels and code are real text, so they can't be misspelled; keep them short and in English.
2. Open the file in the browser tool (`file://...`), check the console for errors, and take a full-page PNG screenshot (`fullPage: true`). At devicePixelRatio 2 this gives 3840×2160.
3. Resize to 2400×1350 with Pillow (`Image.LANCZOS`). If the screenshot is only 1920×1080 (devicePixelRatio 1), keep it as is instead of upscaling.
4. Look at the result and at both WeChat crops (2.35:1 and a centered 1:1). Panels must not cover the ring's arrowheads, and the top panel must stay inside the 2.35:1 band; adjust `lift` / `shift` or the camera constants and re-render.
5. Close the page. Keep the HTML in `cover-image/<topic-slug>/` as the source record; it plays the role of the prompt file.

#### Save location

Generate into `cover-image/<topic-slug>/` (working directory or temp), check it, then copy it to the blog's image directory. When regenerating, back up the previous cover first.
```
src/content/posts/_images/<post-title>/cover.png
```

### Phase 5: Report

```
📋 公众号排版
- 源文件: <path>
- 状态: ✅ 已复制到剪贴板

🎨 封面图
- 位置: <path>
- 尺寸: <width>×<height>
- 生成方式: <method used>
- 风格: <type> / <palette> / <rendering> / <text> / <aspect>
```

If the article has mermaid diagrams, add:
```
🖼 流程图图片（备用）
- 位置: <path>
- 用法: 粘贴后图里缺字或缺箭头，就删掉那张图，换成这张
```

If translation was included, add:
```
📝 翻译
- 源语言: <lang>
- 模式: <quick/normal/refined>
- 博客文章: <path>
- 图片目录: <path> (<N> images)
```

If source was fetched from URL, add:
```
🔗 源内容
- 来源: <url>
- 获取方式: <method used>
- 原文备份: <path>
```

## Parallelization strategy

Overlap work to minimize total time:

```
T0: Fetch source content (if URL)
T1: Download images + Start translation (can overlap if images finish fast)
T2: Create blog post (after translation + images ready)
T3: Start HTTP server (background) + Start cover image generation (background)
T4: Browser: navigate → style → reload → inject → verify → fix mermaid labels → copy → export diagram PNGs
T5: Kill HTTP server + Collect cover image
T6: Report all results
```

## Critical lessons from prior runs

### 1) CodeMirror injection method
The CodeMirror view API (`cmView.dispatch()`, `cmTile.view`) is not exposed on md-wechat.vercel.app. Use the browser's editing API instead:
```
cmContent.focus() → document.execCommand('selectAll') → document.execCommand('insertText', false, text)
```

### 2) Blog image paths in WeChat preview
Relative image paths from the blog project won't render in md-wechat preview. This is expected and does NOT affect the clipboard output.

### 3) Toast notification for 复制
The success toast auto-dismisses in ~2 seconds. A successful click = content is in clipboard. Don't waste rounds trying to catch the toast.

To check what was copied (macOS), read the HTML flavor: `osascript -e 'the clipboard as «class HTML»'` returns `«data HTML<hex>»`. Decode the hex and check the first paragraph, the number of `<table` and `<svg`, or a label's width. Don't run `pbcopy` while checking; it overwrites the copied article.

### 4) Keep browser tab consistent
Reuse the same tab/targetId across all browser calls within one formatting run.

### 5) Image downloading from CDNs
Twitter/X images use `pbs.twimg.com` CDN URLs with format parameters (e.g., `?format=jpg&name=large`). Download these directly with `curl` — no auth needed for public images. Rename to descriptive filenames rather than keeping CDN hashes.

### 6) Content schema has no cover field
The Retypeset theme's content schema (in `src/content.config.ts`) does NOT have a `cover`, `image`, or `thumbnail` frontmatter field. Don't try to add one — it will cause a build error. Cover images are stored in `_images/` for manual use only.

### 7) Jina Reader for Twitter/X
When `xreach` or `agent-reach` isn't authenticated for Twitter/X, Jina Reader (`r.jina.ai/<twitter-url>`) reliably extracts thread content including image URLs.

### 8) Build verification
Always run `pnpm build` after creating a blog post. The build takes ~60s and validates frontmatter schema, image processing (LQIP), and page generation. A 120s timeout may not be enough — use 300s.

### 9) Mermaid labels get clipped in md-wechat
md-wechat renders mermaid to SVG and puts each label in a `<foreignObject>` sized when the diagram is drawn. The article styles then add letter spacing to `<p>`, so edge labels (e.g., "不通过") end up wider than their box and get the last character cut off, both in the preview and in the copied HTML. Right before clicking 复制, widen every label that overflows and re-center it:

```js
document.querySelectorAll('#output .mermaid-diagram svg foreignObject').forEach((f) => {
  const c = f.firstElementChild
  if (!c || c.scrollWidth <= +f.getAttribute('width'))
    return
  const w = c.scrollWidth + 2
  f.setAttribute('width', w)
  const g = f.parentElement
  const m = /translate\(\s*([-\d.]+)[ ,]+([-\d.]+)\s*\)/.exec(g.getAttribute('transform') || '')
  if (m)
    g.setAttribute('transform', `translate(${-w / 2}, ${m[2]})`)
})
```

The fix only lives in the page DOM, so run it again if the preview re-renders. Then confirm the new widths in the clipboard HTML (lesson 3).

### 10) Export mermaid diagrams as PNG backups
The WeChat editor filters some SVG features, so a pasted mermaid diagram may lose text or arrows, and this can't be checked without the WeChat backend. Export each diagram as a PNG next to the cover so the user can swap it in:
1. Clone the diagram's SVG into a wrapper appended to `document.body`: `position:fixed; left:0; top:0; z-index:2147483647; background:#fff; padding:32px`, with the SVG at `width:960px; max-width:none; height:auto`. Outside `#output` the letter spacing no longer applies, so the labels fit.
2. Take a viewport screenshot, then crop the wrapper's rect × `devicePixelRatio` with Pillow. CSS `zoom` on the original diagram does not enlarge an element screenshot.
3. Remove the wrapper and save the PNG as `src/content/posts/_images/<post-title>/<name>-diagram.png`.

## Batch mode

When the user wants multiple articles processed:
- Process sequentially (one article at a time)
- Reuse the same browser tab for WeChat formatting
- Each article: fetch → images → translate → blog post → format → cover → report
- Final summary listing all paths

## Example triggers

- "把这篇文章转成微信公众号格式并配图"
- "blog-to-wechat-pipeline 这个 md 文件"
- "公众号排版 + 封面，图不要文字"
- "和上面一样的流程转一下这篇"
- "翻译这篇英文文章，放进 blog，然后排成公众号格式再配封面"
- "帮我把这几篇都走一遍公众号流程"
- "帮我把 https://x.com/... 翻译成中文，图片也下载下来，配封面图"
- "把这个链接做成一套公众号发布素材"
