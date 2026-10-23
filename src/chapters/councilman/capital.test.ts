import { describe, expect, it } from "vitest";
import { BALANCE } from "../../content/balance";
import { LAWS } from "../../content/councilman/laws";
import { advanceTurn } from "../../core/advanceTurn";
import type { Cause, Decision, GameState } from "../../core/types";
import { capitalIncome, lawCost, lawVoteScore } from "./actions";
import { councilmanChapter as chapter } from "./chapter";

const C = BALANCE.capital;
const L = BALANCE.laws;
const cause: Cause = { kind: "system", id: "t", turn: 1, label: "t" };
const start = (party = "labour") => chapter.createInitialState({ playerName: "Ana", party });
const step = (s: GameState, d: Decision[] = []) => advanceTurn(s, d, chapter).state;

describe("political capital", () => {
  it("is earned every week: the mandate, supporters, and the party's trust", () => {
    const s = start();
    const base = capitalIncome(s);
    expect(base.total).toBe(C.weeklyBase + Math.floor(base.supporters * C.perSupportingGroup));

    s.characters.party_boss!.relation = C.bossTrustAt;
    s.groups.students!.memories.push({ label: "x", impact: 40, turn: 1, cause });
    const better = capitalIncome(s);
    expect(better.bossTrust).toBe(true);
    expect(better.supporters).toBe(base.supporters + 1);
    expect(better.total).toBe(C.weeklyBase + Math.floor(better.supporters * C.perSupportingGroup) + C.bossTrustBonus);
    expect(Number.isInteger(better.total)).toBe(true);
    expect(step(s).player.capital).toBe(s.player.capital + better.total);
  });

  it("proposing a bill costs capital; without enough, you can't", () => {
    const s = start();
    s.player.capital = LAWS.hillside_sanitation.cost - 1;
    expect(() => step(s, [{ kind: "proposeLaw", law: "hillside_sanitation" }])).toThrow("Capital político insuficiente");
  });

  it("lobbying buys votes: a bill short of votes can pass if you burn capital", () => {
    const s = start("liberal");
    s.player.capital = C.max;
    expect(lawVoteScore(s, "student_pass").passes).toBe(false);
    const lobby = Math.ceil((L.passThreshold - lawVoteScore(s, "student_pass").score) / L.lobbyVotesPerLevel);
    expect(lobby).toBeLessThanOrEqual(L.maxLobbyLevel);
    expect(lawVoteScore(s, "student_pass", lobby).passes).toBe(true);

    const after = step(s, [{ kind: "proposeLaw", law: "student_pass", lobby }]);
    expect(after.laws.student_pass).toBe("passed");
    // Paid the bill and the lobbying, earned prestige and the weekly income.
    expect(after.player.capital).toBe(s.player.capital - lawCost("student_pass", lobby) + C.lawPassedPrestige + capitalIncome(after).total);
  });

  it("a defeat in plenary burns capital", () => {
    const s = start("liberal");
    s.player.capital = C.max;
    expect(lawVoteScore(s, "contract_transparency").passes).toBe(false);
    const after = step(s, [{ kind: "proposeLaw", law: "contract_transparency" }]);
    expect(after.laws.contract_transparency).toBe("rejected");
    expect(after.player.capital).toBe(s.player.capital - lawCost("contract_transparency") + C.lawRejectedLoss + capitalIncome(after).total);
  });

  it("can't be hoarded beyond the cap", () => {
    const s = start();
    s.player.capital = C.max;
    expect(step(s).player.capital).toBe(C.max);
  });
});
