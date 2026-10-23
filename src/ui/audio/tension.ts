import { readRef } from "../../core/conditions";
import type { GameState, TurnReport } from "../../core/types";

/**
 * How tense the music should be (0..1). The music is one of the ways hidden
 * variables leak to the player: a journalist digging into you makes the drums
 * creep in long before anything is published. Felt, never shown.
 */
export function musicTension(state: GameState, report: TurnReport | null): number {
  const unpopular = Math.max(0, -readRef(state, "averageOpinion")) / 50;
  const investigated = (state.flags.investigation ?? 0) / 100;
  const scandal = report && state.history.some((h) => h.turn === state.turn && h.text.startsWith("Exposed")) ? 0.6 : 0;
  return Math.min(1, unpopular * 0.5 + investigated * 0.5 + scandal);
}
