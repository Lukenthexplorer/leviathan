import { describe, expect, it } from "vitest";
import type { Frame } from "../../chapters/councilman/broadcast";
import { electionTension } from "./tension";

const frame = (shares: Record<string, number>) => ({ shares }) as Frame;

describe("election-night tension", () => {
  it("rises as the margin tightens, whether leading or chasing", () => {
    const comfortable = electionTension(frame({ player: 45, a: 25, b: 30 }));
    const tight = electionTension(frame({ player: 34, a: 33, b: 33 }));
    const chasing = electionTension(frame({ player: 31, a: 33, b: 36 }));
    expect(tight).toBeGreaterThan(comfortable);
    expect(chasing).toBeGreaterThan(comfortable);
    expect(tight).toBeGreaterThan(0.9);
  });

  it("a hopeless deficit is calm: what matters is the candidate right above", () => {
    expect(electionTension(frame({ player: 5, a: 50, b: 45 }))).toBe(0.1);
  });
});
