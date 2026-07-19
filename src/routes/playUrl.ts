/** Builds the shareable deep link for a source. */
export function buildPlayUrl(src: string): string {
  return `/play?src=${encodeURIComponent(src.trim())}`
}
