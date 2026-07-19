// TEMPORARY — replaced wholesale in Task 7.
import type { ResolvedMedia } from '../sources/types'

export default function Player({ media }: { media: ResolvedMedia; startAt?: number }) {
  return <div data-testid="player">{media.streamUrl}</div>
}
