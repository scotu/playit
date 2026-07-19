import { describe, it, expect } from 'vitest'
import { handleProxyRequest } from './handler'

const ID = '1O72PnO4cRbh_7EWO69722o6NzFDYnOOv'

/** Builds a stub fetch that records calls and returns queued responses. */
function stubFetch(responses: Response[]) {
  const calls: { url: string; headers: Record<string, string> }[] = []
  let i = 0
  const fn = async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input.toString()
    const headers: Record<string, string> = {}
    new Headers(init?.headers).forEach((v, k) => {
      headers[k] = v
    })
    calls.push({ url, headers })
    return responses[Math.min(i++, responses.length - 1)]
  }
  return { fn, calls }
}

function audioResponse(status = 200, extra: Record<string, string> = {}): Response {
  return new Response('ID3fakebytes', {
    status,
    headers: {
      'Content-Type': 'audio/mpeg',
      'Content-Length': '6465245',
      'Accept-Ranges': 'bytes',
      'Content-Disposition': 'attachment; filename="My Track.mp3"',
      // The header that must NOT survive to the client:
      'Cross-Origin-Resource-Policy': 'same-site',
      ...extra,
    },
  })
}

describe('handleProxyRequest', () => {
  it('streams a drive file and re-emits permissive CORS without CORP', async () => {
    const { fn, calls } = stubFetch([audioResponse()])
    const res = await handleProxyRequest(new Request(`https://w.dev/d/${ID}`), fn)

    expect(res.status).toBe(200)
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*')
    expect(res.headers.get('Content-Type')).toBe('audio/mpeg')
    expect(res.headers.get('Accept-Ranges')).toBe('bytes')
    // The blocking header must be stripped.
    expect(res.headers.get('Cross-Origin-Resource-Policy')).toBeNull()
    // It fetched the anonymous endpoint for the right id.
    expect(calls[0].url).toContain(`id=${ID}`)
    expect(calls[0].url).toContain('drive.usercontent.google.com')
  })

  it('forwards the Range header so seeking works, returning 206', async () => {
    const { fn, calls } = stubFetch([
      audioResponse(206, { 'Content-Range': 'bytes 100-199/6465245' }),
    ])
    const req = new Request(`https://w.dev/d/${ID}`, { headers: { Range: 'bytes=100-199' } })
    const res = await handleProxyRequest(req, fn)

    expect(res.status).toBe(206)
    expect(res.headers.get('Content-Range')).toBe('bytes 100-199/6465245')
    expect(calls[0].headers['range']).toBe('bytes=100-199')
  })

  it('answers a CORS preflight without hitting upstream', async () => {
    const { fn, calls } = stubFetch([audioResponse()])
    const res = await handleProxyRequest(
      new Request(`https://w.dev/d/${ID}`, { method: 'OPTIONS' }),
      fn,
    )
    expect(res.status).toBe(204)
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET')
    expect(res.headers.get('Access-Control-Allow-Headers')).toContain('Range')
    expect(calls.length).toBe(0)
  })

  it('returns the filename as JSON on the meta route', async () => {
    const { fn, calls } = stubFetch([
      new Response('x', {
        status: 206,
        headers: {
          'Content-Type': 'audio/mpeg',
          // A bytes=0-0 request returns 1 byte; the true size is in Content-Range.
          'Content-Length': '1',
          'Content-Range': 'bytes 0-0/6465245',
          'Content-Disposition': 'attachment; filename="My Track.mp3"',
        },
      }),
    ])
    const res = await handleProxyRequest(new Request(`https://w.dev/meta/${ID}`), fn)
    const body = (await res.json()) as { title: string; mimeType: string; size: number }

    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*')
    expect(body.title).toBe('My Track.mp3')
    expect(body.mimeType).toBe('audio/mpeg')
    expect(body.size).toBe(6465245)
    // meta uses a HEAD to avoid downloading the whole file.
    expect(calls[0].headers['range']).toBe('bytes=0-0')
  })

  it('reports the interstitial when Drive returns an HTML confirmation page', async () => {
    const { fn } = stubFetch([
      new Response('<html><body>Google Drive can’t scan this file</body></html>', {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }),
    ])
    const res = await handleProxyRequest(new Request(`https://w.dev/d/${ID}`), fn)
    expect(res.status).toBe(502)
    const body = (await res.json()) as { error: string }
    expect(body.error).toBe('interstitial')
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*')
  })

  it('rejects a path that is not a drive file id', async () => {
    const { fn, calls } = stubFetch([audioResponse()])
    const res = await handleProxyRequest(new Request('https://w.dev/d/not*valid'), fn)
    expect(res.status).toBe(404)
    expect(calls.length).toBe(0)
  })

  it('rejects an unknown route', async () => {
    const { fn } = stubFetch([audioResponse()])
    const res = await handleProxyRequest(new Request('https://w.dev/'), fn)
    expect(res.status).toBe(404)
  })
})
