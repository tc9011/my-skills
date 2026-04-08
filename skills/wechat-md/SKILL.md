---
name: wechat-md
description: "Format Markdown articles into WeChat-compatible content using md-wechat.vercel.app via browser automation, then copy the rendered result to the clipboard for pasting into the WeChat public-account editor. Use this skill whenever the user mentions 公众号排版, wechat-md, 微信公众号格式, WeChat formatting, copying to WeChat, or wants any markdown/blog post turned into 微信公众号-ready content. Also triggers on phrases like '排成公众号格式', '复制到公众号', '转微信格式'. Prefer this skill over ad-hoc browser poking — it handles style presets, content injection, and clipboard copying in a reliable automated sequence."
---

# WeChat Markdown Formatter

把 Markdown 变成可直接粘贴到微信公众号后台的排版内容。

## Design goals

1. **Clipboard is the deliverable** — the job isn't done until rendered content is in the clipboard, not just displayed in the editor
2. **No lingering processes** — the local HTTP server auto-exits after serving the file once, so no cleanup is needed
3. **Browser automation agnostic** — the workflow uses standard primitives (navigate, evaluate JS, click, snapshot) that work across different automation runtimes
4. **Tolerant of broken images** — blog articles with relative local image paths will show broken images in the preview, but this never affects the clipboard output

## Runtime assumption

This skill requires browser automation capabilities. The exact tool names differ by runtime, but the workflow needs equivalents for:

- **Navigate**: open or reload a URL in a browser tab
- **Evaluate JS**: execute JavaScript in the page context and get a return value
- **Click**: click a DOM element (by ref, selector, or role)
- **Snapshot**: inspect the current page state (DOM tree / accessibility tree)

Examples:
- OpenClaw: `browser(action=navigate)`, `browser(action=act, kind=evaluate)`, `browser(action=act, kind=click)`, `browser(action=snapshot)`
- Chrome DevTools MCP: `navigate`, `evaluate`, `click`, `snapshot`
- Playwright: `page.goto()`, `page.evaluate()`, `page.click()`, etc.

**Tab consistency**: keep the same tab/target across all calls within one session.

## Preferred workflow

### Step 1: Prepare a clean markdown file

Strip YAML frontmatter and `<!--more-->` tags, then write a clean temp file:

```bash
node <skill-dir>/scripts/prepare-markdown.js <markdown-file> --strip-frontmatter
```

Default output: `/tmp/wechat-md-input.md`

Skip `--strip-frontmatter` only if the user explicitly wants frontmatter-related content kept.

### Step 2: Start a one-shot local HTTP server

The server avoids escaping issues when injecting large markdown into the browser. It **auto-exits after serving one request**, so no cleanup is needed.

```bash
python3 <skill-dir>/scripts/temp-http.py /tmp > /tmp/wechat-server.log 2>&1 &
sleep 0.5
cat /tmp/wechat-server.log
```

This prints `SERVER_URL=http://127.0.0.1:<port>`. Capture the URL for Step 4.

**Important**: The `> /tmp/wechat-server.log 2>&1 &` pattern with `sleep` is required to prevent blocking. Read the URL from the log file, not from stdout directly.

### Step 3: Open md-wechat and apply the style preset

Navigate to `https://md-wechat.vercel.app/`, then evaluate this JS to set localStorage style values:

```js
(() => {
  localStorage.setItem('color', '#40B8FA')
  localStorage.setItem('size', '16px')
  localStorage.setItem('codeBlockTheme', 'https://cdn-doocs.oss-cn-shenzhen.aliyuncs.com/npm/highlightjs/11.11.1/styles/atom-one-light.min.css')
  localStorage.setItem('fonts', 'Optima-Regular, Optima, PingFangSC-light, PingFangTC-light, PingFang SC, Cambria, Cochin, Georgia, Times, Times New Roman, serif')
  localStorage.setItem('isMacCodeBlock', 'true')
  localStorage.setItem('isShowLineNumber', 'true')
  localStorage.setItem('isCiteStatus', 'true')
  localStorage.setItem('MD__use_indent', 'false')
  localStorage.setItem('MD__theme', 'default')
  localStorage.setItem('MD__use_justify', 'true')
  return 'done'
})()
```

Then **reload** (re-navigate to the same URL) so the preset takes effect.

### Step 4: Inject content via fetch + execCommand

The CodeMirror 6 editor on md-wechat.vercel.app does not expose its internal view API through the DOM — `cmView`, `cmTile`, and `view.dispatch()` all fail silently because the framework doesn't attach these properties to DOM elements in this deployment. Instead, use the browser's built-in editing API which CodeMirror listens to:

```js
(async () => {
  const res = await fetch('<SERVER_URL>/wechat-md-input.md')
  const text = await res.text()
  const cmContent = document.querySelector('.cm-content')
  if (!cmContent) return 'error: .cm-content not found'
  cmContent.focus()
  document.execCommand('selectAll')
  const success = document.execCommand('insertText', false, text)
  return success ? 'success:' + text.length : 'insertText failed'
})()
```

Replace `<SERVER_URL>` with the URL from Step 2. The server auto-exits after this fetch completes.

`execCommand('insertText')` works because CodeMirror intercepts native input events from the contenteditable element. The `focus` → `selectAll` → `insertText` sequence is the same thing that happens when a user pastes text, so it goes through CodeMirror's normal input pipeline and properly updates both the editor state and the preview pane.

### Step 5: Verify injection succeeded

Inspect the page (snapshot, compact, maxChars ~500). Check:
- The first paragraph matches the article's opening text
- Article headings appear in the preview pane
- Footer shows a reasonable word/character count

**Do not fail** because:
- Relative local image paths don't render (expected, doesn't affect output)
- Previous session's content still showing (means injection didn't take — retry Step 4)

### Step 6: Click `复制`

Click the `复制` button (in the top banner area).

The success toast ("已复制渲染后的内容到剪贴板") appears briefly and auto-dismisses. **Do not wait for or depend on catching the toast** — a successful click is sufficient confirmation.

### Step 7: Done

The HTTP server already exited after serving the file in Step 4. No cleanup needed.

---

## Compact execution sequence

For quick reference, the entire flow:

1. `exec`: `node prepare-markdown.js <file> --strip-frontmatter`
2. `exec`: `python3 temp-http.py /tmp > /tmp/wechat-server.log 2>&1 &` then `sleep 0.5 && cat /tmp/wechat-server.log` → capture `SERVER_URL`
3. Navigate to `https://md-wechat.vercel.app/`
4. Evaluate JS: set localStorage preset
5. Navigate (reload) same URL
6. Evaluate JS: fetch from `SERVER_URL` + `selectAll` + `insertText` (server auto-exits after this)
7. Snapshot: verify content
8. Click: 复制 button
9. Report to user

Steps 3-4-5 can merge: set localStorage first, then navigate once (the navigate acts as the reload).

---

## Fallbacks

### Fallback A: direct inline injection for small files (<3000 chars)

If the file is short enough, skip the HTTP server entirely:

```js
(() => {
  const text = `<escaped markdown content>`
  const cmContent = document.querySelector('.cm-content')
  if (!cmContent) return 'error'
  cmContent.focus()
  document.execCommand('selectAll')
  return document.execCommand('insertText', false, text) ? 'ok' : 'fail'
})()
```

Only for short articles — long payloads break due to escaping issues in the evaluate call.

### Fallback B: legacy create-injection.js (deprecated)

The older `create-injection.js` script uses `cmTile.view.dispatch()` which no longer works on md-wechat.vercel.app. Avoid unless the site changes its CodeMirror configuration.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `.cm-content not found` | Page not ready. Wait 2s and retry. |
| `insertText` returns false | `.cm-content` not focused. Ensure `cmContent.focus()` runs first. |
| Old content still showing | `selectAll` didn't cover everything. Navigate to a fresh page first. |
| Server log empty after sleep | Increase sleep to 1s. Or check python3 is available. |
| `fetch` fails in evaluate | Server may have exited early or not started. Re-run Step 2. |
| Relative images fail in preview | Expected for local blog images. Does not affect clipboard output. |
| Toast not visible after 复制 | Normal — auto-dismisses in ~2s. Click success = copy success. |

---

## Reporting format

```
- source: <markdown-file>
- WeChat formatting: copied to clipboard ✅
- note: relative local images may not render in preview; does not affect pasted output
```
