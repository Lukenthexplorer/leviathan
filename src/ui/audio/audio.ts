import { Howl, Howler } from "howler";
import { MUSIC_STEMS, SFX, type SfxId, type StemId } from "../assets";

/**
 * AudioManager: the only place that talks to Howler.
 * - sfx(id): one-shot sounds with a little pitch variation so repeats don't feel robotic.
 * - setTension(0..1): crossfades the layered music stems (calm piano -> drums).
 * Browsers block audio until the first user gesture, so music starts on `unlock()`.
 */

const sfxCache = new Map<SfxId, Howl>();
const stems = new Map<StemId, Howl>();
let musicStarted = false;
let tension = 0;

// Target volume of each stem as a function of tension.
const STEM_MIX: Record<StemId, (t: number) => number> = {
  office_piano_stem: (t) => 0.5 * (1 - t * 0.6),
  tension_drums_stem: (t) => 0.6 * Math.max(0, (t - 0.3) / 0.7),
  city_ambience: () => 0.25,
};

function getSfx(id: SfxId): Howl {
  let h = sfxCache.get(id);
  if (!h) {
    h = new Howl({ src: [SFX[id]], preload: true });
    sfxCache.set(id, h);
  }
  return h;
}

export const audio = {
  sfx(id: SfxId, opts: { volume?: number; pitchJitter?: number } = {}) {
    const h = getSfx(id);
    const playId = h.play();
    const jitter = opts.pitchJitter ?? 0.06;
    h.rate(1 + (Math.random() * 2 - 1) * jitter, playId);
    h.volume(opts.volume ?? 1, playId);
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
    for (const [id, h] of stems) h.fade(h.volume(), STEM_MIX[id](tension), fadeMs);
  },

  setMuted(muted: boolean) {
    Howler.mute(muted);
  },
};
