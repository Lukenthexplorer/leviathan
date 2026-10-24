import { Howl, Howler } from "howler";
import { MUSIC_BEDS, MUSIC_LAYERS, NARRATION, SFX, type LayerId, type SfxId } from "../assets";
import { makeRoundRobin, mayInterrupt, musicBed, musicMix, type MusicMode, type NarrationSituation } from "./rules";

/**
 * AudioManager: the only place that talks to Howler.
 * - sfx(id): one-shot sounds. Variations play in rotation, with a little pitch
 *   variation so repeats don't feel robotic.
 * - setMusic(mode): which bed plays (office piano, campaign track, election-night
 *   tension); a change crossfades. setTension(0..1) moves the volumes (rules.ts).
 * - narrate(situation): the election-night radio narrator. One voice at a
 *   time: more important lines interrupt, the rest are dropped; the music
 *   ducks while he speaks.
 * Browsers block audio until the first user gesture, so music starts on `unlock()`.
 */

const howls = new Map<string, Howl>();
const layers = new Map<LayerId, Howl>();
/** The bed playing now; old beds fade out and are unloaded. */
let bed: { src: string; howl: Howl } | null = null;
let mode: MusicMode = { kind: "office" };
/** Bed crossfade, ms. */
const BED_FADE = 2000;
const pick = makeRoundRobin();
let musicStarted = false;
let tension = 0;
/** True while the city map is open: the street ambience comes forward. */
let cityFocus = false;
/** A more important line fades the current one out over this many ms. */
const INTERRUPT_FADE = 200;
/** While the narrator speaks, the music drops to this fraction. */
const DUCK = 0.3;
let ducked = false;

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
  const mix = musicMix(mode, tension, cityFocus);
  const duck = ducked ? DUCK : 1;
  for (const [id, h] of layers) h.fade(h.volume(), mix[id] * duck, fadeMs);
  bed?.howl.fade(bed.howl.volume(), mix.bed * duck, fadeMs);
}

/** Loops are decoded in full (Web Audio), so they repeat without a gap. */
function loop(src: string, volume: number): Howl {
  const h = new Howl({ src: [src], loop: true, volume });
  h.play();
  return h;
}

/** Switch beds: the new one fades in while the old one fades out and is freed. */
function startBed() {
  const src = musicBed(mode, MUSIC_BEDS);
  if (bed?.src === src) return applyMix(BED_FADE);
  const old = bed;
  if (old) {
    old.howl.fade(old.howl.volume(), 0, BED_FADE);
    window.setTimeout(() => old.howl.unload(), BED_FADE + 100);
  }
  bed = src ? { src, howl: loop(src, 0) } : null;
  applyMix(BED_FADE);
}

let voice: { situation: NarrationSituation; howl: Howl; id: number } | null = null;

export const audio = {
  /** `fadeOutAfterMs`: long recordings (a sound truck) play a few seconds, then fade away. */
  /** Returns the sound's length in seconds (0 if unknown yet), so a scene can wait for it. */
  sfx(id: SfxId, opts: { volume?: number; pitchJitter?: number; fadeOutAfterMs?: number } = {}): number {
    const src = variant(id, SFX[id]);
    if (!src) return 0;
    const h = howl(src);
    const playId = h.play();
    const jitter = opts.pitchJitter ?? 0.06;
    const volume = opts.volume ?? 1;
    h.rate(1 + (Math.random() * 2 - 1) * jitter, playId);
    h.volume(volume, playId);
    if (opts.fadeOutAfterMs !== undefined) {
      window.setTimeout(() => {
        h.fade(volume, 0, 800, playId);
        h.once("fade", () => h.stop(playId), playId);
      }, opts.fadeOutAfterMs);
    }
    return h.duration();
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
      // Interrupted: a quick fade (~0.2 s) so it doesn't click.
      const old = voice;
      old.howl.fade(old.howl.volume(), 0, INTERRUPT_FADE, old.id);
      window.setTimeout(() => old.howl.stop(old.id), INTERRUPT_FADE + 10);
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
    const mix = musicMix(mode, tension, cityFocus);
    for (const [id, src] of Object.entries(MUSIC_LAYERS) as [LayerId, string][]) layers.set(id, loop(src, mix[id]));
    startBed();
  },

  /** Which bed plays. Safe before unlock(): it is remembered and starts with the music. */
  setMusic(next: MusicMode) {
    mode = next;
    if (musicStarted) startBed();
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
