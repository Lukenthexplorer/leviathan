import { describe, expect, it } from "vitest";
import { BALANCE } from "../../content/balance";
import { EVENTS } from "../../content/councilman/events";
import { LAWS } from "../../content/councilman/laws";
import { MEETINGS } from "../../content/councilman/meetings";
import type { LawDef } from "../../content/types";
import { advanceTurn } from "../../core/advanceTurn";
import { fillTemplate } from "../../core/text";
import type { Decision, GameState } from "../../core/types";
import { councilmanChapter as chapter } from "./chapter";
import { badConditions, badEffects, badTemplates } from "./testing/lint";

const start = () => chapter.createInitialState({ playerName: "Ana Lima", party: "labour", form: "f" });
const step = (s: GameState, d: Decision[] = []) => advanceTurn(s, d, chapter).state;
function wait(s: GameState, weeks: number) {
  for (let i = 0; i < weeks; i++) s = step(s);
  return s;
}
const paper = (s: GameState, id: string) => s.inbox.find((i) => i.id === id);

describe("content lint: events and newspapers", () => {
  it("every event references real things and uses valid templates", () => {
    expect(new Set(EVENTS.map((e) => e.id)).size).toBe(EVENTS.length);
    for (const ev of EVENTS) {
      const problems = [
        ...badConditions(ev.trigger),
        ...badEffects(ev.onFire ?? []),
        ...badTemplates(ev.item.title + ev.item.body),
        ...(ev.item.choices ?? []).flatMap((c) => [...badEffects(c.effects), ...badConditions(c.requires)]),
        ...(ev.variants ?? []).flatMap((v) => [...badConditions(v.when), ...badTemplates((v.title ?? "") + (v.body ?? ""))]),
      ];
      expect(problems, ev.id).toEqual([]);
    }
  });

  it("law follow-up newspapers use valid templates", () => {
    for (const [id, law] of Object.entries(LAWS) as [string, LawDef][]) {
      expect(badEffects((law.followUps ?? []).flatMap((f) => f.effects)), id).toEqual([]);
    }
    for (const m of MEETINGS) expect(badConditions(m.when), m.id).toEqual([]);
  });
});

describe("templates", () => {
  it("name the player and look back at their history", () => {
    let s = step(start(), [{ kind: "proposeLaw", law: "night_safety_patrols" }]);
    expect(fillTemplate(s, "{{player}} voted in {{date:night_safety_patrols}}")).toBe("Ana Lima voted in janeiro de 1989");
    expect(fillTemplate(s, "{{what:night_safety_patrols}}")).toBe("Propôs o projeto Ronda Noturna");
    s = wait(s, 1);
    // The patrols hurt students: that is now their worst memory.
    expect(fillTemplate(s, "{{worst:students}}")).toBe("propôs o projeto Ronda Noturna (janeiro de 1989)");
  });

  it("use the form of address the player chose, never assuming one", () => {
    const text = "{{g:O vereador/A vereadora}} {{player}} foi eleit{{g:o/a}}";
    expect(fillTemplate(start(), text)).toBe("A vereadora Ana Lima foi eleita");
    const him = chapter.createInitialState({ playerName: "Rui", party: "labour", form: "m" });
    expect(fillTemplate(him, text)).toBe("O vereador Rui foi eleito");
  });

  it("fall back gracefully when there is no history", () => {
    expect(fillTemplate(start(), "{{worst:students}} / {{date:bus_fare_freeze}}")).toBe("anos de abandono / os últimos meses");
  });
});

describe("tone: hidden morality shows in how people treat you", () => {
  it("the journalist is curious about a clean councillor, suspicious of a dirty one", () => {
    const clean = wait(start(), 2);
    expect(paper(clean, "journalist_profile")!.expression).toBe("neutral");

    const dirty = start();
    dirty.hidden.dossier.push({ id: "x", label: "Cash", threads: 2, turn: 1, exposed: false });
    const s = wait(dirty, 2);
    expect(paper(s, "journalist_profile")!.expression).toBe("suspicious");
    expect(paper(s, "journalist_profile")!.body).toContain("Dinheiro de empreiteira");
  });

  it("the mentor warms up as integrity drops", () => {
    const honest = wait(start(), 3);
    const corrupt = start();
    corrupt.hidden.integrity = 40;
    const s = wait(corrupt, 3);
    expect(paper(honest, "mentor_checkin")!.expression).toBe("neutral");
    expect(paper(s, "mentor_checkin")!.expression).toBe("pleased");
    expect(paper(s, "mentor_checkin")!.body).toContain("Teixeira");
  });
});

describe("crises always explain their cause", () => {
  it("students march, and the newspaper names the decision that angered them", () => {
    let s = start();
    s.groups.students!.memories.push({
      label: "Raised bus fares",
      impact: -40,
      turn: 1,
      cause: { kind: "law", id: "bus_fare_hike", turn: 1, label: "Raised bus fares" },
    });
    s = step(s);
    const news = paper(s, "crisis_students")!;
    expect(news.kind).toBe("newspaper");
    expect(news.body).toContain("raised bus fares (janeiro de 1989)");
    expect(news.body).toContain("Ana Lima");
    expect(s.neighbourhoods.cidade_universitaria!.markers).toContain("protest");
  });

  it("a law's delayed consequence arrives with a newspaper dated to the vote", () => {
    let s = step(start(), [{ kind: "proposeLaw", law: "bus_fare_freeze" }]);
    s = wait(s, 6);
    expect(paper(s, "news_night_buses")!.body).toContain("aprovado em janeiro de 1989");
  });
});

describe("the press", () => {
  const dirty = () => {
    const s = start();
    s.hidden.dossier.push({ id: "cash", label: "Undeclared cash from a contractor", threads: 3, turn: 1, exposed: false });
    return s;
  };

  it("an exposé is published as a newspaper saying when it happened", () => {
    let s = dirty();
    for (let i = 0; i < 30 && !s.hidden.dossier[0]!.exposed; i++) s = step(s);
    const news = paper(s, "scandal_cash")!;
    expect(news.title).toBe("EXCLUSIVO: UNDECLARED CASH FROM A CONTRACTOR");
    expect(news.body).toContain("em janeiro de 1989, a vereadora Ana Lima");
  });

  it("confessing exposes everything, softens the blow, and restores some integrity", () => {
    const s0 = dirty();
    const s1 = step(s0, []);
    s1.flags.confess = 1;
    const s2 = step(s1);
    expect(s2.hidden.dossier.every((d) => d.exposed)).toBe(true);
    expect(s2.hidden.integrity).toBeGreaterThan(s1.hidden.integrity);
    expect(paper(s2, "news_confession")!.title).toBe("VEREADORA ANA LIMA CONFESSA");
    // Half the damage a normal scandal would do.
    const hit = s2.groups.workers!.memories.find((m) => m.label === "Confessou irregularidades")!;
    const I = BALANCE.investigation;
    expect(hit.impact).toBe(3 * I.scandalOpinionPerThread * I.confessionDamageFactor);
  });
});
