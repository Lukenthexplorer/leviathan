import { create } from "zustand";
import { chapterFor } from "../chapters";
import { advanceTurn } from "../core/advanceTurn";
import { isDeskAnswer, type Decision, type GameState, type TurnReport } from "../core/types";

/**
 * The UI's only bridge to the simulation. It holds:
 *  - the current GameState (never edited here, only replaced by advanceTurn)
 *  - the decisions the player has queued for this week
 *  - the last turn report, so the desk can animate what changed
 *
 * Zustand gives components a hook (useGame) that re-renders them only when the
 * slice of the store they read changes.
 */

export type Screen = "title" | "party" | "desk" | "ending";

interface GameStore {
  screen: Screen;
  state: GameState | null;
  pending: Decision[];
  report: TurnReport | null;
  /** Short message shown when an action is refused ("Only one post per week"). */
  notice: string | null;

  goto(screen: Screen): void;
  newGame(party: string, playerName: string): void;
  /** Queue an action for this week. Returns false (and sets `notice`) if the rules refuse it. */
  queue(d: Decision): boolean;
  unqueue(d: Decision): void;
  nextWeek(): TurnReport | null;
  clearReport(): void;
  clearNotice(): void;
}

export const useGame = create<GameStore>((set, get) => ({
  screen: "title",
  state: null,
  pending: [],
  report: null,
  notice: null,

  goto: (screen) => set({ screen }),

  newGame(party, playerName) {
    const state = chapterFor("councilman").createInitialState({ party, playerName });
    set({ state, pending: [], report: null, notice: null, screen: "desk" });
  },

  queue(d) {
    const { state, pending } = get();
    if (!state) return false;
    const next = [...pending.filter((p) => !sameDeskTarget(p, d)), d];
    // Dry run: advanceTurn is pure, so we can simply try the week with this
    // action added and see if the rules accept it. One source of truth for
    // validation, no duplicated checks in the UI.
    try {
      advanceTurn(state, next, chapterFor(state.chapterId));
    } catch (e) {
      set({ notice: (e as Error).message });
      return false;
    }
    set({ pending: next, notice: null });
    return true;
  },

  unqueue(d) {
    set({ pending: get().pending.filter((p) => p !== d), notice: null });
  },

  nextWeek() {
    const { state, pending } = get();
    if (!state) return null;
    const { state: next, report } = advanceTurn(state, pending, chapterFor(state.chapterId));
    set({ state: next, pending: [], report, screen: next.ending ? "ending" : "desk" });
    return report;
  },

  clearReport: () => set({ report: null }),
  clearNotice: () => set({ notice: null }),
}));

/**
 * Anything with an itemId answers a paper on the desk (a choice, filing it,
 * a scheme plan). Answering the same paper twice replaces the earlier answer.
 */
const answers = (d: Decision): d is Decision & { itemId: string } => isDeskAnswer(d) || typeof d.itemId === "string";

function sameDeskTarget(a: Decision, b: Decision): boolean {
  return answers(a) && answers(b) && a.itemId === b.itemId;
}

// ------------------------------------------------------------------ selectors

/** This week's actions (what fills the agenda pad), without desk answers. */
export const agendaOf = (pending: Decision[]) => pending.filter((d) => !answers(d));
export const answerFor = (pending: Decision[], itemId: string) => pending.find((d) => answers(d) && d.itemId === itemId);
