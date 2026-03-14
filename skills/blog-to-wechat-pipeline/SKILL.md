---
name: blog-to-wechat-pipeline
description: Use this skill when the user wants a single article turned into a complete 微信公众号 publishing package across 2 or more linked steps: translating it into Chinese for the blog, saving or updating the blog post with correct local image paths, formatting the final article into wechat-md / 微信公众号-ready content, and generating a matching cover image (including no-title variants). Trigger on requests like “翻译后发公众号”, “做成公众号发布素材”, “blog 这篇文章转公众号并配封面”, or any bundled article-to-blog-to-WeChat workflow. Do NOT use for translation only, wechat-md formatting only, cover generation only, or generic原创写作 without this multi-step adaptation pipeline.
---

# Blog → WeChat Pipeline

Use this skill when the user wants the **whole publishing flow** handled, not just one isolated step.

Typical workflow:
1. Translate the source article into Chinese and save it into the blog project
2. Make sure blog-local assets (especially images) are stored and referenced correctly
3. Format the final article into WeChat-compatible content with `wechat-md`
4. Generate a WeChat/blog cover image
5. If needed, produce a text-free cover variant or other lightweight edits

## What this skill is for

This skill is optimized for Theon's actual workflow around:
- article translation for the blog at `/Users/tangcheng/Documents/Projects/blog`
- WeChat public-account formatting
- cover image generation for translated technical articles

If the user only wants **one** narrow step, prefer the more specific skill directly:
- translation only → `baoyu-translate`
- WeChat formatting only → `wechat-md`
- cover image only → `baoyu-cover-image`

Use **this** skill when the user clearly wants the pipeline captured or executed end-to-end.

## Critical lessons from prior runs

### 1) Blog image paths must be validated against the real project structure
Two translated posts previously had broken images because relative paths were written incorrectly. Do not assume a generic image folder layout.

Always verify the article's actual image convention in the blog project before finalizing:
- inspect nearby existing posts
- inspect the actual `_images` or equivalent directory
- make sure the markdown image path matches the blog's real relative path rules

Do not ship the article until image paths are checked.

### 2) `wechat-md` means the local skill flow first
When the user says to use `wechat-md`, prefer the local `wechat-md` skill workflow rather than defaulting to a raw MCP call.

The intended flow is:
- read the article markdown
- run the helper script that strips frontmatter / `<!--more-->`
- open `https://md-wechat.vercel.app/`
- inject content into the editor
- apply style settings
- click `复制`
- tell the user the result is in the clipboard

### 3) Cover generation may require model credentials and quota checks
Before spending time debugging prompts, confirm that the image backend is actually usable:
- required API key exists
- quota is not exhausted
- if a key was pasted in chat, warn that it should later be rotated because the chat history now contains it

## Inputs to gather

Before running the full flow, gather or infer these:
- source article URL or file
- target language (default `zh-CN` unless user says otherwise)
- translation mode (default `refined` for publishable content)
- target blog project path (default `/Users/tangcheng/Documents/Projects/blog` in this environment)
- whether the user wants WeChat formatting now or later
- whether the user wants a cover image now or later

If preferences already exist for the underlying skills, reuse them.

## Execution workflow

## Step 1: Translate and save into the blog

When translation is requested:
1. Use `baoyu-translate` conventions and preferences
2. Inspect nearby existing blog posts to match the house format
3. Save the translated article into the correct blog content directory
4. Download article images if needed and store them in the blog's actual image directory structure
5. Validate all image paths before claiming completion

### Translation quality bar
- preserve facts, numbers, links, and citations
- write natural Chinese suitable for a technical blog
- keep the article structure, headings, lists, and footnotes
- avoid literal translation when it hurts readability

### Blog output checklist
- frontmatter matches local style
- title is appropriate for the blog
- `<!--more-->` is placed correctly if the project uses it
- image paths resolve according to the blog's real structure
- article file is saved in the correct year/content directory

## Step 2: Format for WeChat with `wechat-md`

If the user asks for 公众号 formatting, use the **local `wechat-md` skill flow**.

### Workflow
1. Read the final markdown article
2. Run the helper script:
   - `node <wechat-md-skill>/scripts/create-injection.js <markdown-file> --strip-frontmatter`
3. Open `https://md-wechat.vercel.app/`
4. Apply the desired localStorage-based style preset
5. Inject the cleaned article content into the editor
6. Verify the editor and preview both updated
7. Click `复制`
8. Tell the user the WeChat-formatted content is now in the clipboard

### Important notes
- image loading errors in the online editor can be harmless when the blog uses relative local image paths
- the goal is clipboard-ready rendered content, not a local HTML export unless the user explicitly asks
- when using browser automation, keep to one tab and verify the `复制` button really fired

## Step 3: Generate the cover image

If the user asks for a cover image, use `baoyu-cover-image` conventions.

### Default behavior for technical translated articles
Unless the user specifies otherwise, a good starting point is:
- type: `conceptual`
- palette: `cool`
- rendering: `flat-vector`
- text: `title-only`
- mood: `balanced`
- font: `clean`
- aspect: `16:9`

This combination fits technical research / engineering articles well.

### Cover prompt guidance
For translated technical articles, prefer:
- abstract conceptual composition over realistic people
- clean editorial/infographic visual language
- code / network / diagram / debugging / AI motifs when relevant
- strong readability at blog header size
- restrained, non-marketing visual tone unless the article is explicitly hype-oriented

### Output expectations
Save:
- the prompt file
- the generated `cover.png`
- any source references if used

If the user wants the cover used in the blog immediately, also place or copy it into the blog's expected asset location.

## Step 4: Optional cover cleanup edits
A common follow-up is removing large title text from the generated cover.

If asked to remove title text:
- use the image editing backend on the generated cover
- preserve composition, colors, style, and balance
- remove the text cleanly without adding replacement text
- save as a variant such as `cover-no-title.png`

## Communication style
- Be concise and operational
- Tell the user what is done, what path it was saved to, and what remains blocked
- If blocked by credentials/quota, say that directly instead of pretending the problem is prompt quality

## Output structure
When the pipeline completes, report in this style:

- article: `<path>`
- WeChat formatting: `copied to clipboard` or `not run`
- cover image: `<path>` or `not run`
- cover variant: `<path>` or `not run`
- important note: any path, credential, or quota caveat

## Example triggers
- “把这篇文章翻译一下，放进 blog，然后排成公众号格式，再做个封面图”
- “把这个链接做成一套公众号发布素材”
- “帮我把译文、公众号排版和封面图整个流程跑掉”
- “把 blog 里的这篇文章转成微信公众号可发的版本，并配封面”

## Non-goals
This skill is not for:
- pure social posting strategy
- writing entirely new原创文章 from scratch without a source article
- direct publishing to the WeChat backend
- generic image generation unrelated to article publishing
