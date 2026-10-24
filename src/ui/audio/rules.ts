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
export type NarrationSituation = "opening" | "ballots" | "close_race" | "landslide" | "last_ballot" | "lead_change" | "outraged" | "final";

/** Higher interrupts lower. Equal or lower is dropped, never queued. */
export const NARRATION_PRIORITY: Record<NarrationSituation, number> = {
  final: 8,
  last_ballot: 7,
  lead_change: 6,
  outraged: 5,
  close_race: 4,
  landslide: 3,
  opening: 2,
  ballots: 1,
};

/** One voice at a time: may `next` start while `current` is speaking? */
export function mayInterrupt(current: NarrationSituation | null, next: NarrationSituation): boolean {
  return current === null || NARRATION_PRIORITY[next] > NARRATION_PRIORITY[current];
}

// ------------------------------------------------------------------ music

/** What the music is underscoring right now. */
export type MusicMode = { kind: "office" } | { kind: "campaign"; week: number } | { kind: "election" } | { kind: "silent" };
export type MusicBeds = Record<Exclude<MusicMode["kind"], "silent">, readonly string[]>;

/** The bed for a moment (null: no bed). The campaign alternates its versions week by week (deterministic, not random). */
export function musicBed(mode: MusicMode, beds: MusicBeds): string | null {
  if (mode.kind === "silent") return null;
  const files = beds[mode.kind];
  return files[mode.kind === "campaign" ? mode.week % files.length : 0]!;
}

/** Target volumes (0..1) for a tension level. Ducked by the narrator on top of this. */
export function musicMix(mode: MusicMode, tension: number, cityFocus: boolean) {
  const t = Math.max(0, Math.min(1, tension));
  const bed = {
    office: 0.5 * (1 - t * 0.6),
    campaign: 0.55 * (1 - t * 0.4),
    // Counting night: the bed itself carries the tension, louder as the margin tightens.
    election: 0.25 + 0.55 * t,
    silent: 0,
  }[mode.kind];
  return {
    bed,
    // The drums are the desk's warning sign; on election night the tension bed takes over.
    tension_drums_stem: mode.kind === "election" || mode.kind === "silent" ? 0 : 0.6 * Math.max(0, (t - 0.3) / 0.7),
    city_ambience: cityFocus ? 0.7 : 0.25,
  };
}
