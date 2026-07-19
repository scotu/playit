/**
 * Core request handler for the playit Drive proxy, written as a pure function of
 * (request, fetch) so it can be unit-tested with a stubbed fetch.
 *
 * Why this proxy exists: Google serves the anonymous Drive download endpoint with
 * `Cross-Origin-Resource-Policy: same-site`. Browsers enforce CORP and refuse the
 * response to any cross-site page, so a `<video>`/`<audio>` element on a static
 * host (e.g. GitHub Pages) can never load it directly. Fetching server-side is not
 * subject to CORP, so we refetch here and re-emit the bytes with permissive,
 * CORP-free headers and Range passthrough.
 */

type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>

const FILE_ID = /^[A-Za-z0-9_-]{10,64}$/

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Range',
  'Access-Control-Expose-Headers':
    'Content-Length, Content-Range, Accept-Ranges, Content-Type, Content-Disposition',
}

/** Headers worth carrying from the upstream file response to the client. */
const PASSTHROUGH = [
  'Content-Type',
  'Content-Length',
  'Content-Range',
  'Accept-Ranges',
  'Content-Disposition',
]

function upstreamUrl(fileId: string): string {
  return `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

/** Pulls the filename out of a Content-Disposition header, if present. */
function filenameFrom(disposition: string | null): string | undefined {
  if (disposition === null) return undefined
  const star = disposition.match(/filename\*=(?:UTF-8'')?([^;]+)/i)
  if (star) {
    try {
      return decodeURIComponent(star[1].replace(/^"|"$/g, ''))
    } catch {
      // fall through to the plain form
    }
  }
  const plain = disposition.match(/filename="?([^"]+)"?/i)
  return plain ? plain[1] : undefined
}

/** Reads the total size from a Content-Range header, e.g. "bytes 0-0/12345". */
function totalFromContentRange(range: string | null): number | undefined {
  if (range === null) return undefined
  const match = range.match(/\/(\d+)\s*$/)
  return match ? Number(match[1]) : undefined
}

export async function handleProxyRequest(request: Request, fetchImpl: FetchLike): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  const { pathname } = new URL(request.url)
  const stream = pathname.match(/^\/d\/(.+)$/)
  const meta = pathname.match(/^\/meta\/(.+)$/)
  const id = (stream ?? meta)?.[1]

  if (id === undefined || !FILE_ID.test(id)) {
    return json({ error: 'not-found', message: 'Expected /d/{fileId} or /meta/{fileId}.' }, 404)
  }

  // Metadata: a tiny ranged GET so Google returns headers (filename, size, type)
  // without us downloading the whole file.
  if (meta) {
    const head = await fetchImpl(upstreamUrl(id), {
      headers: { Range: 'bytes=0-0' },
      redirect: 'follow',
    })
    const contentType = head.headers.get('Content-Type') ?? undefined
    if (contentType?.includes('text/html')) {
      return json({ error: 'interstitial', message: 'Drive returned a confirmation page.' }, 502)
    }
    return json(
      {
        title: filenameFrom(head.headers.get('Content-Disposition')),
        mimeType: contentType,
        // The ranged request means Content-Length is the chunk size (1 byte), so
        // the true size comes from the total in Content-Range: "bytes 0-0/12345".
        size: totalFromContentRange(head.headers.get('Content-Range')),
      },
      200,
    )
  }

  // Stream: forward Range for seeking.
  const forward = new Headers()
  const range = request.headers.get('Range')
  if (range !== null) forward.set('Range', range)

  const upstream = await fetchImpl(upstreamUrl(id), { headers: forward, redirect: 'follow' })

  // A large file whose virus scan can't run comes back as an HTML confirmation
  // page instead of bytes. We can't stream past it without an authenticated
  // request, so we surface it rather than piping HTML into a media element.
  if ((upstream.headers.get('Content-Type') ?? '').includes('text/html')) {
    return json(
      {
        error: 'interstitial',
        message:
          'Google returned a confirmation page instead of the file. It may be too large to stream anonymously.',
      },
      502,
    )
  }

  const headers = new Headers(CORS_HEADERS)
  for (const name of PASSTHROUGH) {
    const value = upstream.headers.get(name)
    if (value !== null) headers.set(name, value)
  }
  headers.set('Cache-Control', 'public, max-age=3600')

  return new Response(upstream.body, { status: upstream.status, headers })
}
