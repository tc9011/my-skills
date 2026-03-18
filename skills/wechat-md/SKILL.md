---
name: wechat-md
description: Format Markdown articles into WeChat-compatible content using md-wechat.vercel.app via Chrome DevTools MCP or equivalent browser automation. Use whenever the user wants a blog post, local markdown file, or article turned into 微信公众号-ready content, copied to the clipboard, or formatted for WeChat publishing. Prefer this skill over ad-hoc browser poking when the task is “公众号排版 / wechat-md / copy to WeChat / 微信公众号格式化”.
---

# WeChat Markdown Formatter

把 Markdown 变成可直接粘贴到微信公众号后台的排版内容。

## What this skill should optimize for

1. **稳定把结果复制到剪贴板**，而不是只把文章显示在网页里
2. **少用超长字符串 / 超长脚本直接注入**，避免转义、序列化、长度限制问题
3. **优先使用 Chrome DevTools MCP 或等价浏览器自动化能力**
4. **对本地相对图片容错**：编辑器里图片加载失败通常不影响最终粘贴结果

## Runtime assumption

This skill is written for environments that can automate a browser tab through **Chrome DevTools MCP** or an equivalent browser-control layer.

The exact tool names may differ by runtime, but the workflow assumes you have equivalents for:
- open / navigate a page
- evaluate JavaScript in the page
- inspect the page state / snapshot
- click a button

Do **not** depend on Playwright-specific APIs or syntax in the skill text unless the runtime explicitly requires them.

## Preferred workflow

### Step 1: Prepare a clean markdown file

Use the helper script to strip YAML frontmatter and `<!--more-->`, then write a clean temp file:

```bash
node <skill-dir>/scripts/prepare-markdown.js <markdown-file> --strip-frontmatter
```

Default output:

```text
/tmp/wechat-md-input.md
```

If the user explicitly wants to keep frontmatter-related content, skip `--strip-frontmatter`.

### Step 2: Start a temporary local HTTP server

Do **not** default to embedding the entire markdown body directly into a giant evaluate call.

Instead, serve the prepared file from its directory with:

```bash
python3 <skill-dir>/scripts/temp-http.py <directory-containing-the-prepared-file>
```

Important behavior:
- binds to `127.0.0.1`
- uses a **random free port** by default, so it avoids port-collision failures
- prints one line like:

```text
SERVER_URL=http://127.0.0.1:54321
```

Capture that URL from process output.

### Step 3: Open md-wechat and apply the style preset

Open:

```text
https://md-wechat.vercel.app/
```

Then run one JS evaluation to set localStorage style values:

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

Then reload / re-navigate to the same page so the preset is applied.

### Step 4: Inject content by fetching the local markdown file

Preferred page-side JS:

```js
(async () => {
  const res = await fetch('<SERVER_URL>/<encoded-file-name>.md')
  const text = await res.text()
  const cmContent = document.querySelector('.cm-content')
  if (!cmContent) return 'error: .cm-content not found'
  const view = cmContent.cmTile && cmContent.cmTile.view
  if (!view) return 'error: CodeMirror view not found'

  view.dispatch({
    changes: { from: 0, to: view.state.doc.length, insert: text }
  })

  return `success:${text.length}`
})()
```

This is the preferred path because it avoids the most fragile part of the old workflow: **injecting a huge prebuilt script body into the page**.

### Step 5: Verify injection succeeded

Inspect the page state.

Success signals:
- the editor contains the article title / first paragraphs
- the preview pane updates on the right
- headings / lists / blockquotes render correctly

Do **not** fail just because relative local image paths do not render in the preview.

### Step 6: Click `复制`

Find the current `复制` button in the page state and click it.

Expected success signal:
- the click succeeds
- if visible, success text says the rendered content has been copied to the clipboard

Then tell the user the result is ready to paste into the WeChat public-account editor.

### Step 7: Clean up

Stop the temporary HTTP server process after copying succeeds.

---

## Recommended sequence

1. prepare the markdown file with `prepare-markdown.js`
2. start `temp-http.py` in the background
3. capture `SERVER_URL=...` from process output
4. open `https://md-wechat.vercel.app/`
5. set localStorage style preset
6. reload the page
7. run page-side JS that `fetch()`es the local markdown and injects it into CodeMirror
8. verify editor + preview updated
9. click `复制`
10. stop the temp server
11. report clipboard success to the user

---

## Fallbacks

### Fallback A: direct inline injection for smaller files

If local serving is unavailable and the file is small enough, you may read the markdown and inject it directly with page evaluation.

Use this only for relatively small articles, because long payloads are fragile.

### Fallback B: legacy create-injection.js flow

If needed, the older helper still exists:

```bash
node <skill-dir>/scripts/create-injection.js <markdown-file> --strip-frontmatter
```

That path is still valid, but it should be treated as a fallback rather than the default.

---

## Troubleshooting

### `.cm-content not found`
The page is not fully ready. Reload or wait, then retry.

### `CodeMirror view not found`
The editor DOM exists, but CodeMirror is not fully initialized yet. Retry shortly.

### Port already in use
Use `temp-http.py` without forcing a fixed port.

### Giant evaluate payload keeps breaking
Do not keep fighting escaping. Switch to the local HTTP + fetch path.

### Relative images fail in preview
Expected for local blog image paths. If text rendering is correct, continue.

### Copy appears to work but clipboard seems stale
Verify the preview updated first, then click `复制` again.

---

## Reporting format

Reply concisely like this:

- source: `<markdown-file>`
- prepared markdown: `<temp-file>`
- WeChat formatting: `copied to clipboard`
- note: `relative local images may not render in md-wechat preview; this does not affect pasted output`

If blocked, explicitly say which step failed and why.
