import { applyEffects } from "./effects";
import type { GameState, ScheduledEffect } from "./types";

/**
 * Fire every scheduled effect that is due. Effects keep their ORIGINAL cause,
 * so a flood in week 30 still points back to the drainage vote in week 12.
 * Returns what fired so the UI and newspapers can report it.
 */
export function fireDueEffects(state: GameState): ScheduledEffect[] {
  const due = state.queue.filter((s) => s.fireOnTurn <= state.turn);
  state.queue = state.queue.filter((s) => s.fireOnTurn > state.turn);
  for (const s of due) applyEffects(state, s.effects, s.cause);
  return due;
}
