import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { DESK_ART, MUSIC_BEDS, MUSIC_LAYERS, NARRATION, SFX, portrait } from "./assets";

// Guards against typos in the manifest and against deleting a file the game still uses.
const publicDir = join(import.meta.dirname, "..", "..", "public");
const missing = (paths: string[]) => paths.filter((p) => !existsSync(join(publicDir, p)));

describe("asset manifest", () => {
  it("every sfx, music stem and desk image exists on disk", () => {
    expect(missing([...Object.values(SFX).flat(), ...Object.values(MUSIC_BEDS).flat(), ...Object.values(MUSIC_LAYERS), ...Object.values(DESK_ART)])).toEqual([]);
  });

  it("every narration recording exists on disk", () => {
    expect(missing(Object.values(NARRATION).flat())).toEqual([]);
  });

  it("key characters have all four expressions", () => {
    const paths = ["mentor", "rival", "journalist", "candidate_galvao", "anchor_cid"].flatMap((who) =>
      (["neutral", "pleased", "angry", "suspicious"] as const).map((e) => portrait(who, e)),
    );
    expect(missing(paths)).toEqual([]);
  });
});

describe("portrait fallback", () => {
  it("every character has final art: no placeholder face ever shows", () => {
    const finished = ["mentor", "rival", "journalist", "party_boss_liberal", "party_boss_conservative", "party_boss_centrao", "donor", "community_leader", "candidate_galvao", "anchor_cid"];
    for (const who of finished) {
      for (const e of ["neutral", "pleased", "angry", "suspicious"] as const) {
        // Placeholders are generated SVGs; final art is PNG or WebP.
        expect(portrait(who, e), `${who}/${e}`).toMatch(/\.(png|webp)$/);
      }
    }
  });

  it("uses the closest existing expression for characters with final art", () => {
    expect(portrait("journalist", "suspicious")).toBe("assets/portraits/journalist_suspicious.png");
    expect(portrait("journalist", "angry")).toBe("assets/portraits/journalist_suspicious.png");
    expect(portrait("journalist", "pleased")).toBe("assets/portraits/journalist_neutral.png");
    expect(portrait("mentor", "angry")).toBe("assets/portraits/mentor_neutral.png");
    expect(portrait("rival", "angry")).toBe("assets/portraits/rival_angry.webp");
    expect(portrait("rival", "suspicious")).toBe("assets/portraits/rival_neutral.png");
    expect(portrait("candidate_galvao", "suspicious")).toBe("assets/portraits/cand_galvao_neutral.webp");
    expect(portrait("anchor_cid", "pleased")).toBe("assets/portraits/anchor_excited.webp");
  });
});
