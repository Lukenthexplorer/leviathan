import type { TextVariant } from "./text";
import type { Cause, ChapterDecision, Condition, DeskItem, Effect, GameState } from "./types";

/**
 * A one-shot event: when `trigger` becomes true, `item` lands on the desk.
 * Never random; the trigger is always a condition on the state.
 */
export interface EventDef {
  id: string;
  trigger: Condition;
  /** Lower fires first when several trigger in the same week. */
  priority?: number;
  /** Effects applied the moment the event fires (before the player answers). */
  onFire?: Effect[];
  item: Omit<DeskItem, "turn">;
  /** Tone variants: same event, different words and face, depending on the state. */
  variants?: TextVariant[];
}

export interface ChapterSetup {
  playerName: string;
  party: string;
}

/**
 * The plug-in point for chapters. The core runs the turn; a chapter supplies
 * its starting state, how its actions translate into effects, its events,
 * per-week rules and its endings. Mayor, Governor... will each implement this.
 */
export interface ChapterDefinition {
  id: string;
  createInitialState(setup: ChapterSetup): GameState;
  /** Translate a player action into effects (pure: reads state, returns data). */
  resolveDecision(state: GameState, decision: ChapterDecision): { effects: Effect[]; cause: Omit<Cause, "turn"> };
  /** Throw if this week's set of decisions is illegal (e.g. too many actions). */
  validateDecisions?(state: GameState, decisions: readonly ChapterDecision[]): void;
  /** Rules that run every week regardless of player input (reading, drift...). */
  weeklyRules?(state: GameState): Effect[];
  events: readonly EventDef[];
  checkEnding(state: GameState): string | null;
}
