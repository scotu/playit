# playit-proxy

A Cloudflare Worker that makes public Google Drive files playable from a browser
on a third-party site.

## Why it's needed

Google serves the anonymous Drive download endpoint with
`Cross-Origin-Resource-Policy: same-site`. Browsers enforce CORP and refuse the
response to any cross-site page, so a `<video>`/`<audio>` element on GitHub Pages
can never load a Drive file directly — it fails with a "format" error even though
the file is shared correctly and small. Fetching server-side is not subject to
CORP, so this Worker refetches the file and re-emits the bytes with permissive,
CORP-free headers, passing Range requests through so seeking still works.

## Routes

| Route | Returns |
| --- | --- |
| `GET /d/{fileId}` | The file bytes, with CORS + Range passthrough |
| `GET /meta/{fileId}` | `{ title, mimeType, size }` JSON (filename from Drive) |

`{fileId}` is the Google Drive file id (the part between `/d/` and `/view` in a
share link).

## Deploy

```bash
cd worker
npx wrangler login      # opens a browser once
npx wrangler deploy
```

Wrangler prints the deployed URL, e.g.
`https://playit-proxy.<your-subdomain>.workers.dev`.

Then point the app at it by setting `VITE_DRIVE_PROXY` for the production build.
For GitHub Pages, add it to `.github/workflows/ci.yml` on the build step:

```yaml
      - run: npm run build
        env:
          VITE_BASE: /${{ github.event.repository.name }}/
          VITE_DRIVE_PROXY: https://playit-proxy.<your-subdomain>.workers.dev
```

## Local development

```bash
cd worker
npx wrangler dev        # serves on http://localhost:8787
# then: http://localhost:8787/d/<fileId>
```

## Notes on scope and safety

- The Worker only accepts a Drive file id and only ever fetches Google's Drive
  download host — it is not an open proxy for arbitrary URLs.
- It handles only files that are already public ("anyone with the link"); it holds
  no credentials and cannot reach private files.
- Files large enough to trigger Drive's virus-scan interstitial return a `502`
  with `{"error":"interstitial"}` rather than streaming an HTML page into the
  player.
