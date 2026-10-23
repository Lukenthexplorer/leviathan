import { describe, expect, it } from "vitest";
import { BALANCE } from "../../content/balance";
import { ENDORSERS } from "../../content/councilman/endorsers";
import { SCHEMES } from "../../content/councilman/schemes";
import { advanceTurn } from "../../core/advanceTurn";
import type { Cause, Decision, GameState, PathId } from "../../core/types";
import { attackMaterial, pathStatus } from "./campaign";
import { councilmanChapter as chapter } from "./chapter";
import { badEffects } from "./testing/lint";

const K = BALANCE.campaign;
const cause: Cause = { kind: "law", id: "bus_fare_freeze", turn: 3, label: "Propôs o projeto Congelamento da Passagem" };
const step = (s: GameState, d: Decision[] = []) => advanceTurn(s, d, chapter).state;

/** A career at a given week, with a quiet desk (no other events in the way). */
function at(turn: number, setup: (s: GameState) => void = () => {}): GameState {
  const s = chapter.createInitialState({ playerName: "Ana Lima", party: "labour", form: "f" });
  s.turn = turn;
  s.inbox = [];
  s.player.funds = 100;
  s.firedEvents.push(...["mentor_checkin", "journalist_profile", "mentor_favour", "boss_fundraiser", "rising_star", "rival_credit", "journalist_ally"]);
  setup(s);
  return s;
}
/** A career already campaigning on a path. */
function campaigning(path: PathId = "council", setup: (s: GameState) => void = () => {}): GameState {
  return at(K.startWeek, (s) => {
    s.flags.path_offered = 1;
    s.campaign = { path, presence: {}, cabos: {}, endorsements: [], attacks: [], opponentDamage: {}, polls: [] };
    setup(s);
  });
}

describe("content lint: vote buying scheme", () => {
  it("every option references real things", () => {
    expect(badEffects([...SCHEMES.vote_buying.effects])).toEqual([]);
    const slots: readonly { options: readonly unknown[] }[] = SCHEMES.vote_buying.slots;
    expect(slots.reduce((n, sl) => n + sl.options.length, 0)).toBe(8);
  });
});

describe("end of term: choosing a path", () => {
  it("week 28: the party says in words which doors look open (never a number)", () => {
    const s = step(at(K.warningWeek - 1));
    const letter = s.inbox.find((i) => i.id === "paths_warning")!;
    expect(letter.body).toContain("Reeleição para a Câmara: Sempre aberta");
    expect(letter.body).not.toMatch(/\d{2}/);
  });

  it("week 32: a decision paper; closed paths show why instead of disappearing", () => {
    const s = step(at(K.decisionWeek - 1, (x) => (x.characters.party_boss!.relation = 0)));
    const paper = s.inbox.find((i) => i.id === "path_decision")!;
    const mayor = paper.choices!.find((c) => c.id === "mayor")!;
    expect(mayor.lockedText).toContain("ainda não confia em você");
    expect(() => step(s, [{ kind: "choose", itemId: paper.id, choiceId: "mayor" }])).toThrow("locked");
    const after = step(s, [{ kind: "choose", itemId: paper.id, choiceId: "council" }]);
    expect(after.campaign?.path).toBe("council");
  });

  it("backing Renata closes the mayor race, and pays off in re-election", () => {
    let s = at(K.decisionWeek - 1, (x) => {
      x.characters.party_boss!.relation = 80;
      x.flags.backed_rival = 1;
    });
    expect(pathStatus(s).find((p) => p.path === "mayor")!.open).toBe(false);
    s = step(s);
    const capital = s.player.capital;
    s = step(s, [{ kind: "choose", itemId: "path_decision", choiceId: "council" }]);
    expect(s.campaign!.endorsements).toContain("renata");
    expect(s.player.capital).toBeGreaterThan(capital + BALANCE.paths.kingmakerCapital - 1);
  });

  it("nobody answered: the party signs you up for re-election", () => {
    let s = step(at(K.decisionWeek - 1));
    s = step(s); // week 33: campaign starts
    expect(s.campaign?.path).toBe("council");
    expect(s.inbox.some((i) => i.id === "auto_council")).toBe(true);
  });

  it("the chapter ends with the vote count, the week after the campaign", () => {
    let s = campaigning();
    while (!s.ending && s.turn < 60) s = step(s);
    expect(s.turn).toBe(K.endWeek + 1);
    expect(s.election).not.toBeNull();
    expect(["reelected", "defeated_council"]).toContain(s.ending);
  });

  it("a poll every campaign week, one entry per candidate", () => {
    let s = campaigning("mayor");
    for (let i = 0; i < 3; i++) s = step(s);
    expect(s.campaign!.polls).toHaveLength(3);
    expect(Object.keys(s.campaign!.polls[0]!.shares).sort()).toEqual(["galvao", "player", "renata", "tiao"]);
  });
});

describe("the campaign", () => {
  it("the Câmara is in recess: no more bills", () => {
    expect(() => step(campaigning(), [{ kind: "proposeLaw", law: "street_lighting" }])).toThrow("recesso");
  });

  it("a rally where nobody knows you is an empty square, and the paper says so", () => {
    const empty = step(campaigning(), [{ kind: "rally", nb: "jardim_atlantico" }]);
    expect(empty.inbox.some((i) => i.title.includes("MAIS CADEIRA QUE GENTE"))).toBe(true);
    const full = step(campaigning("council", (s) => (s.neighbourhoods.jardim_atlantico!.base = 40)), [{ kind: "rally", nb: "jardim_atlantico" }]);
    expect(full.campaign!.presence.jardim_atlantico!).toBeGreaterThan(empty.campaign!.presence.jardim_atlantico ?? 0);
  });

  it("rallies are cheaper at a community centre you renovated", () => {
    const s = campaigning("council", (x) => {
      x.flags.community_center_morro_esperanca = 1;
      x.neighbourhoods.morro_esperanca!.base = 40;
    });
    expect(step(s, [{ kind: "rally", nb: "morro_esperanca" }]).player.funds).toBe(s.player.funds - K.rallyCostAtCentre);
  });

  it("canvassers keep working every week; paid in cash they leave a thread", () => {
    let s = step(campaigning(), [{ kind: "cabos", nb: "vila_operaria", cash: true }]);
    expect(s.hidden.dossier.find((d) => d.id === "cabos_cash")?.threads).toBe(1);
    // Compared with the same campaign without canvassers (attacks cost presence in both).
    const without = step(step(campaigning()));
    s = step(s);
    expect(s.campaign!.presence.vila_operaria!).toBeGreaterThan(without.campaign!.presence.vila_operaria ?? 0);
    s = step(s, [{ kind: "cabos", nb: "centro", cash: true }]);
    expect(s.hidden.dossier.find((d) => d.id === "cabos_cash")?.threads).toBe(2);
  });

  it("endorsements need trust, and come with a promise", () => {
    const cold = campaigning("council", (s) => (s.characters.community_leader!.relation = 0));
    expect(() => step(cold, [{ kind: "endorsement", who: "lurdes" }])).toThrow(ENDORSERS.lurdes.lockedText);
    const warm = campaigning("council", (s) => (s.characters.community_leader!.relation = 30));
    const after = step(warm, [{ kind: "endorsement", who: "lurdes" }]);
    expect(after.campaign!.endorsements).toContain("lurdes");
    expect(after.hidden.expectations).toBeGreaterThan(warm.hidden.expectations);
  });

  it("trips to the interior are for the deputy race, and Porto Ferro notices you're gone", () => {
    expect(() => step(campaigning("council"), [{ kind: "interiorTrip", region: "porto_novo" }])).toThrow("deputado");
    const s = campaigning("deputy", (x) => (x.campaign!.presence.centro = 20));
    const after = step(s, [{ kind: "interiorTrip", region: "porto_novo" }]);
    expect(after.campaign!.presence.porto_novo).toBeGreaterThan(0);
    expect(after.campaign!.presence.centro!).toBeLessThan(20);
  });

  it("vote buying only exists for the compromised, and uses the conspiracy board", () => {
    expect(() => step(campaigning(), [{ kind: "buyVotes", nb: "morro_esperanca" }])).toThrow("Não é uma opção");
    let s = step(campaigning("council", (x) => (x.hidden.integrity = 30)), [{ kind: "buyVotes", nb: "morro_esperanca" }]);
    const plan = s.inbox.find((i) => i.scheme === "vote_buying")!;
    expect(plan.place).toBe("morro_esperanca");
    s = step(s, [{ kind: "scheme", itemId: plan.id, scheme: "vote_buying", picks: { who: "leader", what: "food", knows: "alone" } }]);
    expect(s.campaign!.presence.morro_esperanca!).toBeGreaterThan(K.voteBuyingPresence - 5);
    expect(s.hidden.dossier.find((d) => d.id === "vote_buying_morro_esperanca")!.label).toContain("Compra de votos em Morro da Esperança");
  });

  it("spending far more than you declared makes the journalist start counting", () => {
    const s = campaigning("council", (x) => {
      x.flags.income_clean = 10;
      x.flags.spent_total = 60;
    });
    const after = step(s);
    expect(after.inbox.some((i) => i.id === "spend_noticed")).toBe(true);
  });
});

describe("opponents attack your record", () => {
  it("a published scandal is the first thing they use", () => {
    const s = campaigning("mayor", (x) => {
      x.hidden.dossier.push({ id: "cash", label: "Dinheiro de empreiteira", headline: "O DINHEIRO DA EMPREITEIRA", threads: 3, turn: 5, exposed: true });
    });
    expect(attackMaterial(s).key).toBe("dossier:cash");
  });

  it("then laws that hurt a group, aimed where that group lives", () => {
    const s = campaigning("mayor", (x) => {
      x.groups.periphery!.memories.push({ label: "Ônibus noturnos cortados", impact: -8, turn: 10, cause });
    });
    const m = attackMaterial(s);
    expect(m.key).toBe("law:bus_fare_freeze:periphery");
    expect(m.text).toContain("Congelamento da Passagem");
    expect(m.units).toContain("morro_esperanca");
  });

  it("one attack a week lands on the desk; ignored, it keeps costing presence", () => {
    let s = step(campaigning("mayor", (x) => (x.campaign!.presence.centro = 20)));
    const paper = s.inbox.find((i) => i.kind === "attack")!;
    expect(paper.choices!.map((c) => c.id)).toEqual(["facts", "counter", "ignore"]);
    s = step(s, [{ kind: "choose", itemId: paper.id, choiceId: "ignore" }]);
    expect(s.campaign!.attacks[0]!.status).toBe("ignored");
    expect(s.campaign!.presence.centro!).toBeLessThan(20 - K.attackPressure);
  });

  it("answering with facts works only if your record backs you", () => {
    const weak = step(campaigning("mayor"));
    const weakPaper = weak.inbox.find((i) => i.kind === "attack")!;
    expect(step(weak, [{ kind: "choose", itemId: weakPaper.id, choiceId: "facts" }]).campaign!.attacks[0]!.status).toBe("ignored");

    const strong = step(campaigning("mayor", (x) => (x.flags.laws_passed = 5)));
    const strongPaper = strong.inbox.find((i) => i.kind === "attack")!;
    expect(step(strong, [{ kind: "choose", itemId: strongPaper.id, choiceId: "facts" }]).campaign!.attacks[0]!.status).toBe("answered");
  });

  it("counter-attacking hurts the opponent, and the retirees and the faithful dislike it", () => {
    let s = step(campaigning("mayor"));
    const paper = s.inbox.find((i) => i.kind === "attack")!;
    s = step(s, [{ kind: "choose", itemId: paper.id, choiceId: "counter" }]);
    expect(Object.values(s.campaign!.opponentDamage)[0]).toBe(K.counterOpponentHit);
    expect(s.groups.retirees!.memories.some((m) => m.label === "Baixaria na campanha")).toBe(true);
  });
});
