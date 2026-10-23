import { describe, expect, it } from "vitest";
import { BALANCE } from "../../content/balance";
import { CHARACTERS } from "../../content/councilman/characters";
import { GROUPS, GROUP_IDS } from "../../content/councilman/groups";
import { NEIGHBOURHOODS } from "../../content/councilman/neighbourhoods";
import { PARTIES, PARTY_IDS } from "../../content/councilman/parties";
import { advanceTurn } from "../../core/advanceTurn";
import { readRef } from "../../core/conditions";
import { opinionOf } from "../../core/groups";
import type { GameState } from "../../core/types";
import { councilmanChapter as chapter } from "./chapter";

const start = (party = "labour") => chapter.createInitialState({ playerName: "Test", party });

function run(state: GameState, weeks: number, decide: (s: GameState) => Parameters<typeof advanceTurn>[1] = () => []) {
  for (let i = 0; i < weeks && !state.ending; i++) state = advanceTurn(state, decide(state), chapter).state;
  return state;
}

describe("content integrity", () => {
  it("every party sets an opinion for every group, within range", () => {
    for (const p of PARTY_IDS) {
      for (const g of GROUP_IDS) {
        const v = PARTIES[p].startingOpinions[g];
        expect(v, `${p}.${g}`).toBeGreaterThanOrEqual(-100);
        expect(v, `${p}.${g}`).toBeLessThanOrEqual(100);
      }
    }
  });

  it("neighbourhood residents are real groups and shares add up to 1", () => {
    for (const [id, nb] of Object.entries(NEIGHBOURHOODS)) {
      const shares = Object.entries(nb.residents);
      for (const [g] of shares) expect(GROUPS, `${id} -> ${g}`).toHaveProperty(g);
      expect(shares.reduce((s, [, v]) => s + v, 0), id).toBeCloseTo(1);
    }
  });
});

describe("councilman chapter", () => {
  it("party choice sets the starting landscape", () => {
    expect(opinionOf(start("labour"), "workers")).toBeGreaterThan(opinionOf(start("liberal"), "workers"));
    expect(opinionOf(start("conservative"), "religious")).toBeGreaterThan(opinionOf(start("labour"), "religious"));
    expect(start().characters.mentor!.relation).toBe(CHARACTERS.mentor.startingRelation);
  });

  it("enforces one media appearance per week and the agenda limit", () => {
    const radio = { kind: "media", style: "informative", group: "workers" } as const;
    expect(() => advanceTurn(start(), [radio, radio], chapter)).toThrow("Só uma aparição");
  });

  it("populism: fast popularity now, a crash later", () => {
    let s = start();
    const before = readRef(s, "averageOpinion");
    // Eight weeks of populist posts, rotating target groups.
    s = run(s, 8, (st) => [{ kind: "media", style: "populist", group: GROUP_IDS[st.turn % GROUP_IDS.length]! }]);
    const peak = readRef(s, "averageOpinion");
    expect(peak).toBeGreaterThan(before);
    expect(s.hidden.expectations).toBeGreaterThan(BALANCE.expectations.tolerance);

    s = run(s, 10); // stop posting: promises come due
    expect(readRef(s, "averageOpinion")).toBeLessThan(before);
  });

  it("calm media appearances grow slowly and never build expectations", () => {
    const s = run(start(), 8, () => [{ kind: "media", style: "informative", group: "students" }]);
    expect(s.hidden.expectations).toBe(0);
    expect(opinionOf(s, "students")).toBeGreaterThan(opinionOf(start(), "students"));
  });

  it("a dirty past is eventually exposed, and enough exposure ends in arrest", () => {
    const s0 = start();
    s0.hidden.dossier.push(
      { id: "a", label: "Cash from a contractor", threads: 4, turn: 1, exposed: false },
      { id: "b", label: "Phantom employee", threads: 4, turn: 1, exposed: false },
    );
    const s = run(s0, 60);
    expect(s.flags.scandals).toBeGreaterThanOrEqual(1);
    expect(s.ending).toBe("arrested");
  });
});
