import { describe, expect, it } from "vitest";
import { BALANCE } from "../../content/balance";
import { OPPONENTS } from "../../content/councilman/candidates";
import type { Cause, GameState, PathId } from "../../core/types";
import { councilmanChapter as chapter } from "./chapter";
import { CITY_ORDER, PLAYER, computeElection, electionUnits } from "./election";

const cause: Cause = { kind: "system", id: "t", turn: 1, label: "t" };

/** A councillor at the end of the campaign, shaped by `setup`. */
function career(path: PathId, setup: (s: GameState) => void = () => {}): GameState {
  const s = chapter.createInitialState({ playerName: "Ana Lima", party: "labour", form: "f" });
  s.turn = BALANCE.campaign.endWeek + 1;
  s.campaign = { path, presence: {}, cabos: {}, endorsements: [], attacks: [], opponentDamage: {}, polls: [] };
  setup(s);
  return s;
}
const love = (s: GameState, group: string, impact = 60) => s.groups[group]!.memories.push({ label: "x", impact, turn: s.turn, cause });

/** % of valid votes the player has after each batch. */
function playerTrail(s: GameState, path: PathId): number[] {
  const r = computeElection(s, path);
  const sum: Record<string, number> = {};
  return r.batches.map((b) => {
    for (const [id, v] of Object.entries(b.votes)) sum[id] = (sum[id] ?? 0) + v;
    const valid = Object.values(sum).reduce((a, c) => a + c, 0);
    return (sum[PLAYER]! / valid) * 100;
  });
}
const leads = (s: GameState, path: PathId, upTo: number) => {
  const r = computeElection(s, path);
  const sum: Record<string, number> = {};
  for (const b of r.batches.slice(0, upTo)) for (const [id, v] of Object.entries(b.votes)) sum[id] = (sum[id] ?? 0) + v;
  return Object.entries(sum).sort((a, b) => b[1] - a[1])[0]![0];
};

describe("vote model", () => {
  it("is deterministic: same state, identical result", () => {
    const s = career("mayor", (x) => love(x, "periphery"));
    expect(computeElection(s, "mayor")).toEqual(computeElection(structuredClone(s), "mayor"));
  });

  it("batches add up to the final count, and the counting only goes forward to 100%", () => {
    for (const path of ["council", "mayor", "deputy"] as PathId[]) {
      const r = computeElection(career(path), path);
      const sum: Record<string, number> = {};
      for (const b of r.batches) for (const [id, v] of Object.entries(b.votes)) sum[id] = (sum[id] ?? 0) + v;
      expect(sum, path).toEqual(r.final);
      expect(r.batches.reduce((n, b) => n + b.nulls, 0)).toBe(r.finalNulls);
      const pct = r.batches.map((b) => b.cumulativePct);
      expect(pct.every((p, i) => i === 0 || p >= pct[i - 1]!), path).toBe(true);
      expect(pct.at(-1)).toBe(100);
    }
  });

  it("every path produces a winner, even with zero support (no NaN)", () => {
    for (const path of ["council", "mayor", "deputy"] as PathId[]) {
      const r = computeElection(career(path, (x) => (x.hidden.dossier = [{ id: "d", label: "d", threads: 40, turn: 1, exposed: true }])), path);
      expect([PLAYER, ...OPPONENTS[path]]).toContain(r.winner);
      for (const v of Object.values(r.final)) expect(Number.isFinite(v)).toBe(true);
    }
  });

  it("urns come in from Centro first and the Morro last; the deputy count adds the interior after the city", () => {
    expect(computeElection(career("mayor"), "mayor").batches[0]!.unitId).toBe("centro");
    expect(computeElection(career("mayor"), "mayor").batches.at(-1)!.unitId).toBe("morro_esperanca");
    expect(electionUnits("deputy").slice(0, CITY_ORDER.length)).toEqual(CITY_ORDER);
  });

  it("a periphery-strong candidate trails at half the count and climbs back late (a lead change)", () => {
    const s = career("mayor", (x) => {
      // Rooted in the periphery, but with enough of the rest of the city to matter (mayor needs many groups).
      love(x, "periphery", 90);
      love(x, "workers", 70);
      love(x, "religious", 60);
      love(x, "retirees", 40);
      x.neighbourhoods.morro_esperanca!.base = 80;
      x.neighbourhoods.vila_operaria!.base = 60;
      x.campaign!.presence = { morro_esperanca: 90, vila_operaria: 80, centro: 40, sao_bento: 40 };
      x.campaign!.endorsements = ["lurdes", "union"];
    });
    const r = computeElection(s, "mayor");
    const half = r.batches.findIndex((b) => b.cumulativePct >= 50) + 1;
    expect(leads(s, "mayor", half)).not.toBe(PLAYER);
    expect(leads(s, "mayor", r.batches.length)).toBe(PLAYER); // first in the first round, once the hill reports
  });

  it("an elite-strong candidate leads early and sweats at the end", () => {
    const s = career("mayor", (x) => {
      love(x, "business", 90);
      love(x, "retirees", 50);
      x.neighbourhoods.jardim_atlantico!.base = 80;
      x.neighbourhoods.centro!.base = 60;
      x.campaign!.presence = { centro: 80, jardim_atlantico: 80, sao_bento: 40 };
    });
    const trail = playerTrail(s, "mayor");
    expect(leads(s, "mayor", 2)).toBe(PLAYER);
    expect(trail.at(-1)!).toBeLessThan(trail[1]!); // the count gets worse as the periphery reports
  });

  it("scandals and broken promises cost votes; the populist grows on broken promises", () => {
    const clean = computeElection(career("mayor"), "mayor");
    const dirty = computeElection(career("mayor", (x) => (x.hidden.dossier = [{ id: "d", label: "d", threads: 6, turn: 1, exposed: true }])), "mayor");
    expect(dirty.final[PLAYER]!).toBeLessThan(clean.final[PLAYER]!);
    const promised = computeElection(career("mayor", (x) => (x.hidden.expectations = 90)), "mayor");
    expect(promised.final.tiao!).toBeGreaterThan(clean.final.tiao!);
  });

  it("mayor: without a majority, the top two go to a second round", () => {
    const r = computeElection(career("mayor", (x) => love(x, "periphery", 40)), "mayor");
    const valid = Object.values(r.final).reduce((a, b) => a + b, 0);
    const top = Math.max(...Object.values(r.final));
    if (top / valid < BALANCE.election.runoffBelow) {
      expect(r.runoff).toBeDefined();
      expect(r.elected).toEqual([r.runoff!.winner]);
      expect(r.runoff!.candidates).toHaveLength(2);
    } else {
      expect(r.runoff).toBeUndefined();
    }
  });

  it("re-election is won by finishing in the party's top seats, not first", () => {
    const r = computeElection(career("council", (x) => love(x, "students", 30)), "council");
    expect(r.elected).toHaveLength(BALANCE.election.councilSeats);
  });

  it("the narrator gets causes: at least one reason per counted unit when it matters", () => {
    const s = career("mayor", (x) => {
      x.laws.hillside_sanitation = "passed";
      x.neighbourhoods.morro_esperanca!.base = 50;
    });
    const morro = computeElection(s, "mayor").causes.filter((c) => c.unitId === "morro_esperanca");
    expect(morro.length).toBeGreaterThan(0);
  });
});
