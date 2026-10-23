import { describe, expect, it } from "vitest";
import { makeRoundRobin, mayInterrupt } from "./rules";

describe("sound variations", () => {
  it("rotate through every variation, never the same twice in a row", () => {
    const pick = makeRoundRobin();
    const seq = Array.from({ length: 9 }, () => pick("vote_tick", 4));
    expect(seq).toEqual([0, 1, 2, 3, 0, 1, 2, 3, 0]);
    for (let i = 1; i < seq.length; i++) expect(seq[i]).not.toBe(seq[i - 1]);
  });

  it("keep a separate rotation per sound; a single file always plays", () => {
    const pick = makeRoundRobin();
    pick("a", 2);
    expect(pick("b", 2)).toBe(0);
    expect(pick("solo", 1)).toBe(0);
    expect(pick("solo", 1)).toBe(0);
  });
});

describe("one narrator at a time", () => {
  it("more important lines interrupt, the rest are dropped (never queued)", () => {
    expect(mayInterrupt(null, "ballots")).toBe(true);
    expect(mayInterrupt("ballots", "lead_change")).toBe(true);
    expect(mayInterrupt("lead_change", "final")).toBe(true);
    expect(mayInterrupt("lead_change", "ballots")).toBe(false);
    expect(mayInterrupt("close_race", "close_race")).toBe(false);
    expect(mayInterrupt("final", "lead_change")).toBe(false);
  });
});
