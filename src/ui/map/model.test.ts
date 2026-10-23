import { describe, expect, it } from "vitest";
import { councilmanChapter } from "../../chapters/councilman/chapter";
import { NEIGHBOURHOOD_IDS } from "../../content/councilman/neighbourhoods";
import { DISTRICTS } from "./layout";
import { mapModel, moodColor } from "./model";

describe("city map model", () => {
  it("colours mood: red when furious, paper when calm, green when thriving", () => {
    expect(moodColor(0)).toBe(0xd8cba8);
    expect(moodColor(-100)).toBe(0x9a3a2c);
    expect(moodColor(100)).toBe(0x7fa062);
    expect(moodColor(-500)).toBe(moodColor(-100)); // clamped
  });

  it("every neighbourhood in the simulation has a shape on the map", () => {
    for (const id of NEIGHBOURHOOD_IDS) expect(DISTRICTS, id).toHaveProperty(id);
  });

  it("reflects the state: markers, roots and mood", () => {
    const s = councilmanChapter.createInitialState({ playerName: "A", party: "labour" });
    s.neighbourhoods.morro_esperanca!.markers.push("protest");
    s.neighbourhoods.morro_esperanca!.base = 24;
    const morro = mapModel(s).districts.find((d) => d.id === "morro_esperanca")!;
    expect(morro.markers).toEqual(["protest"]);
    expect(morro.base).toBe(24);
    expect(morro.moodWord).toBe("Inquieto"); // starts at -20
  });
});
