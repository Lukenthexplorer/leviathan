/**
 * Generates placeholder art (labelled SVGs) and audio (synthesised WAVs).
 * Real assets later replace these files one-for-one: same id, same folder.
 * Run: npm run gen:placeholders
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, join } from "node:path";
import { deflateSync } from "node:zlib";

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

/** Every placeholder PNG carries this text chunk; a PNG without it is real art and is never touched. */
const PLACEHOLDER_MARK = "leviathan-placeholder";

function write(rel: string, data: string | Buffer) {
  const file = join(ROOT, rel);
  if (hasRealAsset(file)) return;
  // Real art may arrive with the very same name (lamp.png): keep it.
  if (extname(file) === ".png" && existsSync(file) && !readFileSync(file).includes(PLACEHOLDER_MARK)) return;
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

// ---------------------------------------------------------------- desk objects (PNG)
// Top-down silhouettes drawn from simple shapes, so the desk can be composed and
// lit before the real art exists. No text: the file name is the label.

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Buffer): Buffer {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length, 0);
  head.write(type, 4, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), data])), 0);
  return Buffer.concat([head, data, crc]);
}
/** RGBA pixels -> PNG (8-bit, no interlace), tagged as a placeholder. */
function png(w: number, h: number, rgba: Uint8Array): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr.set([8, 6, 0, 0, 0], 8); // 8-bit RGBA
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) raw.set(rgba.subarray(y * w * 4, (y + 1) * w * 4), y * (w * 4 + 1) + 1); // filter 0 per row
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("tEXt", Buffer.from(`Comment\0${PLACEHOLDER_MARK}`, "latin1")),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/** A shape is a signed distance (negative inside) plus a colour; later shapes paint over earlier ones. */
type Shape = { d: (x: number, y: number) => number; color: string };
const circle = (cx: number, cy: number, r: number, color: string): Shape => ({ d: (x, y) => Math.hypot(x - cx, y - cy) - r, color });
const box = (x0: number, y0: number, x1: number, y1: number, radius: number, color: string): Shape => ({
  d: (x, y) => {
    const qx = Math.abs(x - (x0 + x1) / 2) - (x1 - x0) / 2 + radius;
    const qy = Math.abs(y - (y0 + y1) / 2) - (y1 - y0) / 2 + radius;
    return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - radius;
  },
  color,
});
const capsule = (ax: number, ay: number, bx: number, by: number, r: number, color: string): Shape => ({
  d: (x, y) => {
    const t = Math.max(0, Math.min(1, ((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / ((bx - ax) ** 2 + (by - ay) ** 2)));
    return Math.hypot(x - ax - t * (bx - ax), y - ay - t * (by - ay)) - r;
  },
  color,
});

function draw(w: number, h: number, shapes: Shape[]): Buffer {
  const px = new Uint8Array(w * h * 4);
  const rgb = shapes.map((s) => [1, 3, 5, 7].map((i) => (i < s.color.length ? parseInt(s.color.slice(i, i + 2), 16) : 255)));
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let [r, g, b, a] = [0, 0, 0, 0];
      shapes.forEach((s, i) => {
        const cover = Math.max(0, Math.min(1, 0.5 - s.d(x + 0.5, y + 0.5))) * (rgb[i]![3]! / 255); // 1px anti-aliasing
        if (cover <= 0) return;
        const [sr, sg, sb] = rgb[i]!;
        const out = cover + a * (1 - cover);
        r = (sr! * cover + r * a * (1 - cover)) / out;
        g = (sg! * cover + g * a * (1 - cover)) / out;
        b = (sb! * cover + b * a * (1 - cover)) / out;
        a = out;
      });
      px.set([r, g, b, a * 255].map(Math.round), (y * w + x) * 4);
    }
  }
  return png(w, h, px);
}

const range = (n: number) => Array.from({ length: n }, (_, i) => i);

const DESK_OBJECTS: Record<string, () => Buffer> = {
  // Desk lamp seen from above, for the top-right corner: brass base in the corner, the arm reaching
  // toward the middle of the desk, green shade with the bulb glowing in its mouth.
  lamp: () => draw(520, 520, [
    circle(410, 110, 95, "#6b5226"), circle(410, 110, 80, "#a8843c"), circle(410, 110, 22, "#4a3a1a"),
    capsule(410, 110, 220, 300, 16, "#8a6c30"),
    circle(200, 320, 150, "#1f4a32"), circle(200, 320, 130, "#2c6446"), circle(200, 320, 70, "#fff2c8"), circle(200, 320, 40, "#fffbe8"),
  ]),
  ashtray: () => draw(320, 320, [
    circle(160, 160, 150, "#9fb6b4cc"), circle(160, 160, 112, "#6f8584cc"), circle(160, 160, 100, "#3a3634"),
    circle(130, 175, 30, "#5a5450"), circle(190, 140, 22, "#4c4744"),
    ...range(4).map((i) => box(152 + Math.cos((i * Math.PI) / 2) * 128 - 14, 152 + Math.sin((i * Math.PI) / 2) * 128 - 6, 152 + Math.cos((i * Math.PI) / 2) * 128 + 30, 152 + Math.sin((i * Math.PI) / 2) * 128 + 22, 6, "#2e2a28")),
    capsule(150, 160, 300, 100, 11, "#f2ece0"), capsule(150, 160, 175, 150, 11.5, "#d8a050"), circle(150, 160, 10, "#e0582a"),
  ]),
  typewriter: () => draw(720, 560, [
    box(110, 20, 610, 210, 6, "#f4efe2"), // the sheet in the carriage
    box(40, 170, 680, 250, 24, "#2a2826"), box(20, 185, 60, 235, 10, "#b8b0a0"), box(660, 185, 700, 235, 10, "#b8b0a0"), // carriage, knobs
    box(60, 240, 660, 540, 40, "#3a3836"),
    box(120, 260, 600, 330, 20, "#1c1b1a"), // type basket
    ...range(4).flatMap((row) => range(11 - (row === 3 ? 4 : 0)).map((k) => circle(150 + row * 18 + k * 42 + (row === 3 ? 84 : 0), 360 + row * 40, 15, "#e8e2d4"))),
    box(230, 510, 490, 532, 10, "#e8e2d4"), // space bar
  ]),
  rotary_phone: () => draw(440, 440, [
    box(40, 120, 400, 420, 60, "#161514"),
    capsule(70, 90, 370, 90, 42, "#0e0d0c"), circle(70, 90, 56, "#1d1c1b"), circle(370, 90, 56, "#1d1c1b"), // handset on the cradle
    circle(220, 290, 110, "#e8e2d4"), circle(220, 290, 104, "#2a2826"),
    ...range(10).map((i) => circle(220 + Math.cos(-Math.PI / 3 + (i * Math.PI * 1.6) / 9) * 74, 290 + Math.sin(-Math.PI / 3 + (i * Math.PI * 1.6) / 9) * 74, 15, "#e8e2d4")),
    circle(220, 290, 34, "#c4302a"),
  ]),
  // Twin-bell alarm clock, face up. The hands are drawn by the game on top.
  desk_clock: () => draw(320, 320, [
    circle(80, 70, 50, "#9a7a3a"), circle(240, 70, 50, "#9a7a3a"), capsule(80, 70, 240, 70, 8, "#6b5226"),
    capsule(80, 260, 50, 305, 12, "#6b5226"), capsule(240, 260, 270, 305, 12, "#6b5226"),
    circle(160, 175, 120, "#a8843c"), circle(160, 175, 104, "#f3ead2"),
    ...range(12).map((i) => circle(160 + Math.sin((i * Math.PI) / 6) * 88, 175 - Math.cos((i * Math.PI) / 6) * 88, i % 3 ? 3 : 6, "#2a2320")),
  ]),
  // A torn newspaper clipping; the game prints the poll on it.
  poll_clipping: () => draw(1000, 300, [
    { d: (x, y) => Math.max(box(0, 0, 1000, 300, 0, "").d(x, y), -Math.min(y, 300 - y, x, 1000 - x) + 6 + 5 * Math.sin(x * 0.21) * Math.cos(y * 0.17)), color: "#e6dfcc" },
    box(30, 26, 970, 30, 0, "#2a232044"), box(30, 270, 970, 273, 0, "#2a232022"),
  ]),
  // A small account book, open: ruled page and a red margin. The game writes on it.
  ledger: () => draw(380, 480, [
    box(0, 0, 380, 480, 14, "#3d2a1e"), box(14, 14, 366, 466, 6, "#f1e9d2"),
    ...range(17).map((i) => box(14, 70 + i * 23, 366, 71 + i * 23, 0, "#7c9ab855")),
    box(70, 14, 72, 466, 0, "#c4302a88"),
    capsule(190, 0, 190, 14, 3, "#00000033"),
  ]),
};
for (const [id, make] of Object.entries(DESK_OBJECTS)) write(`desk/${id}.png`, make());

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
    `${Object.keys(DESK_ART).length} desk images, ${Object.keys(DESK_OBJECTS).length} desk objects, ${Object.keys(SFX).length} sfx, ${Object.keys(MUSIC).length} music stems.`,
);
