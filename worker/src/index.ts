import { handleProxyRequest } from './handler'

/**
 * Cloudflare Worker entrypoint. All logic lives in `handleProxyRequest` so it can
 * be tested without the Workers runtime; this wrapper just supplies the platform
 * `fetch`.
 */
export default {
  fetch(request: Request): Promise<Response> {
    return handleProxyRequest(request, fetch)
  },
}
