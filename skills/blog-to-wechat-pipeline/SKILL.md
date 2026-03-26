---
name: blog-to-wechat-pipeline
description: "End-to-end pipeline that takes a blog article and produces a complete 微信公众号 publishing package: WeChat-formatted content (copied to clipboard) + cover image. Optionally includes translation for non-Chinese sources. Use this skill when the user wants multiple publishing steps handled together — formatting + cover, or translate + format + cover. Triggers on: '转公众号格式并配图', '公众号排版+封面', 'blog-to-wechat-pipeline', '翻译后发公众号', '做成公众号发布素材', '和上面一样的流程', '走一下公众号流程', or any bundled article-to-WeChat workflow. If the user only needs one step, prefer the specific skill: wechat-md (formatting), baoyu-cover-image (cover), or baoyu-translate (translation)."
---

# Blog → WeChat Pipeline

Take a blog article → (optionally translate) → format for 微信公众号 → generate cover image → report.

## When to use this skill

The user wants **two or more** of these for a blog article:
1. Translation into Chinese (only when requested or the source is not Chinese)
2. WeChat 公众号排版 (copied to clipboard)
3. Cover image generation

If they only want one, use the specific skill directly:
- formatting only → `wechat-md`
- cover only → `baoyu-cover-image`
- translation only → `baoyu-translate`

## Deciding whether translation is needed

- **User explicitly says "翻译" / "translate"** → include translation step
- **Source article is in a foreign language** → include translation step
- **Source article is already in Chinese** and user didn't mention translation → skip translation, go straight to formatting + cover

## Execution flow

### Phase 0 (conditional): Translation

Only run this phase when translation is needed.

Follow the `baoyu-translate` skill conventions:

1. Translate the source article into Chinese
2. Save the translated article into the blog project at the correct path
3. Validate image paths against the blog's actual directory structure

#### Translation quality bar
- Preserve facts, numbers, links, code blocks, and citations exactly
- Write natural Chinese suitable for a technical blog — not literal translation
- Keep the article structure, headings, lists, and footnotes
- Translate technical concepts accurately; keep widely-understood English terms (e.g., API, SDK, Agent, RAG) as-is rather than forced-translating them
- Place `<!--more-->` in the same relative position as the original

#### Blog output checklist
- Frontmatter matches local blog style (check nearby existing posts)
- Title is appropriate and natural in Chinese
- Image paths resolve according to the blog's real directory structure
- Article saved in the correct year/content directory under `/Users/tangcheng/Documents/Projects/blog/src/content/posts/`

### Phase 1: WeChat formatting

Follow the `wechat-md` SKILL.md workflow. Key steps:

1. **Prepare**: `node <wechat-md-skill>/scripts/prepare-markdown.js <article> --strip-frontmatter`
2. **Serve**: `python3 <wechat-md-skill>/scripts/temp-http.py /tmp` (background, capture SERVER_URL)
3. **Navigate**: open `https://md-wechat.vercel.app/`
4. **Style**: evaluate JS to set localStorage preset, then reload
5. **Inject**: evaluate JS — fetch from local server + `focus()` + `selectAll` + `execCommand('insertText')`
   - The CodeMirror view API (`cmView.dispatch()`) is not accessible on this site — use `execCommand` which works through CodeMirror's native input handling
6. **Verify**: snapshot — check first paragraph matches article
7. **Copy**: click 复制 button (toast auto-dismisses, click success = copy success)
8. **Clean**: kill HTTP server

### Phase 2: Cover image generation

**Can run in parallel with Phase 1** — start the image generation while browser automation runs.

#### Default dimensions (from EXTEND.md preferences)

| Dimension | Value |
|-----------|-------|
| Type | conceptual |
| Palette | cool |
| Rendering | flat-vector |
| Text | **none** (default: no text on cover) |
| Mood | balanced |
| Font | clean |
| Aspect | 16:9 |
| Watermark | disabled |
| Language | zh |

Override only the dimensions the user explicitly mentions. If user says "带标题" → `text: title-only`.

#### Image generation

1. Analyze article content → identify the core concept and a fitting visual metaphor
2. Craft a descriptive prompt:
   - Abstract conceptual composition, not realistic scenes
   - Cool color palette: deep navy (#1a2744), teal (#2dd4bf), sky blue (#40B8FA)
   - Clean geometric shapes, 40-60% whitespace
   - NO text, NO watermark, NO human figures (unless specifically requested)
3. Generate via `nano-banana-pro`:
   ```bash
   uv run <nano-banana-pro-skill>/scripts/generate_image.py \
     --prompt "<detailed visual description>" \
     --filename "<workspace>/cover-image/<topic-slug>/cover.png" \
     --resolution 1K
   ```

### Phase 3: Report

```
📋 公众号排版
- 源文件: <path>
- 状态: ✅ 已复制到剪贴板

🎨 封面图
- 位置: <path>
- 风格: <type> / <palette> / <rendering> / <text> / <aspect>
- 视觉隐喻: <brief description>
```

If translation was included, add:
```
📝 翻译
- 源语言: <lang>
- 译文: <path>
```

## Parallelization strategy

Overlap work to minimize total time:

```
T0: Prepare markdown (strip frontmatter)
T1: Start HTTP server (background) + Start image generation (background)
T2: Browser: navigate → style → reload → inject → verify → copy
T3: Kill HTTP server
T4: Poll image generation for completion
T5: Report both results
```

Image generation typically takes 15-30s, browser automation ~10-15s. Running them in parallel saves significant time.

## Critical lessons from prior runs

### 1) CodeMirror injection method
The CodeMirror view API (`cmView.dispatch()`, `cmTile.view`) is not exposed on md-wechat.vercel.app because the deployment doesn't attach view references to DOM elements. Use the browser's editing API instead — it goes through CodeMirror's native input pipeline:
```
cmContent.focus() → document.execCommand('selectAll') → document.execCommand('insertText', false, text)
```

### 2) Blog image paths
Relative image paths from the blog project won't render in md-wechat preview. This is expected and does NOT affect the clipboard output.

### 3) Toast notification for 复制
The success toast auto-dismisses in ~2 seconds. Don't waste rounds trying to catch it. A successful click = content is in clipboard.

### 4) Keep browser tab consistent
Reuse the same tab/targetId across all browser calls within one formatting run.

### 5) Translation image path validation
When translating articles that contain images, always check the blog project's actual image directory convention (inspect nearby existing posts) before writing paths. Broken image references have been the most common issue in translated posts.

## Batch mode

When the user wants multiple articles processed:
- Process sequentially (one article at a time)
- Reuse the same browser tab
- Each article: prepare → inject → copy → generate cover → report
- Final summary listing all paths

## Example triggers

- "把这篇文章转成微信公众号格式并配图"
- "blog-to-wechat-pipeline 这个 md 文件"
- "公众号排版 + 封面，图不要文字"
- "和上面一样的流程转一下这篇"
- "翻译这篇英文文章，放进 blog，然后排成公众号格式再配封面"
- "帮我把这几篇都走一遍公众号流程"
