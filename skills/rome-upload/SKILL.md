---
name: rome-upload
description: "Upload local files (images, videos, fonts, any static asset) to Rome's asset storage (OSS) and get back a public CDN URL, via the `rome-upload` CLI. Use when the user asks to upload an image/asset/file, needs a hosted/public URL or CDN link for a local file, or wants to put assets on TMail/Douyin/WeChat OSS. Triggers: 上传图片, 上传素材, 上传静态资源, 传到 OSS, 给我一个图片链接, upload asset, upload image, get CDN url."
---

# rome-upload

Uploads files through Rome's own API (`<rome>/api/file/upload` → OSS → `<rome>/api/file/finishUpload`), the same flow as the Rome `/assets-upload` page, authenticated as the user via Rome SSO. Uploads are **public by default** and identical files (same MD5) return the existing URL.

## Prerequisites

1. CLI available: `rome-upload --help`. If missing, tell the user to install it following the README of `LEGO/cce-rome-upload-assets-cli` (clone, then `yarn install && yarn build && npm link`). Do not try alternative upload paths.
2. Configured: config lives at `~/.config/rome-upload/config.json`. If a command fails with `not configured`:
   - Prefer asking the user to run `rome-upload init` in their own terminal (interactive guide).
   - If the user agrees to defaults, you may run `rome-upload init` yourself (no TTY → saves defaults: `https://rome.ext.cce.thelegogroup.cn`, `TMail`, `jushita`), or pass values: `rome-upload init --rome-url <url> --ns <ns> --cloud <cloud>`.
3. Logged in: `rome-upload whoami` shows the user. Sessions refresh automatically; if a command fails with `not logged in or session expired` or `unauthorized (401)`:
   - Tell the user a browser window will open for Rome SSO, then run `rome-upload login` (it waits up to 5 minutes for the user to finish logging in).
   - Login receives the SSO callback on `localhost:3000`; if it reports the port is in use, ask the user to stop whatever runs there (usually a local Rome dev server) first.
   - Never ask the user for passwords or tokens, and never read or print `~/.config/rome-upload/credentials.json`.
4. Network: uploads need the company VPN, GlobalProtect connected to the **"Jiaxing - All Traffic"** gateway (not the plain "Jiaxing" one). Login and `whoami` work without it. No need to mention it before every upload: when the VPN is off, the CLI fails within about 10 seconds with `cannot reach Rome` (see Troubleshooting).

## Usage

Always use `--json` so results are machine-readable, and decide `--compress` per [Compression](#compression):

```bash
rome-upload ./banner.png ./logo.webp --compress --json
rome-upload ./hero.jpg ./intro.mp4 --ns Douyin --compress --json
rome-upload ./icon.svg ./loading.gif --json
```

| Option | Meaning |
|---|---|
| `--ns TMail\|Douyin\|WeChat\|Other` | Namespace (default from config). Pick from the user's context; ask if unclear and it matters. |
| `--cloud jushita\|aliyun` | Storage provider (default from config) |
| `--compress` | Compress JPEG/PNG/WebP first (quality 80, fit within 1920px); other files upload unchanged. See [Compression](#compression). |
| `--private` | Non-public upload. Only when explicitly requested. |

Output (`--json`) is an array; exit code `1` if any file failed:

```json
[{ "file": "./banner.png", "ok": true, "url": "https://...", "size": 12345, "exists": false }]
```

`exists: true` means the same file was already uploaded and its existing URL was returned. `originalSize` (size before compression) is present only when a compressed version was uploaded.

## Compression

Decide by file extension:

- Any `.jpg` / `.jpeg` / `.png` / `.webp` in the batch → add `--compress`. The CLI compresses only these types and uploads every other file in the same command unchanged, so a mixed batch is still one command.
- No such files (`.gif`, `.svg`, `.ico`, `.avif`, video, fonts, PDF, …) → no `--compress`.
- Skip `--compress` when the user wants the original, no compression, lossless or full resolution (原图、不压缩、无损、高清), or the image must stay larger than 1920px (e.g. @2x/@3x assets, print): compression fits images within 1920×1920.
- No need to check for animated or already-optimized images yourself: the CLI uploads those unchanged.
- Report the result: with `originalSize`, say the file was compressed (`originalSize` → `size` bytes); without it, the file was uploaded as-is.
- `sharp is not installed` → rerun those files without `--compress` and tell the user they were uploaded uncompressed.

## Rules

- Files are publicly reachable after upload. Confirm with the user before uploading anything that looks sensitive (credentials, personal data, internal docs).
- Report the returned `url` for each file back to the user; for failures report the `error` text.
- Never call the file service backend directly or reimplement the upload with curl — always go through this CLI.

## Troubleshooting

| Error | Fix |
|---|---|
| `not configured` | See Prerequisites step 2 |
| `not logged in or session expired` / `unauthorized (401)` | See Prerequisites step 3 |
| `localhost:3000 is in use` | Ask the user to stop the process on port 3000, then `rome-upload login` again |
| `cannot reach Rome` / `fetch failed` | The VPN is off or on another gateway: ask the user to connect GlobalProtect to "Jiaxing - All Traffic" and tell you when done, then retry once. Don't work around it with other networks, proxies or URLs |
| `/api/file/upload failed: <msg>` | Service rejected the request; relay `<msg>` (often bad namespace/cloud) |
| `Part N upload HTTP 4xx` | Pre-signed URL expired or rejected; retry once, then report |
| `sharp is not installed` | Rerun without `--compress` and tell the user the files were uploaded uncompressed |
