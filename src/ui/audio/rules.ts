/**
 * The decisions behind the audio, kept pure so they can be tested without a
 * browser. Variation picking and narrator priority are UI-only: the
 * simulation never uses randomness, and neither does this (round-robin).
 */

/** Round-robin over a sound's variations: never the same one twice in a row. */
export function makeRoundRobin() {
  const next = new Map<string, number>();
  return (id: string, count: number): number => {
    if (count <= 1) return 0;
    const i = next.get(id) ?? 0;
    next.set(id, (i + 1) % count);
    return i;
  };
}

/** What the election-night radio narrator can say, by situation. */
export type NarrationSituation = "opening" | "ballots" | "close_race" | "landslide" | "last_urn" | "lead_change" | "outraged" | "final";

/** Higher interrupts lower. Equal or lower is dropped, never queued. */
export const NARRATION_PRIORITY: Record<NarrationSituation, number> = {
  ballots: 1,
  opening: 2,
  close_race: 2,
  landslide: 2,
  last_urn: 3,
  outraged: 3,
  lead_change: 4,
  final: 5,
};

/** One voice at a time: may `next` start while `current` is speaking? */
export function mayInterrupt(current: NarrationSituation | null, next: NarrationSituation): boolean {
  return current === null || NARRATION_PRIORITY[next] > NARRATION_PRIORITY[current];
}
