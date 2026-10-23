import { describe, expect, it } from "vitest";
import { BALANCE } from "../../content/balance";
import { SCHEMES } from "../../content/councilman/schemes";
import type { SchemeDef } from "../../content/types";
import { advanceTurn } from "../../core/advanceTurn";
import type { Decision, GameState } from "../../core/types";
import { schemeThreads, type SchemePicks } from "./actions";
import { councilmanChapter as chapter } from "./chapter";
import { badConditions, badEffects } from "./testing/lint";

const step = (s: GameState, d: Decision[] = []) => advanceTurn(s, d, chapter).state;
function wait(s: GameState, weeks: number) {
  for (let i = 0; i < weeks; i++) s = step(s);
  return s;
}

/** A game where the player just took Teixeira's cash: the plan is on the desk. */
function withPlanOnDesk(bossRelation = 15): GameState {
  let s = chapter.createInitialState({ playerName: "Ana", party: "labour" });
  s.characters.party_boss!.relation = bossRelation;
  s = step(s, [{ kind: "meeting", with: "donor" }]);
  const offer = s.inbox.find((i) => i.from === "donor" && i.choices)!;
  return step(s, [{ kind: "choose", itemId: offer.id, choiceId: "cash" }]);
}
const plan = (picks: SchemePicks | null): Decision => ({ kind: "scheme", itemId: "plan_teixeira_donation", scheme: "teixeira_donation", picks });
const def: SchemeDef = SCHEMES.teixeira_donation;

describe("content lint: schemes", () => {
  it("every option references real things", () => {
    for (const slot of def.slots) {
      for (const o of slot.options) {
        expect([...badEffects(o.effects ?? []), ...badConditions(o.requires)], `${slot.id}.${o.id}`).toEqual([]);
      }
    }
  });
});

describe("conspiracy: hiding Teixeira's donation", () => {
  it("the plan must be answered; it can't be filed away", () => {
    const s = withPlanOnDesk();
    expect(() => step(s, [{ kind: "dismiss", itemId: "plan_teixeira_donation" }])).toThrow("needs an answer");
  });

  it("an incomplete plan is refused", () => {
    expect(() => step(withPlanOnDesk(), [plan({ intermediary: "doleiro" })])).toThrow("precisa de uma resposta");
  });

  it("each weak link adds threads; the dossier entry describes the whole plan", () => {
    const s0 = withPlanOnDesk();
    const picks = { intermediary: "yourself", payment: "invoices", knows: "chief_of_staff" };
    const s = step(s0, [plan(picks)]);
    const entry = s.hidden.dossier.find((d) => d.id === "teixeira_cash")!;
    expect(entry.threads).toBe(3 + 2 + 1);
    expect(entry.label).toBe("Dinheiro não declarado da Teixeira Construções recolhido em mãos, disfarçado de notas frias de consultoria");
    expect(s.player.funds).toBe(s0.player.funds + 40 - 3); // Marta's bonus
    expect(s.inbox.some((i) => i.scheme)).toBe(false);
  });

  it("a careful plan leaves fewer threads than a sloppy one", () => {
    const careful = schemeThreads(def, { intermediary: "doleiro", payment: "cash", knows: "otavio" });
    const sloppy = schemeThreads(def, { intermediary: "brother_in_law", payment: "smurfing", knows: "alone" });
    expect(careful).toBeLessThan(sloppy);
  });

  it("planning doesn't use an agenda slot", () => {
    const three: Decision[] = [
      { kind: "neighbourhood", id: "centro" },
      { kind: "neighbourhood", id: "sao_bento" },
      { kind: "read", book: "keynes" },
    ];
    expect(() => step(withPlanOnDesk(), [...three, plan({ intermediary: "doleiro", payment: "cash", knows: "alone" })])).not.toThrow();
  });

  it("the party's accountant is only an option if the party trusts you", () => {
    const picks = { intermediary: "party_accountant", payment: "cash", knows: "alone" };
    expect(() => step(withPlanOnDesk(-5), [plan(picks)])).toThrow("não é uma opção");
    expect(step(withPlanOnDesk(15), [plan(picks)]).flags.party_knows).toBe(1);
  });

  it("walking away: no money, no dossier, an angry donor", () => {
    const s0 = withPlanOnDesk();
    const s = step(s0, [plan(null)]);
    expect(s.hidden.dossier).toEqual([]);
    expect(s.player.funds).toBe(s0.player.funds);
    expect(s.characters.donor!.relation).toBeLessThan(s0.characters.donor!.relation);
  });
});

describe("weak links break later, by themselves", () => {
  it("the doleiro gets arrested months later, and his notebooks add threads", () => {
    let s = step(withPlanOnDesk(), [plan({ intermediary: "doleiro", payment: "cash", knows: "otavio" })]);
    const before = s.hidden.dossier[0]!.threads;
    s = wait(s, 14);
    expect(s.flags.doleiro_arrested).toBe(1);
    expect(s.inbox.some((i) => i.id === "news_doleiro")).toBe(true);
    // A careful plan (2 threads) keeps the journalist slow: still unexposed, but now more exposed than planned.
    expect(s.hidden.dossier[0]!.exposed).toBe(false);
    expect(s.hidden.dossier[0]!.threads).toBe(before + 3);
  });

  it("if Otávio knows and turns on you, he talks to the journalist", () => {
    let s = step(withPlanOnDesk(), [plan({ intermediary: "doleiro", payment: "cash", knows: "otavio" })]);
    s.characters.mentor!.relation = -30;
    s.flags.investigation = 0;
    s = step(s);
    expect(s.firedEvents).toContain("mentor_leak");
    expect(s.flags.investigation).toBeGreaterThanOrEqual(40);
  });

  it("church laundering, once exposed, hits religious voters extra hard", () => {
    let s = step(withPlanOnDesk(), [plan({ intermediary: "yourself", payment: "church", knows: "alone" })]);
    s.flags.investigation = BALANCE.investigation.exposeAt;
    s = step(s);
    expect(s.hidden.dossier[0]!.exposed).toBe(true);
    expect(s.firedEvents).toContain("church_scandal");
    expect(s.groups.religious!.memories.some((m) => m.label === "Usou um sopão para lavar dinheiro")).toBe(true);
  });
});
