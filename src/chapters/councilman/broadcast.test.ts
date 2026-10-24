import { describe, expect, it } from "vitest";
import { BALANCE } from "../../content/balance";
import type { Cause, GameState, PathId } from "../../core/types";
import { buildBroadcast } from "./broadcast";
import { councilmanChapter as chapter } from "./chapter";
import { PLAYER, computeElection } from "./election";

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

  it("narration: the lead change line on every lead change, ballots only every few batches", () => {
    const s = career("mayor", periphery);
    const frames = buildBroadcast(s, computeElection(s, "mayor")).rounds[0]!.frames;
    for (const f of frames) if (f.leadChange) expect(f.narration).toBe("lead_change");
    const ballots = frames.filter((f) => f.narration === "ballots").length;
    expect(ballots).toBeGreaterThan(0);
    expect(ballots).toBeLessThanOrEqual(Math.ceil(frames.length / BALANCE.election.ballotsNarrationEvery));
    expect(frames.filter((f) => f.narration === "close_race").length).toBeLessThanOrEqual(1);
  });

  it("a batch that slashes the leader's margin without flipping it outrages the narrator", () => {
    const s = career("mayor", periphery);
    const frames = buildBroadcast(s, computeElection(s, "mayor")).rounds[0]!.frames;
    frames.forEach((f, i) => {
      if (f.narration !== "outraged") return;
      const prev = frames[i - 1]!;
      const gap = (fr: typeof f) => {
        const v = Object.values(fr.shares).sort((a, b) => b - a);
        return v[0]! - v[1]!;
      };
      expect(f.leadChange).toBe(false);
      expect(gap(prev) - gap(f)).toBeGreaterThan(BALANCE.election.outragedSwing - 0.2);
    });
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
