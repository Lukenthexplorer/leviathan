import { describe, expect, it } from "vitest";
import { BALANCE } from "../../content/balance";
import { BOOKS } from "../../content/councilman/books";
import { EVENTS } from "../../content/councilman/events";
import { LAWS, LAW_IDS } from "../../content/councilman/laws";
import { MEETINGS } from "../../content/councilman/meetings";
import type { LawDef } from "../../content/types";
import { advanceTurn } from "../../core/advanceTurn";
import { opinionOf } from "../../core/groups";
import type { Decision, GameState, Hint } from "../../core/types";
import { lawAvailable, lawVisible, revealHint } from "./actions";
import { councilmanChapter as chapter } from "./chapter";

const start = () => {
  const s = chapter.createInitialState({ playerName: "Ana Lima", party: "labour", form: "f" });
  s.player.capital = BALANCE.capital.max;
  return s;
};
const step = (s: GameState, d: Decision[] = []) => advanceTurn(s, d, chapter).state;
const wait = (s: GameState, n: number) => {
  for (let i = 0; i < n; i++) s = step(s);
  return s;
};
const pass = (s: GameState, law: keyof typeof LAWS) => {
  const r = step(s, [{ kind: "proposeLaw", law, lobby: BALANCE.laws.maxLobbyLevel }]);
  expect(r.laws[law], law).toBe("passed");
  return r;
};

describe("content lint: hints and upgrades", () => {
  it("every hint names real books, every upgrade points at a real law", () => {
    const hints: [string, Hint][] = [];
    for (const [id, law] of Object.entries(LAWS) as [string, LawDef][]) {
      if (law.hint) hints.push([id, law.hint]);
      if (law.upgradeOf) expect(LAWS, id).toHaveProperty(law.upgradeOf);
    }
    for (const ev of EVENTS) for (const c of ev.item.choices ?? []) if (c.hint) hints.push([`${ev.id}.${c.id}`, c.hint]);
    for (const m of MEETINGS) for (const c of m.choices) if (c.hint) hints.push([`${m.id}.${c.id}`, c.hint]);
    expect(hints.length).toBeGreaterThan(5);
    for (const [where, h] of hints) for (const b of h.by) expect(BOOKS, where).toHaveProperty(b);
  });
});

describe("books unlock smarter versions and foresight", () => {
  it("the naive version is always there; the upgrade needs the book", () => {
    const s = start();
    expect(lawAvailable(s, "cesta_basica")).toBe(true);
    expect(lawAvailable(s, "public_works_jobs")).toBe(false);
    s.books.finished.push("keynes");
    expect(lawAvailable(s, "public_works_jobs")).toBe(true);
  });

  it("reading the right book reveals what a law will do later", () => {
    const s = start();
    expect(revealHint(s, LAWS.bus_fare_freeze.hint)).toBeNull();
    s.books.finished.push("hayek");
    expect(revealHint(s, LAWS.bus_fare_freeze.hint)).toEqual({
      text: "Analistas preveem: sem compensação, as empresas de ônibus vão cortar as linhas noturnas.",
      book: "O Caminho da Servidão",
    });
  });

  it("the naive basket helps fast, then ends and leaves people worse", () => {
    let s = pass(start(), "cesta_basica");
    const during = opinionOf(s, "periphery");
    s = wait(s, 12);
    expect(s.inbox.some((i) => i.id === "news_cesta_end")).toBe(true);
    expect(opinionOf(s, "periphery")).toBeLessThan(during);
  });
});

describe("tempting projects look like progress", () => {
  it("the overpass pleases business now, and costs the Morro its buses later", () => {
    let s = pass(start(), "beach_overpass");
    expect(s.neighbourhoods.jardim_atlantico!.markers).toContain("construction");
    const morro = s.neighbourhoods.morro_esperanca!.mood;
    s = wait(s, 10);
    expect(s.neighbourhoods.morro_esperanca!.mood).toBeLessThan(morro);
    expect(s.inbox.find((i) => i.id === "news_overpass_cost")!.body).toContain("Teixeira Construções");
  });
});

describe("corrupt offers only reach the compromised", () => {
  it("an honest councillor never sees them", () => {
    const s = wait(start(), 30);
    expect(s.firedEvents).not.toContain("donor_opportunity");
    for (const id of LAW_IDS) if ((LAWS[id] as LawDef).offer) expect(lawVisible(s, id), id).toBe(false);
  });

  it("someone who hid Teixeira's cash gets a letter, and the law appears once accepted", () => {
    let s = start();
    s.flags.hid_donation = 1;
    s = wait(s, 6);
    const letter = s.inbox.find((i) => i.id === "donor_opportunity")!;
    expect(letter.title).toBe("Uma pequena oportunidade");
    expect(lawVisible(s, "emergency_paving")).toBe(false);
    s = step(s, [{ kind: "choose", itemId: letter.id, choiceId: "emergency_paving" }]);
    expect(lawVisible(s, "emergency_paving")).toBe(true);

    const funds = s.player.funds;
    s = pass(s, "emergency_paving");
    expect(s.player.funds).toBe(funds + 20);
    expect(s.flags.income_dirty).toBe(20);
    expect(s.hidden.dossier.map((d) => d.id)).toContain("emergency_paving");
  });

  it("the cleared slope comes down when the rains come, and the paper knows why", () => {
    let s = start();
    s.flags.offered_morro_rezoning = 1;
    s = pass(s, "morro_rezoning"); // week 2 (January): dry season on the coast
    s = wait(s, 6); // slope cleared in February: still dry
    expect(s.firedEvents).not.toContain("morro_landslide");
    s = wait(s, 4); // March: the rains
    expect(s.firedEvents).toContain("morro_landslide");
    expect(s.inbox.find((i) => i.id === "morro_landslide")!.body).toContain("rezoneamento aprovado em janeiro de 1989");
    expect(s.hidden.dossier.find((d) => d.id === "morro_rezoning")!.threads).toBeGreaterThan(3);
  });
});
