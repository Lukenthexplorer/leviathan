import type { ChapterDefinition, EventDef } from "../chapter";
import type { GameState } from "../types";

/**
 * A tiny fake chapter so core tests don't depend on real content.
 * If the Councilman content changes, these tests still test the engine.
 */
export function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    version: 1,
    chapterId: "test",
    turn: 1,
    party: "labour",
    player: { name: "Test", form: "m", funds: 10 },
    groups: {
      workers: { baseline: 10, memories: [] },
      students: { baseline: 0, memories: [] },
    },
    hidden: { integrity: 75, expectations: 0, dossier: [] },
    characters: { journalist: { relation: 0 } },
    neighbourhoods: { centro: { mood: 0, base: 0, markers: [] } },
    laws: { bus_fare: "draft" },
    books: { reading: null, finished: [] },
    queue: [],
    inbox: [],
    history: [],
    firedEvents: [],
    flags: {},
    ending: null,
    ...overrides,
  };
}

export function makeChapter(events: EventDef[] = []): ChapterDefinition {
  return {
    id: "test",
    createInitialState: () => makeState(),
    validateDecisions(_state, decisions) {
      if (decisions.length > 2) throw new Error("Too many actions");
    },
    resolveDecision(_state, d) {
      if (d.kind === "raiseFare") {
        return {
          cause: { kind: "law", id: "bus_fare", label: "Voted to raise bus fares" },
          effects: [
            { type: "law", id: "bus_fare", status: "passed" },
            { type: "opinion", group: "students", delta: -20, label: "Raised bus fares" },
            {
              type: "schedule",
              inTurns: 3,
              label: "Students protest fare hike",
              effects: [{ type: "neighbourhood", id: "centro", mood: -15, addMarker: "protest" }],
            },
          ],
        };
      }
      if (d.kind === "acceptDonation") {
        return {
          cause: { kind: "meeting", id: "donor", label: "Accepted a donation" },
          effects: [
            { type: "funds", delta: 50 },
            { type: "integrity", delta: -10 },
            { type: "dossier", id: "donation", label: "Undeclared donation", threads: 2 },
          ],
        };
      }
      throw new Error(`Unknown decision ${d.kind}`);
    },
    events,
    checkEnding: (s) => (s.hidden.integrity <= 0 ? "arrested" : null),
  };
}
