import { describe, expect, it } from "vitest";
import { BALANCE } from "../content/balance";
import { applyEffects } from "./effects";
import { expectationsPressure, investigationSpeed, investigationStep } from "./hidden";
import { makeState } from "./testing/fixtures";
import type { Cause, GameState } from "./types";

const cause: Cause = { kind: "system", id: "t", turn: 1, label: "t" };
const I = BALANCE.investigation;

function withDossier(threads: number, extra: Partial<GameState> = {}): GameState {
  return makeState({
    hidden: { integrity: 75, expectations: 0, dossier: [{ id: "d1", label: "Dirty money", threads, turn: 1, exposed: false }] },
    ...extra,
  });
}

describe("expectations", () => {
  it("below tolerance: promises just fade, nobody is angry", () => {
    const effects = expectationsPressure(makeState({ hidden: { integrity: 75, expectations: 20, dossier: [] } }));
    expect(effects.some((e) => e.type === "opinion")).toBe(false);
  });

  it("above tolerance: every group loses opinion, proportional to the excess", () => {
    const s = makeState({ hidden: { integrity: 75, expectations: 70, dossier: [] } });
    const hits = expectationsPressure(s).filter((e) => e.type === "opinion");
    expect(hits).toHaveLength(Object.keys(s.groups).length);
    expect(hits[0]).toMatchObject({ delta: -(70 - BALANCE.expectations.tolerance) * BALANCE.expectations.disappointmentPerPoint });
  });
});

describe("investigation", () => {
  it("a clean, honest player is never investigated", () => {
    expect(investigationSpeed(makeState(), "journalist")).toBe(0);
    expect(investigationStep(makeState(), "journalist", "journalist")).toEqual([]);
  });

  it("more threads = faster; a hostile journalist digs harder", () => {
    const slow = investigationSpeed(withDossier(1), "journalist");
    const fast = investigationSpeed(withDossier(3), "journalist");
    const hostile = investigationSpeed(withDossier(3, { characters: { journalist: { relation: -50 } } }), "journalist");
    expect(fast).toBeGreaterThan(slow);
    expect(hostile).toBeGreaterThan(fast);
  });

  it("low integrity raises suspicion even without evidence", () => {
    const s = makeState({ hidden: { integrity: 20, expectations: 0, dossier: [] } });
    expect(investigationSpeed(s, "journalist")).toBeGreaterThan(0);
  });

  it("exposes the worst entry once progress reaches the threshold", () => {
    const s = withDossier(3, { flags: { investigation: I.exposeAt - 1 } });
    applyEffects(s, investigationStep(s, "journalist", "journalist"), cause);
    expect(s.hidden.dossier[0]!.exposed).toBe(true);
    expect(s.flags.investigation).toBe(0);
    expect(s.flags.scandals).toBe(1);
    expect(s.groups.workers!.memories[0]!.label).toBe("Escândalo: Dirty money");
  });
});
