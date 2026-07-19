/**
 * Base URL of the deployed playit Drive proxy Worker, e.g.
 * `https://playit-proxy.<subdomain>.workers.dev`. Set at build time via the
 * `VITE_DRIVE_PROXY` environment variable. Undefined when unconfigured.
 *
 * Read at call time (not module load) so tests can stub the environment.
 */
export function getDriveProxyBase(): string | undefined {
  const raw = import.meta.env.VITE_DRIVE_PROXY as string | undefined
  const trimmed = raw?.trim().replace(/\/+$/, '')
  return trimmed !== undefined && trimmed.length > 0 ? trimmed : undefined
}

/** True when a playback proxy is configured. */
export function isProxyConfigured(): boolean {
  return getDriveProxyBase() !== undefined
}
