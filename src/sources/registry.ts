import { googleDriveProxyAdapter } from './googleDriveProxy'
import { SourceError } from './types'
import type { ResolvedMedia, SourceAdapter } from './types'

/**
 * Adapters in priority order — the first one to claim an input wins.
 *
 * Adding a provider, a keyed Drive adapter, or a signed-in Drive adapter is a
 * new file plus one line here. Nothing downstream of `resolveSource` knows which
 * adapter served the request.
 */
export const adapters: SourceAdapter[] = [googleDriveProxyAdapter]

export function findAdapter(
  input: string,
  candidates: SourceAdapter[] = adapters,
): SourceAdapter | null {
  if (input.trim() === '') return null
  return candidates.find((adapter) => adapter.canHandle(input)) ?? null
}

export function canResolve(input: string, candidates: SourceAdapter[] = adapters): boolean {
  return findAdapter(input, candidates) !== null
}

export async function resolveSource(
  input: string,
  candidates: SourceAdapter[] = adapters,
): Promise<ResolvedMedia> {
  const adapter = findAdapter(input, candidates)
  if (adapter === null) {
    throw new SourceError(
      'unrecognised',
      'That link is not supported yet. Paste a Google Drive file link shared with anyone who has the link.',
    )
  }

  try {
    return await adapter.resolve(input)
  } catch (error) {
    if (error instanceof SourceError) throw error
    throw new SourceError('resolve-failed', `${adapter.label} could not resolve that link.`)
  }
}
