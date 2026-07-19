import { handleProxyRequest } from './handler'

/**
 * Cloudflare Worker entrypoint. All logic lives in `handleProxyRequest` so it can
 * be tested without the Workers runtime; this wrapper supplies the platform
 * `fetch` and passes `env` through (for the future Drive-API folder lister).
 */
export default {
  fetch(request: Request, env: Record<string, unknown>): Promise<Response> {
    return handleProxyRequest(request, fetch, env)
  },
}
