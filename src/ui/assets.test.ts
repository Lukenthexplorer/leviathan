import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { DESK_ART, MUSIC_STEMS, SFX, portrait } from "./assets";

// Guards against typos in the manifest and against deleting a file the game still uses.
const publicDir = join(import.meta.dirname, "..", "..", "public");
const missing = (paths: string[]) => paths.filter((p) => !existsSync(join(publicDir, p)));

describe("asset manifest", () => {
  it("every sfx, music stem and desk image exists on disk", () => {
    expect(missing([...Object.values(SFX), ...Object.values(MUSIC_STEMS), ...Object.values(DESK_ART)])).toEqual([]);
  });

  it("key characters have all four expressions", () => {
    const paths = ["mentor", "rival", "journalist"].flatMap((who) =>
      (["neutral", "pleased", "angry", "suspicious"] as const).map((e) => portrait(who, e)),
    );
    expect(missing(paths)).toEqual([]);
  });
});

describe("portrait fallback", () => {
  it("uses the closest existing expression for characters with final art", () => {
    expect(portrait("journalist", "suspicious")).toBe("assets/portraits/journalist_suspicious.png");
    expect(portrait("journalist", "angry")).toBe("assets/portraits/journalist_suspicious.png");
    expect(portrait("journalist", "pleased")).toBe("assets/portraits/journalist_neutral.png");
    expect(portrait("mentor", "angry")).toBe("assets/portraits/mentor_neutral.png");
    expect(portrait("rival", "angry")).toBe("assets/portraits/rival_angry.svg"); // still a placeholder
  });
});
