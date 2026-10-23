import { describe, expect, it } from "vitest";
import { BALANCE } from "../../content/balance";
import { BOOKS } from "../../content/councilman/books";
import { CHARACTERS } from "../../content/councilman/characters";
import { GROUPS } from "../../content/councilman/groups";
import { LAWS } from "../../content/councilman/laws";
import { MEETINGS } from "../../content/councilman/meetings";
import { NEIGHBOURHOODS } from "../../content/councilman/neighbourhoods";
import { advanceTurn } from "../../core/advanceTurn";
import { opinionOf } from "../../core/groups";
import type { LawDef } from "../../content/types";
import type { Condition, Decision, Effect, GameState } from "../../core/types";
import { lawAvailable, lawVoteScore, nextMeeting, resolveNeighbourhood } from "./actions";
import { councilmanChapter as chapter } from "./chapter";

const start = (party = "labour") => chapter.createInitialState({ playerName: "Test", party });
const step = (s: GameState, decisions: Decision[] = []) => advanceTurn(s, decisions, chapter);
function wait(s: GameState, weeks: number) {
  for (let i = 0; i < weeks; i++) s = step(s).state;
  return s;
}

// ------------------------------------------------------------------ content lint

/** Walk every effect and condition in the content and check the ids they name exist. */
function collectIds(effects: readonly Effect[], out: string[] = []): string[] {
  for (const e of effects) {
    if (e.type === "opinion" && !(e.group in GROUPS)) out.push(`group:${e.group}`);
    if (e.type === "relation" && !(e.character in CHARACTERS)) out.push(`character:${e.character}`);
    if (e.type === "neighbourhood" && !(e.id in NEIGHBOURHOODS)) out.push(`neighbourhood:${e.id}`);
    if (e.type === "schedule") collectIds(e.effects, out);
  }
  return out;
}
function badBooks(c: Condition | undefined): string[] {
  if (!c) return [];
  if ("all" in c) return c.all.flatMap(badBooks);
  if ("any" in c) return c.any.flatMap(badBooks);
  if ("not" in c) return badBooks(c.not);
  if ("bookFinished" in c && !(c.bookFinished in BOOKS)) return [`book:${c.bookFinished}`];
  return [];
}

describe("content lint", () => {
  it("laws only reference real groups, characters, neighbourhoods and books", () => {
    // Widen to LawDef: we want the general shape here, not each law's literal type.
    for (const [id, law] of Object.entries(LAWS) as [string, LawDef][]) {
      const effects = [...law.onPass, ...(law.followUps ?? []).flatMap((f) => f.effects)];
      expect(collectIds(effects), id).toEqual([]);
      expect(badBooks(law.requires), id).toEqual([]);
    }
  });

  it("meetings only reference real characters, ids are unique, and every character has a fallback", () => {
    expect(new Set(MEETINGS.map((m) => m.id)).size).toBe(MEETINGS.length);
    for (const m of MEETINGS) {
      expect(CHARACTERS, m.id).toHaveProperty(m.with);
      for (const c of m.choices) {
        expect(collectIds(c.effects), `${m.id}.${c.id}`).toEqual([]);
        expect(badBooks(c.requires), `${m.id}.${c.id}`).toEqual([]);
      }
    }
    for (const who of ["donor", "party_boss", "mentor", "community_leader", "rival"]) {
      expect(MEETINGS.some((m) => m.with === who && m.repeatable && !m.when), who).toBe(true);
    }
  });
});

// ------------------------------------------------------------------ laws

describe("laws", () => {
  it("are voted at the end of the week, and follow-ups arrive later with the original cause", () => {
    let s = start(); // labour: sanitation is a favoured topic
    expect(lawVoteScore(s, "hillside_sanitation").passes).toBe(true);

    const r = step(s, [{ kind: "proposeLaw", law: "hillside_sanitation" }]);
    expect(r.state.laws.hillside_sanitation).toBe("passed");
    expect(r.report.consequences[0]!.label).toBe("Sanitation for Morro da Esperança passes");

    s = wait(r.state, 3);
    expect(s.neighbourhoods.morro_esperanca!.markers).not.toContain("construction");
    s = wait(s, 1); // 4 weeks after the vote: works begin
    expect(s.neighbourhoods.morro_esperanca!.markers).toContain("construction");
    const works = s.history.find((h) => h.cause.id === "hillside_sanitation" && h.turn > 1);
    expect(works?.cause.label).toBe("Proposed the Sanitation for Morro da Esperança");
  });

  it("a bill the party dislikes, without allies, is voted down", () => {
    const s = start("liberal"); // liberal opposes wages
    expect(lawVoteScore(s, "bus_fare_freeze").passes).toBe(false);
    const r = step(s, [{ kind: "proposeLaw", law: "bus_fare_freeze" }]);
    expect(r.state.characters.party_boss!.relation).toBeLessThan(s.characters.party_boss!.relation);
    expect(r.state.laws.bus_fare_freeze).toBe("rejected");
  });

  it("corridor deals buy votes", () => {
    const s = start("liberal");
    const before = lawVoteScore(s, "bus_fare_freeze").score;
    s.flags.council_favours = 2;
    expect(lawVoteScore(s, "bus_fare_freeze").score).toBe(before + 2 * BALANCE.laws.councilFavourBonus);
  });

  it("passing laws delivers on promises (lowers expectations)", () => {
    const s = start();
    s.hidden.expectations = 50;
    const r = step(s, [{ kind: "proposeLaw", law: "hillside_sanitation" }]);
    expect(r.state.hidden.expectations).toBeLessThan(50 - LAWS.hillside_sanitation.delivers);
  });
});

// ------------------------------------------------------------------ books

describe("books", () => {
  it("take `weeksToRead` presses of Next week (counting the first), then unlock", () => {
    let s = start();
    expect(lawAvailable(s, "public_works_jobs")).toBe(false);
    expect(() => step(s, [{ kind: "proposeLaw", law: "public_works_jobs" }])).toThrow("cannot be proposed");

    s = step(s, [{ kind: "read", book: "keynes" }]).state;
    s = wait(s, BOOKS.keynes.weeksToRead - 2);
    expect(s.books.finished).not.toContain("keynes");
    s = wait(s, 1);
    expect(s.books.finished).toContain("keynes");
    expect(s.books.reading).toBeNull();
    expect(s.inbox.some((i) => i.id === "book_keynes")).toBe(true);
    expect(lawAvailable(s, "public_works_jobs")).toBe(true);
  });
});

// ------------------------------------------------------------------ neighbourhood work

describe("neighbourhood work", () => {
  const peripheryGain = (st: GameState) => {
    const e = resolveNeighbourhood(st, "morro_esperanca").effects.find((x) => x.type === "opinion" && x.group === "periphery");
    return e?.type === "opinion" ? e.delta : 0;
  };

  it("builds a base and wins over the residents", () => {
    const s = start();
    const after = step(s, [{ kind: "neighbourhood", id: "morro_esperanca" }]).state;
    expect(after.neighbourhoods.morro_esperanca!.base).toBe(BALANCE.neighbourhoodWork.baseGain);
    expect(opinionOf(after, "periphery")).toBeGreaterThan(opinionOf(s, "periphery"));
    expect(after.characters.community_leader!.relation).toBeGreaterThan(s.characters.community_leader!.relation);
  });

  it("roots compound: visits are worth more where you already have a base", () => {
    let s = start();
    const first = peripheryGain(s);
    for (let i = 0; i < 4; i++) s = step(s, [{ kind: "neighbourhood", id: "morro_esperanca" }]).state;
    expect(peripheryGain(s)).toBeGreaterThan(first);
  });
});

// ------------------------------------------------------------------ meetings

describe("meetings", () => {
  it("the donor's first offer, then the favour he calls in after you took the cash", () => {
    let s = start();
    expect(nextMeeting(s, "donor")!.id).toBe("donor_first_offer");

    s = step(s, [{ kind: "meeting", with: "donor" }]).state;
    const paper = s.inbox.find((i) => i.from === "donor")!;
    expect(paper.title).toBe("Lunch with Augusto Teixeira");

    // Can't ask again while his paper is still on the desk...
    expect(() => step(s, [{ kind: "meeting", with: "donor" }])).toThrow("Answer donor");

    // ...but answering it and asking again in the same week is fine.
    s = step(s, [
      { kind: "choose", itemId: paper.id, choiceId: "cash" },
      { kind: "meeting", with: "donor" },
    ]).state;
    expect(s.player.funds).toBe(BALANCE.councilman.startingFunds + 40);
    expect(s.hidden.dossier.map((d) => d.id)).toEqual(["teixeira_cash"]);
    expect(s.inbox.find((i) => i.from === "donor")!.title).toBe("Teixeira calls in a favour");
  });

  it("an honest refusal leads to small talk, not the favour", () => {
    let s = step(start(), [{ kind: "meeting", with: "donor" }]).state;
    const paper = s.inbox.find((i) => i.from === "donor")!;
    s = step(s, [{ kind: "choose", itemId: paper.id, choiceId: "refuse" }]).state;
    expect(nextMeeting(s, "donor")!.id).toBe("donor_smalltalk");
  });

  it("book-gated choices are locked until the book is read", () => {
    let s = step(start(), [{ kind: "meeting", with: "mentor" }]).state;
    const paper = s.inbox.find((i) => i.from === "mentor")!;
    expect(() => step(s, [{ kind: "choose", itemId: paper.id, choiceId: "ask_price" }])).toThrow("locked");
    s.books.finished.push("machiavelli");
    s = step(s, [{ kind: "choose", itemId: paper.id, choiceId: "ask_price" }]).state;
    expect(s.flags.knows_mentor_agenda).toBe(1);
  });
});
