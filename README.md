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

## Limitations

These follow from the app using Drive's anonymous endpoint, with no API key
and no sign-in:

- **Files larger than roughly 100 MB will not play.** Drive serves a
  virus-scan warning page instead of the file, and there is no way past it
  without an authenticated request.
- **No titles.** The anonymous endpoint returns no metadata, so a file shows
  as "Audio" rather than its name.
- Audio and video are told apart by inspecting the decoded stream, not by
  file extension.

A future adapter using the Drive API — with the key held by a backend, or the
user signed in — fixes all three. See `src/sources/registry.ts`.

## Adding a source

Implement `SourceAdapter` from `src/sources/types.ts` and register it in
`src/sources/registry.ts`. Adapters are tried in order; the first to claim an
input wins. Nothing else in the app needs to change.

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
