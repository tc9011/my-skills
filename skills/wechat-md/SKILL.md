---
name: wechat-md
description: Format Markdown articles into WeChat-compatible HTML using md-wechat.vercel.app via Playwright browser automation. Use when the user asks to format a blog post, article, or markdown file for WeChat (微信公众号), copy formatted content to clipboard, or convert markdown to WeChat HTML. Triggers on "format for WeChat", "微信排版", "WeChat公众号", "copy to WeChat", "format markdown for 公众号", or any task involving converting markdown content for WeChat publication.
---

# WeChat Markdown Formatter

## Overview

This skill automates converting Markdown content into beautifully formatted, WeChat-compatible HTML using [md-wechat.vercel.app](https://md-wechat.vercel.app/). The formatted HTML (with inline styles) is copied to the clipboard, ready to paste directly into the WeChat public account editor.

## Prerequisites

- **Playwright MCP** must be available via `skill_mcp(mcp_name="playwright", ...)`
- The `bash` tool must be available (for creating the injection script)

## Tool Call Syntax Reference

> **CRITICAL**: The Playwright MCP tools have very specific syntax requirements. Follow these EXACTLY.

### browser_navigate — Reliable

```python
skill_mcp(mcp_name="playwright", tool_name="browser_navigate", arguments={"url": "https://md-wechat.vercel.app/"})
```

Also used for page reload (navigate to the same URL again).

### browser_evaluate — Arrow Function Strings ONLY

The `function` parameter MUST be an **arrow function string**. No other format works.

```python
# ✅ CORRECT — arrow function returning a value
skill_mcp(mcp_name="playwright", tool_name="browser_evaluate", arguments={"function": "() => document.title"})

# ✅ CORRECT — arrow function with block body
skill_mcp(mcp_name="playwright", tool_name="browser_evaluate", arguments={"function": "() => { localStorage.setItem('key', 'value'); return 'done'; }"})

# ❌ WRONG — bare expression (error: "not well-serializable")
skill_mcp(mcp_name="playwright", tool_name="browser_evaluate", arguments={"function": "return document.title"})

# ❌ WRONG — IIFE (error: "result is not a function")
skill_mcp(mcp_name="playwright", tool_name="browser_evaluate", arguments={"function": "(() => { ... })()"})

# ❌ WRONG — wrong parameter name
skill_mcp(mcp_name="playwright", tool_name="browser_evaluate", arguments={"expression": "..."})
```

### browser_click — Use ref or element text

```python
skill_mcp(mcp_name="playwright", tool_name="browser_click", arguments={"element": "复制", "ref": "e19"})
```

Use `browser_snapshot` first to find the correct `ref` attribute.

### browser_snapshot — Get page state

```python
skill_mcp(mcp_name="playwright", tool_name="browser_snapshot")
```

### browser_run_code — UNRELIABLE, AVOID

`browser_run_code` has severe limitations and should be avoided:
- `await page.evaluate(...)` → TypeError (quote escaping issues)
- `const result = ...` → SyntaxError
- `page.addScriptTag(...)` → TypeError

**Use `browser_evaluate` instead whenever possible.**

## Workflow

### Step 1: Prepare the Markdown Content

1. Read the target markdown file
2. Run the injection script helper to strip frontmatter, `<!--more-->` tags, and create the injection script:

```bash
node /path/to/skills/wechat-md/scripts/create-injection.js <markdown-file> --strip-frontmatter
```

This creates `/tmp/inject-content.js` — a self-executing script that injects the markdown content into the CodeMirror 6 editor.

### Step 2: Open the Editor

```python
skill_mcp(mcp_name="playwright", tool_name="browser_navigate", arguments={"url": "https://md-wechat.vercel.app/"})
```

### Step 3: Apply Style Presets via localStorage

Set all localStorage values in a single `browser_evaluate` call, then reload the page:

```python
skill_mcp(mcp_name="playwright", tool_name="browser_evaluate", arguments={"function": "() => { localStorage.setItem('color', '#40B8FA'); localStorage.setItem('size', '16px'); localStorage.setItem('codeBlockTheme', 'https://cdn-doocs.oss-cn-shenzhen.aliyuncs.com/npm/highlightjs/11.11.1/styles/atom-one-light.min.css'); localStorage.setItem('fonts', 'Optima-Regular, Optima, PingFangSC-light, PingFangTC-light, PingFang SC, Cambria, Cochin, Georgia, Times, Times New Roman, serif'); localStorage.setItem('isMacCodeBlock', 'true'); localStorage.setItem('isShowLineNumber', 'true'); localStorage.setItem('isCiteStatus', 'true'); localStorage.setItem('MD__use_indent', 'false'); localStorage.setItem('MD__theme', 'default'); localStorage.setItem('MD__use_justify', 'true'); return 'done'; }"})
```

Then reload the page to apply the presets:

```python
skill_mcp(mcp_name="playwright", tool_name="browser_navigate", arguments={"url": "https://md-wechat.vercel.app/"})
```

Wait for the page to fully load before proceeding.

### Step 4: Inject Content into the Editor

Since `browser_run_code` cannot reliably call `page.addScriptTag()`, use `browser_evaluate` to inject the content script via DOM manipulation:

1. First, read the injection script content:

```python
# Read /tmp/inject-content.js content with the Read tool
```

2. Then inject it via `browser_evaluate` by creating a script element:

```python
skill_mcp(mcp_name="playwright", tool_name="browser_evaluate", arguments={"function": "() => { const script = document.createElement('script'); script.textContent = `<PASTE_INJECTION_SCRIPT_CONTENT_HERE>`; document.head.appendChild(script); return window.__injectionResult || 'script appended'; }"})
```

**Alternative approach**: If the injection script content is too large for a single `browser_evaluate` call, you can split the markdown into chunks and use the CodeMirror dispatch API directly:

```python
skill_mcp(mcp_name="playwright", tool_name="browser_evaluate", arguments={"function": "() => { const cm = document.querySelector('.cm-content'); const view = cm.cmTile.view; view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: '<MARKDOWN_CONTENT>' } }); return 'success'; }"})
```

**Note**: For the direct approach, you need to JSON-escape the markdown content and embed it in the arrow function string. This works well for smaller articles. For large articles (>30KB), the file-based injection is more reliable.

### Step 5: Verify Content Injection

Take a snapshot to confirm the content appears in the editor:

```python
skill_mcp(mcp_name="playwright", tool_name="browser_snapshot")
```

Image loading errors are expected and harmless — relative image paths from the blog won't resolve on the web editor.

### Step 6: Click the Copy Button

First take a snapshot to find the "复制" button's ref, then click it:

```python
skill_mcp(mcp_name="playwright", tool_name="browser_snapshot")
# Find the ref for the "复制" button in the snapshot output
skill_mcp(mcp_name="playwright", tool_name="browser_click", arguments={"element": "复制", "ref": "<ref_from_snapshot>"})
```

The success message is: "已复制渲染后的内容到剪贴板，可直接到公众号后台粘贴。"

### Step 7: Report to User

Tell the user the formatted content is in their clipboard, ready to paste into the WeChat editor.

## Complete Example (Exact Tool Call Sequence)

```
1. read(filePath="/path/to/article.md")
   → Get markdown content

2. bash: node /path/to/skills/wechat-md/scripts/create-injection.js /path/to/article.md --strip-frontmatter
   → Creates /tmp/inject-content.js with CodeMirror injection script

3. skill_mcp(mcp_name="playwright", tool_name="browser_navigate", arguments={"url": "https://md-wechat.vercel.app/"})
   → Open the editor

4. skill_mcp(mcp_name="playwright", tool_name="browser_evaluate", arguments={"function": "() => { localStorage.setItem('color', '#40B8FA'); localStorage.setItem('size', '16px'); localStorage.setItem('codeBlockTheme', 'https://...atom-one-light.min.css'); localStorage.setItem('fonts', 'Optima-Regular, Optima, PingFangSC-light, PingFangTC-light, PingFang SC, Cambria, Cochin, Georgia, Times, Times New Roman, serif'); localStorage.setItem('isMacCodeBlock', 'true'); localStorage.setItem('isShowLineNumber', 'true'); localStorage.setItem('isCiteStatus', 'true'); localStorage.setItem('MD__use_indent', 'false'); localStorage.setItem('MD__theme', 'default'); localStorage.setItem('MD__use_justify', 'true'); return 'done'; }"})
   → Set style presets

5. skill_mcp(mcp_name="playwright", tool_name="browser_navigate", arguments={"url": "https://md-wechat.vercel.app/"})
   → Reload page to apply presets

6. read(filePath="/tmp/inject-content.js")
   → Get injection script content

7. skill_mcp(mcp_name="playwright", tool_name="browser_evaluate", arguments={"function": "() => { const s = document.createElement('script'); s.textContent = `<injection_script_content>`; document.head.appendChild(s); return window.__injectionResult || 'pending'; }"})
   → Inject content into CodeMirror editor via DOM script element

8. skill_mcp(mcp_name="playwright", tool_name="browser_snapshot")
   → Verify content appears in editor

9. skill_mcp(mcp_name="playwright", tool_name="browser_click", arguments={"element": "复制", "ref": "<ref_from_snapshot>"})
   → Copy formatted HTML to clipboard

10. Done! Tell user the content is in their clipboard.
```

## Resources

### scripts/

- **`create-injection.js`** — Node.js script that reads a markdown file, strips YAML frontmatter and `<!--more-->` tags, and creates a CodeMirror 6 injection script at `/tmp/inject-content.js`. The injection script is designed to be read and injected via `browser_evaluate` + DOM script element creation.

## Troubleshooting

### Content not appearing in editor
- Verify `.cm-content` element exists (the page may not have fully loaded)
- Check that `cmTile.view` is accessible — this is CodeMirror 6's internal view reference
- Try waiting a few seconds after page load before injection
- Take a `browser_snapshot` to inspect the page state

### Image errors in editor preview
- Expected behavior — relative image paths (e.g., `../_images/...`) don't resolve on the web editor
- These errors don't affect the formatted output

### Copy button not working
- The button text is "复制" (Chinese for "Copy")
- Use `browser_snapshot` to find the correct `ref` attribute, then use `browser_click` with that ref
- Success toast: "已复制渲染后的内容到剪贴板，可直接到公众号后台粘贴。"

### `browser_evaluate` errors
- "not well-serializable" → Your function is not an arrow function. Wrap in `() => { ... }`
- "result is not a function" → You used an IIFE `(() => ...)()`. Remove the outer `()` and `()`
- "expected string for function" → You used the wrong parameter name. Use `function`, not `expression`

### `browser_run_code` failures
- This tool is unreliable for complex operations. Use `browser_evaluate` instead.
- If you must use it, keep the code extremely simple (single line, no `const`/`let`/`await`)

### Large articles (>50KB)
- The file-based injection approach handles large content well
- If the editor becomes slow, wait a moment for rendering to complete before clicking copy
- For very large articles, consider splitting the `browser_evaluate` injection into chunks
