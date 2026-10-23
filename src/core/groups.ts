import { BALANCE } from "../content/balance";
import type { GameState, GroupState, Memory } from "./types";

const { opinion: O } = BALANCE;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** How much of a memory's impact is still felt `age` weeks later. */
export function memoryWeight(memory: Memory, currentTurn: number): number {
  const age = Math.max(0, currentTurn - memory.turn);
  const retention = memory.impact >= 0 ? O.positiveRetention : O.negativeRetention;
  return memory.impact * retention ** age;
}

/**
 * Opinion = baseline + sum of fading memories, clamped to -100..100.
 * Exponential decay: a -20 betrayal is still about -13 six weeks later,
 * while a +20 favour is down to about +8.
 */
export function groupOpinion(group: GroupState, currentTurn: number): number {
  const remembered = group.memories.reduce((sum, m) => sum + memoryWeight(m, currentTurn), 0);
  return Math.round(clamp(group.baseline + remembered, O.min, O.max));
}

export function opinionOf(state: GameState, groupId: string): number {
  const g = state.groups[groupId];
  if (!g) throw new Error(`Unknown group "${groupId}"`);
  return groupOpinion(g, state.turn);
}

export function allOpinions(state: GameState): Record<string, number> {
  return Object.fromEntries(Object.keys(state.groups).map((id) => [id, opinionOf(state, id)]));
}

/** Drop memories too faint to matter. Mutates the draft state. */
export function forgetFadedMemories(state: GameState): void {
  for (const g of Object.values(state.groups)) {
    g.memories = g.memories.filter((m) => Math.abs(memoryWeight(m, state.turn)) >= O.forgetBelow);
  }
}
