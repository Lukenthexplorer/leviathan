/**
 * Generates placeholder art (labelled SVGs) and audio (synthesised WAVs).
 * Real assets later replace these files one-for-one: same id, same folder.
 * Run: npm run gen:placeholders
 */
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, join } from "node:path";

const ROOT = join(import.meta.dirname, "..", "public", "assets");

/**
 * Never overwrite or shadow real assets: if `name.anything-else` already exists
 * next to the placeholder (mentor_neutral.png, tv_power_on.mp3, vote_tick_1.mp3...),
 * the placeholder is skipped.
 */
function hasRealAsset(file: string): boolean {
  const dir = dirname(file);
  if (!existsSync(dir)) return false;
  const stem = basename(file, extname(file));
  return readdirSync(dir).some((f) => extname(f) !== extname(file) && (basename(f, extname(f)) === stem || basename(f, extname(f)).startsWith(`${stem}_`)));
}

function write(rel: string, data: string | Buffer) {
  const file = join(ROOT, rel);
  if (hasRealAsset(file)) return;
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, data);
}

// ---------------------------------------------------------------- images

function svg(w: number, h: number, bg: string, label: string, sub = "") {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="100%" height="100%" fill="${bg}"/>
  <rect x="6" y="6" width="${w - 12}" height="${h - 12}" fill="none" stroke="#00000055" stroke-width="3" stroke-dasharray="10 6"/>
  <text x="50%" y="48%" text-anchor="middle" font-family="Georgia, serif" font-size="${Math.round(w / 14)}" fill="#f1e6cf">${label}</text>
  <text x="50%" y="58%" text-anchor="middle" font-family="monospace" font-size="${Math.round(w / 24)}" fill="#f1e6cfaa">${sub}</text>
</svg>`;
}

const PORTRAIT_SUBJECTS = [
  "mentor", "rival", "journalist", "party_boss_labour", "donor", "community_leader",
  // election night: opponents and the anchor
  "candidate_galvao", "candidate_tiao", "candidate_heitor", "candidate_marcia", "candidate_jorginho",
  "candidate_nilton", "candidate_moura", "candidate_cleide", "anchor_cid",
];
const EXPRESSIONS: Record<string, string> = {
  neutral: "#5a4a3a",
  pleased: "#6b5a32",
  angry: "#6e3029",
  suspicious: "#3b4250",
};
for (const who of PORTRAIT_SUBJECTS) {
  for (const [expr, color] of Object.entries(EXPRESSIONS)) {
    write(`portraits/${who}_${expr}.svg`, svg(400, 500, color, who.replace("_", " "), expr));
  }
}

// The desk background is final art now (public/assets/desk.png): no placeholder needed.

const DESK_ART: Record<string, [number, number, string]> = {
  paper_blank: [600, 800, "#d8ccb0"],
  newspaper_frame: [900, 1200, "#cfc6b2"],
  campaign_folder: [300, 300, "#7a2620"],
  phone: [300, 240, "#1e1e1e"],
  coffee_cup: [200, 200, "#4b3022"],
  calendar_page: [300, 360, "#e8dcc2"],
};
for (const [id, [w, h, bg]] of Object.entries(DESK_ART)) {
  write(`desk/${id}.svg`, svg(w, h, bg, id));
}

// ---------------------------------------------------------------- audio

const RATE = 22050;

/** Encode mono float samples (-1..1) as a 16-bit PCM WAV file. */
function wav(samples: Float32Array): Buffer {
  const buf = Buffer.alloc(44 + samples.length * 2);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + samples.length * 2, 4);
  buf.write("WAVEfmt ", 8);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(RATE, 24);
  buf.writeUInt32LE(RATE * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(samples.length * 2, 40);
  samples.forEach((s, i) => buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s)) * 32767), 44 + i * 2));
  return buf;
}

/** Build `seconds` of audio from a per-sample function f(t). */
function synth(seconds: number, f: (t: number) => number): Float32Array {
  const out = new Float32Array(Math.floor(seconds * RATE));
  for (let i = 0; i < out.length; i++) out[i] = f(i / RATE);
  return out;
}

// Deterministic noise, re-seeded from each sound's name: regenerating gives identical files, and
// adding or removing one sound never changes the others (nicer git diffs).
let seed = 1;
const seeded = (name: string, make: () => Float32Array) => () => {
  seed = [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 2147483646, 7) + 1;
  return make();
};
const noise = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
const sine = (hz: number, t: number) => Math.sin(2 * Math.PI * hz * t);
const decay = (t: number, k: number) => Math.exp(-t * k);

const SFX: Record<string, () => Float32Array> = {
  stamp_thud: seeded("stamp_thud", () => synth(0.35, (t) => (sine(70 - t * 80, t) * 0.9 + noise() * 0.4 * decay(t, 40)) * decay(t, 12))),
  paper_slide: seeded("paper_slide", () => synth(0.4, (t) => noise() * 0.3 * Math.sin(Math.PI * (t / 0.4)))),
  paper_pickup: seeded("paper_pickup", () => synth(0.15, (t) => noise() * 0.35 * decay(t, 25))),
  typewriter_key: seeded("typewriter_key", () => synth(0.06, (t) => (noise() * 0.6 + sine(2200, t) * 0.3) * decay(t, 90))),
  pen_sign: seeded("pen_sign", () => synth(0.6, (t) => noise() * 0.18 * (0.5 + 0.5 * sine(9, t)))),
  page_flip: seeded("page_flip", () => synth(0.3, (t) => noise() * 0.4 * decay(Math.abs(t - 0.08), 30))),
  phone_ring: seeded("phone_ring", () => synth(1.2, (t) => (t % 0.6 < 0.4 ? (sine(440, t) + sine(480, t)) * 0.25 : 0))),
  newspaper_spin: seeded("newspaper_spin", () => synth(0.7, (t) => noise() * 0.3 * Math.sin(Math.PI * (t / 0.7)) * (0.6 + 0.4 * sine(12, t)))),
  drawer_open: seeded("drawer_open", () => synth(0.4, (t) => (noise() * 0.25 + sine(90, t) * 0.2) * Math.sin(Math.PI * (t / 0.4)))),
  clock_tick: seeded("clock_tick", () => synth(0.04, (t) => sine(3000, t) * 0.3 * decay(t, 150))),
  ui_hover: seeded("ui_hover", () => synth(0.05, (t) => sine(1400, t) * 0.12 * decay(t, 80))),
  ui_click: seeded("ui_click", () => synth(0.08, (t) => sine(900, t) * 0.3 * decay(t, 60))),
  scandal_sting: seeded("scandal_sting", () => synth(1.0, (t) => (sine(110, t) + sine(116.5, t) + sine(155, t)) * 0.25 * decay(t, 2.5))),
  opinion_up: seeded("opinion_up", () => synth(0.25, (t) => sine(660 + t * 600, t) * 0.2 * decay(t, 10))),
  opinion_down: seeded("opinion_down", () => synth(0.25, (t) => sine(520 - t * 400, t) * 0.2 * decay(t, 10))),
  // election night
  plantao_jingle: seeded("plantao_jingle", () => synth(2.2, (t) => {
    const notes = [523, 659, 784, 1047, 784, 1047];
    const n = notes[Math.min(notes.length - 1, Math.floor(t / 0.3))]!;
    return (sine(n, t) * 0.25 + sine(n * 1.5, t) * 0.08) * decay(t % 0.3, 4) * (t < 1.8 ? 1 : decay(t - 1.8, 6));
  })),
  crowd_cheer: seeded("crowd_cheer", () => synth(2.5, (t) => noise() * 0.35 * Math.sin(Math.PI * Math.min(1, t / 2.5)) * (0.7 + 0.3 * sine(3, t)))),
  // tv_power_on, tv_static, vote_tick, lead_change, fireworks, crowd_groan: real recordings (art/source/audio).
};
for (const [id, s] of Object.entries(SFX)) write(`audio/sfx/${id}.wav`, wav(s()));

// Music stems: 8-second loops that the AudioManager crossfades by tension.
const chord = [261.6, 329.6, 392.0, 493.9]; // Cmaj7, bossa-ish
const MUSIC: Record<string, () => Float32Array> = {
  office_piano_stem: seeded("office_piano_stem", () => synth(8, (t) => {
    const beat = t % 0.5;
    const note = chord[Math.floor(t / 0.5) % chord.length]!;
    return sine(note, t) * 0.15 * decay(beat, 5);
  })),
  tension_drums_stem: seeded("tension_drums_stem", () => synth(8, (t) => {
    const beat = t % 0.5;
    const kick = sine(55, t) * decay(beat, 18) * 0.6;
    const hat = (t % 0.25) < 0.02 ? noise() * 0.12 : 0;
    return kick + hat;
  })),
  city_ambience: seeded("city_ambience", () => synth(8, () => noise() * 0.04)),
};
for (const [id, s] of Object.entries(MUSIC)) write(`audio/music/${id}.wav`, wav(s()));

console.log(
  `Placeholders written to public/assets: ${PORTRAIT_SUBJECTS.length * 4} portraits, ` +
    `${Object.keys(DESK_ART).length} desk images, ${Object.keys(SFX).length} sfx, ${Object.keys(MUSIC).length} music stems.`,
);
