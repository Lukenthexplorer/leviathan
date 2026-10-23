import { describe, expect, it } from "vitest";
import { BALANCE } from "../../content/balance";
import { advanceTurn } from "../../core/advanceTurn";
import type { Cause, Decision, GameState } from "../../core/types";
import { fundraiseAmount } from "./actions";
import { councilmanChapter as chapter } from "./chapter";
import { councilmanGoals, goalsMet } from "./goals";
import { writeLegacy } from "./legacy";

const C = BALANCE.councilman;
const cause: Cause = { kind: "system", id: "t", turn: 1, label: "t" };
const step = (s: GameState, d: Decision[] = []) => advanceTurn(s, d, chapter).state;

/** A councillor who has everything: the party's trust, money, and three groups. */
function readyToRun(turn: number = C.nominationOpensWeek): GameState {
  const s = chapter.createInitialState({ playerName: "Ana", party: "labour", form: "f" });
  s.turn = turn;
  s.characters.party_boss!.relation = C.nominationRelation;
  s.player.funds = C.fundsNeeded;
  for (const g of ["workers", "students", "periphery"]) {
    s.groups[g]!.memories.push({ label: "x", impact: 40, turn, cause });
  }
  // Clear the desk: no events should interfere with these tests.
  s.flags.convention_warned = 1;
  s.firedEvents = ["mentor_checkin", "journalist_profile", "mentor_favour", "boss_fundraiser", "rising_star"];
  s.inbox = [];
  return s;
}

describe("the three goals", () => {
  it("start unmet, and are reported in words and numbers", () => {
    const goals = councilmanGoals(chapter.createInitialState({ playerName: "A", party: "labour" }));
    expect(goals.map((g) => g.met)).toEqual([false, false, false]);
    expect(goals[1]!.progress).toBe(`${C.startingFunds}k de ${C.fundsNeeded}k`);
    expect(goals[0]!.progress).not.toMatch(/\d/); // the boss's trust is never a number
  });

  it("are all met for a councillor with trust, money and three groups", () => {
    expect(goalsMet(readyToRun())).toBe(true);
  });

  it("backing Renata gives up the nomination", () => {
    const s = readyToRun();
    s.flags.backed_rival = 1;
    expect(councilmanGoals(s)[0]!.met).toBe(false);
  });
});

describe("running for mayor", () => {
  it("asking for the nomination with everything in place ends the chapter in victory", () => {
    expect(step(readyToRun(), [{ kind: "seekNomination" }]).ending).toBe("candidacy");
  });

  it("can't ask before candidacies open, or without the three conditions", () => {
    expect(() => step(readyToRun(C.nominationOpensWeek - 1), [{ kind: "seekNomination" }])).toThrow("só abrem");
    const broke = readyToRun();
    broke.player.funds = 0;
    expect(() => step(broke, [{ kind: "seekNomination" }])).toThrow("três condições");
  });

  it("at the convention, the party decides: candidate, kingmaker, or next time", () => {
    expect(step(readyToRun(C.conventionWeek - 1)).ending).toBe("candidacy");

    const backer = readyToRun(C.conventionWeek - 1);
    backer.flags.backed_rival = 1;
    expect(step(backer).ending).toBe("kingmaker");

    const nobody = readyToRun(C.conventionWeek - 1);
    nobody.player.funds = 0;
    expect(step(nobody).ending).toBe("passed_over");
  });

  it("a scandal still beats a candidacy", () => {
    const s = readyToRun();
    s.hidden.dossier.push({ id: "x", label: "X", threads: C.arrestAtExposedThreads, turn: 1, exposed: true });
    expect(step(s, [{ kind: "seekNomination" }]).ending).toBe("arrested");
  });

  it("small-donor money grows with your roots in the neighbourhoods", () => {
    const s = chapter.createInitialState({ playerName: "A", party: "labour" });
    const none = fundraiseAmount(s);
    s.neighbourhoods.morro_esperanca!.base = 80;
    s.neighbourhoods.vila_operaria!.base = 80;
    expect(fundraiseAmount(s)).toBeGreaterThan(none);
    expect(step(s, [{ kind: "fundraise" }]).player.funds).toBe(s.player.funds + fundraiseAmount(s));
  });
});

describe("never lose without knowing why", () => {
  it("four weeks before the convention, the party says exactly what's missing", () => {
    const s = chapter.createInitialState({ playerName: "Ana", party: "liberal", form: "f" });
    s.turn = C.conventionWeek - C.conventionWarningWeeks - 1;
    const letter = step(s).inbox.find((i) => i.id === "convention_warning")!;
    expect(letter.body).toContain("Indicação do partido");
    expect(letter.body).toContain("Dinheiro de campanha");
  });

  it("a councillor passed over at the convention reads what was missing", () => {
    const s = readyToRun(C.conventionWeek - 1);
    s.characters.party_boss!.relation = 0;
    const end = step(s);
    expect(end.ending).toBe("passed_over");
    const missing = writeLegacy(end).sections.find((x) => x.title === "O que faltou")!;
    expect(missing.paragraphs).toEqual(["Indicação do partido: a cúpula ainda não confia em você."]);
  });
});
