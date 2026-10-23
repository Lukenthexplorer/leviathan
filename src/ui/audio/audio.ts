import { Howl, Howler } from "howler";
import { MUSIC_STEMS, NARRATION, SFX, type SfxId, type StemId } from "../assets";
import { makeRoundRobin, mayInterrupt, type NarrationSituation } from "./rules";

/**
 * AudioManager: the only place that talks to Howler.
 * - sfx(id): one-shot sounds. Variations play in rotation, with a little pitch
 *   variation so repeats don't feel robotic.
 * - setTension(0..1): crossfades the layered music stems (calm piano -> drums).
 * - narrate(situation): the election-night radio narrator. One voice at a
 *   time: more important lines interrupt, the rest are dropped; the music
 *   ducks while he speaks.
 * Browsers block audio until the first user gesture, so music starts on `unlock()`.
 */

const howls = new Map<string, Howl>();
const stems = new Map<StemId, Howl>();
const pick = makeRoundRobin();
let musicStarted = false;
let tension = 0;
/** True while the city map is open: the street ambience comes forward. */
let cityFocus = false;
/** While the narrator speaks, the music drops to this fraction. */
const DUCK = 0.3;
let ducked = false;

// Target volume of each stem as a function of tension.
const STEM_MIX: Record<StemId, (t: number) => number> = {
  office_piano_stem: (t) => 0.5 * (1 - t * 0.6),
  tension_drums_stem: (t) => 0.6 * Math.max(0, (t - 0.3) / 0.7),
  city_ambience: () => (cityFocus ? 0.7 : 0.25),
};

function howl(src: string, html5 = false): Howl {
  let h = howls.get(src);
  if (!h) {
    // Long narration streams (html5); short effects are decoded up front.
    h = new Howl({ src: [src], preload: true, html5 });
    howls.set(src, h);
  }
  return h;
}

/** One file, or the next in the rotation. */
function variant(id: string, files: string | readonly string[]): string | null {
  if (typeof files === "string") return files;
  if (files.length === 0) return null;
  return files[pick(id, files.length)]!;
}

function applyMix(fadeMs: number) {
  for (const [id, h] of stems) h.fade(h.volume(), STEM_MIX[id](tension) * (ducked ? DUCK : 1), fadeMs);
}

let voice: { situation: NarrationSituation; howl: Howl; id: number } | null = null;

export const audio = {
  sfx(id: SfxId, opts: { volume?: number; pitchJitter?: number } = {}) {
    const src = variant(id, SFX[id]);
    if (!src) return;
    const h = howl(src);
    const playId = h.play();
    const jitter = opts.pitchJitter ?? 0.06;
    h.rate(1 + (Math.random() * 2 - 1) * jitter, playId);
    h.volume(opts.volume ?? 1, playId);
  },

  /**
   * The radio narrator. Returns false (and plays nothing) if a line of equal
   * or higher importance is already playing, or if there's no recording yet.
   */
  narrate(situation: NarrationSituation): boolean {
    if (voice && !mayInterrupt(voice.situation, situation)) return false;
    const src = variant(`narration:${situation}`, NARRATION[situation]);
    if (!src) return false;
    if (voice) {
      // Interrupted: a quick fade so it doesn't click.
      const old = voice;
      old.howl.fade(old.howl.volume(), 0, 150, old.id);
      window.setTimeout(() => old.howl.stop(old.id), 160);
    }
    const h = howl(src, true);
    const id = h.play();
    h.volume(1, id);
    voice = { situation, howl: h, id };
    ducked = true;
    applyMix(400);
    const done = () => {
      if (voice?.id !== id) return; // a newer line already took over
      voice = null;
      ducked = false;
      applyMix(800);
    };
    h.once("end", done, id);
    h.once("stop", done, id);
    return true;
  },

  /** Silence the narrator (skip, leaving the screen). */
  stopNarration() {
    if (!voice) return;
    voice.howl.stop(voice.id);
    voice = null;
    ducked = false;
    applyMix(400);
  },

  /** Call from the first click/keypress. Safe to call many times. */
  unlock() {
    if (musicStarted) return;
    musicStarted = true;
    for (const [id, src] of Object.entries(MUSIC_STEMS) as [StemId, string][]) {
      const h = new Howl({ src: [src], loop: true, volume: STEM_MIX[id](tension) });
      h.play();
      stems.set(id, h);
    }
  },

  setTension(next: number, fadeMs = 2000) {
    tension = Math.max(0, Math.min(1, next));
    applyMix(fadeMs);
  },

  setCityFocus(on: boolean, fadeMs = 1200) {
    cityFocus = on;
    applyMix(fadeMs);
  },

  setMuted(muted: boolean) {
    Howler.mute(muted);
  },
};
