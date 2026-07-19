# playit

A PWA media player for audio and video files shared from Google Drive.

## Playing a file

1. In Drive, set the file's sharing to **Anyone with the link**.
2. Copy the share link.
3. Paste it on the home screen, or build the link by hand:

```
https://<user>.github.io/playit/#/play?src=<url-encoded drive link>
```

Add `&t=90` to start 90 seconds in.

## The proxy is required

Playback needs the companion Cloudflare Worker in [`worker/`](worker/), and the
app must be built with `VITE_DRIVE_PROXY` pointing at it.

**Why:** Google serves the anonymous Drive download endpoint with
`Cross-Origin-Resource-Policy: same-site`. Browsers enforce CORP and refuse the
file to any cross-site page, so a `<video>`/`<audio>` element on GitHub Pages
cannot load it directly — it fails with a "format" error even for a small,
correctly shared file. Fetching server-side is not subject to CORP, so the Worker
refetches the file and re-emits it with embeddable headers (and, as a bonus, the
real filename). See [`worker/README.md`](worker/README.md) to deploy it, then set
`VITE_DRIVE_PROXY` (a repository variable for CI, or a local `.env`).

Without the proxy configured, the app loads and recognises links but reports that
playback is not configured.

## Limitations

- **Files larger than roughly 100 MB will not play.** Google shows a virus-scan
  warning page instead of the file, and the proxy cannot get past it without an
  authenticated request; it returns a clear error in that case.
- Audio and video are told apart by inspecting the decoded stream, not by file
  extension.

## Adding a source

Implement `SourceAdapter` from `src/sources/types.ts` and register it in
`src/sources/registry.ts`. Adapters are tried in order; the first to claim an
input wins. Nothing else in the app needs to change. A keyed Drive API adapter or
a signed-in adapter would slot in the same way.

## Adding a source

Implement `SourceAdapter` from `src/sources/types.ts` and register it in
`src/sources/registry.ts`. Adapters are tried in order; the first to claim an
input wins. Nothing else in the app needs to change.

## Updates

The service worker runs in `prompt` mode: when a new build is deployed, returning
visitors see a small "A new version is available" toast with a **Reload** button
that activates the update and refreshes the page — no manual hard refresh or cache
clearing. The wiring is in `src/pwa/` (`PwaUpdater` bridges vite-plugin-pwa's
`useRegisterSW` to the presentational `UpdatePrompt`).

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| `Space` / `k` | Play or pause |
| `←` / `→` | Seek 5 seconds |
| `↑` / `↓` | Volume |
| `m` | Mute |
| `f` | Fullscreen |
| `0`–`9` | Seek to 0%–90% |

## Development

```bash
npm install
npm run dev        # dev server
npm test           # unit tests
npm run typecheck
npm run lint
npm run build      # production build into dist/
```

## Deployment

Pushing to `main` runs `.github/workflows/ci.yml`, which verifies and then
deploys `dist/` to GitHub Pages. Enable Pages with **Source: GitHub Actions**
in the repository settings once, before the first push.

The build sets Vite's `base` from the repository name automatically. For a
custom domain at the root, set `VITE_BASE=/`.
