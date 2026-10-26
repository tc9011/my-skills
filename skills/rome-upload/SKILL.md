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

## Usage

Always use `--json` so results are machine-readable:

```bash
rome-upload ./banner.png ./logo.webp --json
rome-upload ./hero.jpg --ns Douyin --compress --json
```

| Option | Meaning |
|---|---|
| `--ns TMail\|Douyin\|WeChat\|Other` | Namespace (default from config). Pick from the user's context; ask if unclear and it matters. |
| `--cloud jushita\|aliyun` | Storage provider (default from config) |
| `--compress` | Compress JPEG/PNG/WebP first (quality 80, max 1920px). Only when the user asks to compress/optimize. |
| `--private` | Non-public upload. Only when explicitly requested. |

Output (`--json`) is an array; exit code `1` if any file failed:

```json
[{ "file": "./banner.png", "ok": true, "url": "https://...", "size": 12345, "exists": false }]
```

`exists: true` means the same file was already uploaded and its existing URL was returned. With `--compress`, `originalSize` shows the size before compression.

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
| `fetch failed` / timeout | Rome may only be reachable from the corporate network/VPN; ask the user to check connectivity to the Rome URL |
| `/api/file/upload failed: <msg>` | Service rejected the request; relay `<msg>` (often bad namespace/cloud) |
| `Part N upload HTTP 4xx` | Pre-signed URL expired or rejected; retry once, then report |
| `sharp is not installed` | Drop `--compress`, or install `sharp` alongside the CLI |
