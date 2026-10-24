/**
 * Prepares a recorded sound for the game (needs ffmpeg on the PATH):
 *   1. trims silence at the start and the end,
 *   2. normalizes loudness in two passes (measure, then correct) so every
 *      sound sits at a similar level,
 *   3. encodes a light MP3 for the web (MP3 plays everywhere, Safari included).
 *
 *   npm run audio:process -- <input> <output.mp3> [sfx|narration|loop]
 *
 * sfx: 128 kbps stereo. narration: 96 kbps mono (the radio voice is mono anyway).
 * loop (music and ambience): silence is NOT trimmed (that would break the loop's
 * length); instead the last seconds are crossfaded into the start, so the file
 * ends exactly where it begins and repeats without a seam.
 * The radio effect is baked into the narration recordings: no filter is added.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import { dirname } from "node:path";

/** Target loudness for everything: similar levels, a little headroom. */
const TARGET = { I: -16, TP: -1.5, LRA: 11 };

const TRIM =
  "silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.02," +
  "areverse,silenceremove=start_periods=1:start_threshold=-55dB:start_silence=0.05,areverse";

function ffmpeg(args: string[]): string {
  // ffmpeg prints its analysis on stderr; capture both streams.
  return execFileSync("ffmpeg", ["-hide_banner", "-nostats", ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).toString();
}

/** Pass 1: measure loudness after trimming (ffmpeg prints it on stderr). Null when the clip is too short to measure. */
function measure(input: string): Record<string, string> | null {
  const r = spawnSync(
    "ffmpeg",
    ["-hide_banner", "-nostats", "-i", input, "-af", `${TRIM},loudnorm=I=${TARGET.I}:TP=${TARGET.TP}:LRA=${TARGET.LRA}:print_format=json`, "-f", "null", "-"],
    { encoding: "utf8" },
  );
  return parseJson(r.stderr);
}

/** Pass 1 without trimming (loops keep every sample). */
function measureRaw(input: string): Record<string, string> | null {
  const r = spawnSync(
    "ffmpeg",
    ["-hide_banner", "-nostats", "-i", input, "-af", `loudnorm=I=${TARGET.I}:TP=${TARGET.TP}:LRA=${TARGET.LRA}:print_format=json`, "-f", "null", "-"],
    { encoding: "utf8" },
  );
  return parseJson(r.stderr);
}

/** Pass 2: correct with the measured values (linear: no pumping). */
function loudnormWith(m: Record<string, string>): string {
  return `loudnorm=I=${TARGET.I}:TP=${TARGET.TP}:LRA=${TARGET.LRA}:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`;
}

/** Short clips: bring the loudest peak to this level instead. */
const SHORT_PEAK_DB = -3;

function peakDb(input: string): number {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-nostats", "-i", input, "-af", `${TRIM},volumedetect`, "-f", "null", "-"], { encoding: "utf8" });
  const match = /max_volume: (-?[\d.]+) dB/.exec(r.stderr);
  return match ? Number(match[1]) : SHORT_PEAK_DB;
}

function parseJson(text: string): Record<string, string> | null {
  const start = text.lastIndexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end < start) return null;
  const json = JSON.parse(text.slice(start, end + 1)) as Record<string, string>;
  return Number.isFinite(Number(json.input_i)) ? json : null;
}

export type AudioKind = "sfx" | "narration" | "loop";

/** Seconds of the end that get blended into the start of a loop. */
const LOOP_CROSSFADE = 2;

function duration(input: string): number {
  const out = execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", input], { encoding: "utf8" });
  return Number(out.trim());
}

/**
 * Seamless loop: out = [tail fading out + head fading in] + middle. The output is
 * LOOP_CROSSFADE shorter than the input; its last sample leads straight back into
 * its first, which is where the tail continues. Equal-power curves (qsin) keep the
 * level steady across the blend.
 */
function loopFilter(input: string): string {
  const d = duration(input);
  const x = Math.min(LOOP_CROSSFADE, d / 4);
  return (
    `[0:a]asplit=3[a][b][c];` +
    `[a]atrim=0:${x},asetpts=N/SR/TB,afade=t=in:d=${x}:curve=qsin[head];` +
    `[b]atrim=${d - x}:${d},asetpts=N/SR/TB,afade=t=out:d=${x}:curve=qsin[tail];` +
    `[c]atrim=${x}:${d - x},asetpts=N/SR/TB[mid];` +
    `[head][tail]amix=inputs=2:normalize=0[blend];` +
    `[blend][mid]concat=n=2:v=0:a=1[out]`
  );
}

export function processAudio(input: string, output: string, kind: AudioKind): void {
  mkdirSync(dirname(output), { recursive: true });
  if (kind === "loop") {
    // Build the seamless loop first (lossless WAV), then normalize it like everything else, without trimming.
    const tmp = `${output}.loop.wav`;
    ffmpeg(["-y", "-i", input, "-filter_complex", loopFilter(input), "-map", "[out]", "-c:a", "pcm_s16le", tmp]);
    const m = measureRaw(tmp);
    const level = m ? loudnormWith(m) : "anull";
    ffmpeg(["-y", "-i", tmp, "-af", level, "-ar", "44100", "-c:a", "libmp3lame", "-ac", "2", "-b:a", "160k", output]);
    rmSync(tmp);
    return;
  }
  const m = measure(input);
  // Very short clips can't be measured for integrated loudness, so they are peak-normalized instead.
  const level = m ? loudnormWith(m) : `volume=${(SHORT_PEAK_DB - peakDb(input)).toFixed(1)}dB`;
  const codec = kind === "narration" ? ["-ac", "1", "-b:a", "96k"] : ["-ac", "2", "-b:a", "128k"];
  ffmpeg(["-y", "-i", input, "-af", `${TRIM},${level}`, "-ar", "44100", "-c:a", "libmp3lame", ...codec, output]);
}

// CLI
if (process.argv[1]?.endsWith("process-audio.ts")) {
  const [input, output, kind = "sfx"] = process.argv.slice(2);
  if (!input || !output) {
    console.error("usage: npm run audio:process -- <input> <output.mp3> [sfx|narration|loop]");
    process.exit(1);
  }
  processAudio(input, output, kind as AudioKind);
  console.log(`ok: ${output}`);
}
