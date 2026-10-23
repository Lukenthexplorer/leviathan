import { describe, expect, it } from "vitest";
import { advanceTurn } from "./advanceTurn";
import { evaluate, readRef } from "./conditions";
import { applyEffect } from "./effects";
import { groupOpinion, opinionOf } from "./groups";
import { makeChapter, makeState } from "./testing/fixtures";
import type { Cause, Decision } from "./types";

const cause: Cause = { kind: "system", id: "test", turn: 1, label: "test" };

describe("group memory", () => {
  it("bad memories fade slower than good ones", () => {
    const good = { baseline: 0, memories: [{ label: "", impact: 20, turn: 0, cause }] };
    const bad = { baseline: 0, memories: [{ label: "", impact: -20, turn: 0, cause }] };
    expect(groupOpinion(good, 0)).toBe(20);
    expect(groupOpinion(bad, 0)).toBe(-20);
    // Six weeks later the betrayal still hurts more than the favour helps.
    expect(Math.abs(groupOpinion(bad, 6))).toBeGreaterThan(groupOpinion(good, 6));
  });

  it("clamps to -100..100", () => {
    const g = { baseline: 90, memories: [{ label: "", impact: 50, turn: 0, cause }] };
    expect(groupOpinion(g, 0)).toBe(100);
  });
});

describe("conditions", () => {
  const s = makeState({ flags: { posts: 3 } });

  it("reads refs", () => {
    expect(readRef(s, "opinion:workers")).toBe(10);
    expect(readRef(s, "flag:posts")).toBe(3);
    expect(readRef(s, "flag:never_set")).toBe(0);
  });

  it("combines all / any / not", () => {
    expect(evaluate(s, { all: [{ ref: "funds", op: ">=", value: 10 }, { party: "labour" }] })).toBe(true);
    expect(evaluate(s, { any: [{ ref: "funds", op: ">", value: 99 }, { law: "bus_fare", is: "draft" }] })).toBe(true);
    expect(evaluate(s, { not: { bookFinished: "keynes" } })).toBe(true);
  });

  it("throws on refs that point to nothing (catches content typos)", () => {
    expect(() => readRef(s, "relation:nobody")).toThrow();
  });
});

describe("effects", () => {
  it("clamps hidden variables", () => {
    const s = makeState();
    applyEffect(s, { type: "integrity", delta: -500 }, cause);
    expect(s.hidden.integrity).toBe(0);
  });

  it("stores the cause in group memory", () => {
    const s = makeState();
    applyEffect(s, { type: "opinion", group: "students", delta: -5, label: "x" }, cause);
    expect(s.groups.students!.memories[0]!.cause).toEqual(cause);
  });
});

describe("advanceTurn", () => {
  const chapter = makeChapter();

  it("is pure: the input state is never modified", () => {
    const s = makeState();
    const snapshot = JSON.stringify(s);
    advanceTurn(s, [{ kind: "raiseFare" }], chapter);
    expect(JSON.stringify(s)).toBe(snapshot);
  });

  it("is deterministic: same input, same output", () => {
    const a = advanceTurn(makeState(), [{ kind: "acceptDonation" }], chapter);
    const b = advanceTurn(makeState(), [{ kind: "acceptDonation" }], chapter);
    expect(a).toEqual(b);
  });

  it("applies decisions, advances the week and reports opinion changes", () => {
    const { state, report } = advanceTurn(makeState(), [{ kind: "raiseFare" }], chapter);
    expect(state.turn).toBe(2);
    expect(state.laws.bus_fare).toBe("passed");
    expect(report.opinionChanges.students!.before).toBe(0);
    expect(report.opinionChanges.students!.after).toBeLessThan(0);
    expect(state.history[0]!.text).toBe("Voted to raise bus fares");
  });

  it("delayed consequences fire N turns later, keeping the original cause", () => {
    let s = advanceTurn(makeState(), [{ kind: "raiseFare" }], chapter).state; // decided in week 1
    expect(s.neighbourhoods.centro!.markers).toEqual([]);
    s = advanceTurn(s, [], chapter).state; // week 3
    const r = advanceTurn(s, [], chapter); // week 4: fires
    expect(r.state.neighbourhoods.centro!.markers).toContain("protest");
    expect(r.report.consequences).toEqual([
      { label: "Students protest fare hike", cause: { kind: "law", id: "bus_fare", turn: 1, label: "Voted to raise bus fares" } },
    ]);
    expect(r.state.queue).toEqual([]);
  });

  it("state survives a JSON round trip (save/load safe)", () => {
    const { state } = advanceTurn(makeState(), [{ kind: "raiseFare" }, { kind: "acceptDonation" }], chapter);
    expect(JSON.parse(JSON.stringify(state))).toEqual(state);
  });

  it("rejects illegal decision sets", () => {
    const tooMany: Decision[] = [{ kind: "raiseFare" }, { kind: "raiseFare" }, { kind: "raiseFare" }];
    expect(() => advanceTurn(makeState(), tooMany, chapter)).toThrow("Too many actions");
  });

  it("checks endings", () => {
    const s = makeState({ hidden: { integrity: 5, expectations: 0, dossier: [] } });
    const r = advanceTurn(s, [{ kind: "acceptDonation" }], chapter);
    expect(r.state.ending).toBe("arrested");
    expect(() => advanceTurn(r.state, [], chapter)).toThrow("already ended");
  });
});

describe("events", () => {
  const journalistEvent = makeChapter([
    {
      id: "journalist_calls",
      trigger: { ref: "dossierThreads", op: ">=", value: 2 },
      item: {
        id: "journalist_calls",
        kind: "phone",
        title: "A journalist is asking questions",
        body: "...",
        choices: [
          { id: "deny", label: "Deny everything", effects: [{ type: "relation", character: "journalist", delta: -10 }] },
          { id: "confess", label: "Come clean", effects: [{ type: "integrity", delta: 5 }], requires: { ref: "integrity", op: ">", value: 90 } },
        ],
      },
    },
  ]);

  it("fire only when their condition holds, and only once", () => {
    let r = advanceTurn(makeState(), [], journalistEvent);
    expect(r.report.newDeskItems).toEqual([]);

    r = advanceTurn(r.state, [{ kind: "acceptDonation" }], journalistEvent);
    expect(r.report.newDeskItems.map((i) => i.id)).toEqual(["journalist_calls"]);

    r = advanceTurn(r.state, [], journalistEvent);
    expect(r.report.newDeskItems).toEqual([]);
    expect(r.state.inbox).toHaveLength(1); // still on the desk, unanswered
  });

  it("choices apply effects, clear the paper, and respect locks", () => {
    let s = advanceTurn(makeState(), [{ kind: "acceptDonation" }], journalistEvent).state;
    expect(() => advanceTurn(s, [{ kind: "choose", itemId: "journalist_calls", choiceId: "confess" }], journalistEvent)).toThrow(
      "locked",
    );
    s = advanceTurn(s, [{ kind: "choose", itemId: "journalist_calls", choiceId: "deny" }], journalistEvent).state;
    expect(s.characters.journalist!.relation).toBe(-10);
    expect(s.inbox).toEqual([]);
    expect(opinionOf(s, "workers")).toBe(10);
  });
});
