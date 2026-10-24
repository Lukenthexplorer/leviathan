import { describe, expect, it } from "vitest";
import { BALANCE } from "../../content/balance";
import type { Cause, ElectionResult, GameState, PathId } from "../../core/types";
import { buildBroadcast, narrationCues } from "./broadcast";
import { councilmanChapter as chapter } from "./chapter";
import { CITY_ORDER, PLAYER, computeElection } from "./election";

const cause: Cause = { kind: "system", id: "t", turn: 1, label: "t" };
function career(path: PathId, setup: (s: GameState) => void = () => {}): GameState {
  const s = chapter.createInitialState({ playerName: "Ana Lima", party: "labour", form: "f" });
  s.turn = BALANCE.campaign.endWeek + 1;
  s.campaign = { path, presence: {}, cabos: {}, endorsements: [], attacks: [], opponentDamage: {}, polls: [] };
  setup(s);
  return s;
}
const periphery = (x: GameState) => {
  for (const [g, v] of [["periphery", 90], ["workers", 70], ["religious", 60], ["retirees", 40]] as const) x.groups[g]!.memories.push({ label: "x", impact: v, turn: x.turn, cause });
  x.neighbourhoods.morro_esperanca!.base = 80;
  x.neighbourhoods.vila_operaria!.base = 60;
  x.laws.hillside_sanitation = "passed";
  x.campaign!.presence = { morro_esperanca: 90, vila_operaria: 80, centro: 40, sao_bento: 40 };
  x.campaign!.endorsements = ["lurdes", "union"];
};

describe("election night broadcast", () => {
  it("one frame per batch; the last frame's totals are the final count", () => {
    for (const path of ["council", "mayor", "deputy"] as PathId[]) {
      const s = career(path);
      const r = computeElection(s, path);
      const b = buildBroadcast(s, r);
      expect(b.rounds[0]!.frames).toHaveLength(r.batches.length);
      expect(b.rounds[0]!.frames.at(-1)!.totals).toEqual(r.final);
      expect(b.rounds[0]!.frames.at(-1)!.pct).toBe(100);
    }
  });

  it("flags lead changes, and the anchor shouts VIRADA", () => {
    const s = career("mayor", periphery);
    const frames = buildBroadcast(s, computeElection(s, "mayor")).rounds[0]!.frames;
    const changes = frames.filter((f) => f.leadChange);
    expect(changes.length).toBeGreaterThan(0);
    expect(changes[0]!.line).toContain("VIRADA!");
  });

  it("each neighbourhood's first urns come with the reason that decided it there", () => {
    const s = career("mayor", periphery);
    const lines = buildBroadcast(s, computeElection(s, "mayor")).rounds[0]!.frames.map((f) => f.line);
    expect(lines.some((l) => l.includes("Urnas de Morro da Esperança chegando"))).toBe(true);
    expect(lines.join(" ")).not.toContain("{{player}}");
  });

  it("slows down when it's close and near the end", () => {
    const frames = buildBroadcast(career("mayor"), computeElection(career("mayor"), "mayor")).rounds[0]!.frames;
    for (const f of frames) if (f.pct >= 80 || f.close) expect(f.duration).toBeGreaterThan(2);
    expect(frames[0]!.duration).toBeLessThanOrEqual(frames.at(-1)!.duration);
  });

  it("a mayor race without a majority gets a second round on air", () => {
    const s = career("mayor", periphery);
    const r = computeElection(s, "mayor");
    const b = buildBroadcast(s, r);
    expect(b.rounds).toHaveLength(r.runoff ? 2 : 1);
    if (r.runoff) {
      expect(b.rounds[1]!.candidates).toEqual(r.runoff.candidates);
      expect(b.rounds[1]!.intro).toContain("segundo turno");
    }
    expect(b.playerWon).toBe(r.elected.includes(PLAYER));
  });
});

/** A hand-made count: [player, a, b] votes per batch, in reporting order. Easier to reason about than a campaign. */
function handResult(path: PathId, votes: [number, number, number][]): ElectionResult {
  const ids = [PLAYER, "a", "b"];
  const final: Record<string, number> = { [PLAYER]: 0, a: 0, b: 0 };
  const batches = votes.map((v, i) => {
    ids.forEach((id, k) => (final[id]! += v[k]!));
    const unitId = CITY_ORDER[i % CITY_ORDER.length]!;
    return { unitId, label: unitId, votes: Object.fromEntries(ids.map((id, k) => [id, v[k]!])), nulls: 0, cumulativePct: Math.round(((i + 1) / votes.length) * 1000) / 10 };
  });
  const ranking = [...ids].sort((x, y) => final[y]! - final[x]!);
  return {
    path,
    candidates: [
      { id: PLAYER, name: "Ana Lima", party: "PTP", portrait: "player" },
      { id: "a", name: "Roberto Galvão", party: "PDE", portrait: "candidate_galvao" },
      { id: "b", name: "Tião Barbosa", party: "PRP", portrait: "candidate_tiao" },
    ],
    batches,
    final,
    finalNulls: 0,
    winner: ranking[0]!,
    elected: ranking.slice(0, path === "mayor" ? 1 : 2),
    causes: [],
  };
}

const cues = (result: ElectionResult) =>
  narrationCues(buildBroadcast(career(result.path), result)).map((c) => (c.frame < 0 ? c.situation : `${c.situation}@${c.frame}`));

describe("election-night narration", () => {
  it("plays every situation where it belongs, most important first (a mayor race, worked out by hand)", () => {
    // Shares after each batch (player / a / b):
    //  0: 30/50/20          a leads
    //  1: 45/40/15          the player takes the lead            -> lead_change
    //  2: 43.3/40.8/15.8    margin 2.5 < 3: it gets close         -> close_race (beats "ballots", due now)
    //  3: 43.8/39.4/16.9    opens up again                        -> ballots
    //  4: 37/40.5/22.5      a takes the lead (and a terrible batch for the player: lead change still wins)
    //  5: 42.5/37.1/20.4    the player takes it back              -> lead_change
    //  6: 47.9/33.2/18.9    margin 14.7: not a landslide yet      -> ballots
    //  7: 51.9/30.3/17.8    margin 21.6 past 50% counted          -> landslide (once)
    //  8: 46.7/33.6/19.7    the player gets 5% of this batch      -> outraged
    //  9: the last batch: "última urna", the pause, then          -> ballots; then the call at 100%
    const result = handResult("mayor", [
      [300, 500, 200], [600, 300, 100], [400, 425, 175], [450, 350, 200], [100, 450, 450],
      [700, 200, 100], [800, 100, 100], [800, 100, 100], [50, 600, 350], [500, 300, 200],
    ]);
    expect(cues(result)).toEqual([
      "opening", "lead_change@1", "close_race@2", "ballots@3", "lead_change@4", "lead_change@5",
      "ballots@6", "landslide@7", "outraged@8", "last_ballot@9", "ballots@9", "final@9",
    ]);
  });

  it("a council race barely talks: urnas every 6 batches, never a landslide", () => {
    const runaway = Array.from({ length: 12 }, () => [600, 300, 100] as [number, number, number]);
    expect(cues(handResult("council", runaway))).toEqual(["opening", "ballots@5", "last_ballot@11", "ballots@11", "final@11"]);
    expect(cues(handResult("deputy", runaway))).toEqual(["opening", "ballots@3", "landslide@6", "ballots@7", "last_ballot@11", "ballots@11", "final@11"]);
    expect(cues(handResult("mayor", runaway))).toEqual(["opening", "ballots@2", "ballots@5", "landslide@6", "ballots@8", "last_ballot@11", "ballots@11", "final@11"]);
  });

  it("once the margin gets tight, a council race talks like a mayor race until the end", () => {
    const votes = Array.from({ length: 6 }, () => [600, 300, 100] as [number, number, number]);
    // Batch 6 nearly erases the lead without flipping it (60/30/10 -> 47.4/44.9/7.7): outraged, and the race is close now.
    votes.push([100, 1700, 0], [500, 400, 100], [500, 400, 100], [500, 400, 100], [500, 400, 100], [500, 400, 100]);
    // Council pace would say "urnas" at 5 and 11 only; from batch 6 on it's every 3: 8, 11.
    expect(cues(handResult("council", votes))).toEqual(["opening", "ballots@5", "outraged@6", "ballots@8", "last_ballot@11", "ballots@11", "final@11"]);
  });

  it("with a second round, only the deciding count gets the last-ballot pause", () => {
    const s = career("mayor", periphery);
    const result = computeElection(s, "mayor");
    expect(result.runoff).toBeDefined();
    const all = narrationCues(buildBroadcast(s, result));
    const last = all.filter((c) => c.situation === "last_ballot");
    expect(last).toHaveLength(1);
    expect(last[0]!.round).toBe(1);
    expect(all[0]!.situation).toBe("opening");
    expect(all.at(-1)!.situation).toBe("final");
  });
});
