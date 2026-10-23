import type { ChapterDefinition } from "./chapter";
import { evaluate } from "./conditions";
import { applyEffects } from "./effects";
import { fireEvents } from "./events";
import { allOpinions, forgetFadedMemories } from "./groups";
import { fireDueEffects } from "./queue";
import { isDeskAnswer, type Cause, type ChapterDecision, type Decision, type GameState, type TurnReport } from "./types";

/**
 * The heart of the game: one week passes.
 *
 * Pure function: the input state is never modified. We deep-copy it with
 * structuredClone and mutate only the copy (the "draft"). Same state + same
 * decisions always gives the same result, which is what makes it testable.
 *
 * Order of a week:
 *   1. answer papers on the desk, then validate and resolve new actions (at the current turn)
 *   2. the calendar moves forward one week
 *   3. delayed consequences that are now due fire
 *   4. weekly chapter rules (reading progress, drift, pressure...)
 *   5. events whose conditions now hold land on the desk
 *   6. faded memories are forgotten, endings are checked
 */
export function advanceTurn(
  prev: GameState,
  decisions: readonly Decision[],
  chapter: ChapterDefinition,
): { state: GameState; report: TurnReport } {
  if (prev.ending) throw new Error(`Game already ended: ${prev.ending}`);
  if (prev.chapterId !== chapter.id) throw new Error(`State is for chapter "${prev.chapterId}", not "${chapter.id}"`);

  const state = structuredClone(prev);
  const before = allOpinions(prev);

  // 1. decisions: answer the papers on the desk first, then take new actions
  for (const d of decisions) {
    if (d.kind === "choose") resolveChoice(state, d.itemId as string, d.choiceId as string);
    if (d.kind === "dismiss") dismiss(state, d.itemId as string);
  }

  const chapterDecisions = decisions.filter((d): d is ChapterDecision => !isDeskAnswer(d));
  chapter.validateDecisions?.(state, chapterDecisions);

  for (const d of chapterDecisions) {
    const { effects, cause } = chapter.resolveDecision(state, d);
    const fullCause: Cause = { ...cause, turn: state.turn };
    state.history.push({ turn: state.turn, cause: fullCause, text: cause.label });
    applyEffects(state, effects, fullCause);
  }

  // 2. time passes
  state.turn += 1;

  // 3. delayed consequences
  const fired = fireDueEffects(state);

  // 4. weekly rules
  const weekly = chapter.weeklyRules?.(state) ?? [];
  applyEffects(state, weekly, { kind: "system", id: "weekly", turn: state.turn, label: "Weekly rules" });

  // 5. events
  const newDeskItems = fireEvents(state, chapter.events);

  // 6. cleanup and endings
  forgetFadedMemories(state);
  state.ending = chapter.checkEnding(state);

  const after = allOpinions(state);
  const opinionChanges = Object.fromEntries(
    Object.keys(after).map((id) => [id, { before: before[id] ?? 0, after: after[id] ?? 0 }]),
  );

  return {
    state,
    report: {
      fromTurn: prev.turn,
      toTurn: state.turn,
      opinionChanges,
      consequences: fired.map((f) => ({ label: f.label, cause: f.cause })),
      newDeskItems,
      ending: state.ending,
    },
  };
}

/** Answer a paper on the desk: apply the chosen option and clear the paper. */
function resolveChoice(state: GameState, itemId: string, choiceId: string): void {
  const item = state.inbox.find((i) => i.id === itemId);
  if (!item) throw new Error(`No desk item "${itemId}"`);
  const choice = item.choices?.find((c) => c.id === choiceId);
  if (!choice) throw new Error(`Desk item "${itemId}" has no choice "${choiceId}"`);
  if (choice.requires && !evaluate(state, choice.requires)) {
    throw new Error(`Choice "${choiceId}" is locked`);
  }
  const cause: Cause = { kind: "event", id: item.id, turn: state.turn, label: `${item.title}: ${choice.label}` };
  state.history.push({ turn: state.turn, cause, text: cause.label });
  applyEffects(state, choice.effects, cause);
  state.inbox = state.inbox.filter((i) => i.id !== itemId);
}

/** File away a paper that needs no answer (a report, a book's lesson...). */
function dismiss(state: GameState, itemId: string): void {
  const item = state.inbox.find((i) => i.id === itemId);
  if (!item) throw new Error(`No desk item "${itemId}"`);
  if (item.choices?.length) throw new Error(`"${itemId}" needs an answer, it can't just be filed`);
  state.inbox = state.inbox.filter((i) => i.id !== itemId);
}
