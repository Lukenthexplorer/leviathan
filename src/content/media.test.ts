import { describe, expect, it } from "vitest";
import { advanceTurn } from "../core/advanceTurn";
import { councilmanChapter } from "../chapters/councilman/chapter";
import { MEDIA_CHANNELS, channelFor } from "./media";

describe("media by era", () => {
  it("every year from 1980 to 2030 has exactly one calm and one loud channel", () => {
    for (let year = 1980; year <= 2030; year++) {
      for (const style of ["informative", "populist"] as const) {
        const matches = MEDIA_CHANNELS.filter((m) => m.style === style && year >= m.from && year <= m.to);
        expect(matches, `${style} in ${year}`).toHaveLength(1);
      }
    }
  });

  it("no social media in 1989; social media from 2016", () => {
    expect(channelFor(1989, "informative").name).toBe("Entrevista na rádio");
    expect(channelFor(1989, "populist").name).toBe("Carro de som");
    expect(channelFor(2016, "populist").name).toBe("Vídeo viral");
  });

  it("the councillor's history says how they reached people, in period terms", () => {
    const s = councilmanChapter.createInitialState({ playerName: "A", party: "labour" });
    const after = advanceTurn(s, [{ kind: "media", style: "populist", group: "students" }], councilmanChapter).state;
    expect(after.history.at(-1)!.text).toBe("Prometeu mundos e fundos aos estudantes no carro de som");
  });
});
