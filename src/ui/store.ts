import { create } from "zustand";
import { chapterFor } from "../chapters";
import { advanceTurn } from "../core/advanceTurn";
import { isDeskAnswer, type Decision, type GameState, type TurnReport } from "../core/types";
import { clearSave, loadGame, saveGame } from "../persistence/save";

/**
 * The UI's only bridge to the simulation. It holds:
 *  - the current GameState (never edited here, only replaced by advanceTurn)
 *  - the decisions the player has queued for this week
 *  - the last turn report, so the desk can animate what changed
 *
 * Zustand gives components a hook (useGame) that re-renders them only when the
 * slice of the store they read changes.
 */

export type Screen = "title" | "party" | "desk" | "election" | "ending";

interface GameStore {
  screen: Screen;
  state: GameState | null;
  pending: Decision[];
  report: TurnReport | null;
  /** Short message shown when an action is refused ("Só uma aparição na mídia por semana"). */
  notice: string | null;
  /** When the game was last autosaved (drives the little "salvo" indicator). */
  savedAt: number | null;
  /** Dev test scenarios turn autosave off, so they never overwrite the real career. */
  persist: boolean;

  goto(screen: Screen): void;
  newGame(party: string, playerName: string, form?: "m" | "f"): void;
  /** Load the autosave. Returns false if there is none (or it's unreadable). */
  continueGame(): boolean;
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
  savedAt: null,
  persist: true,

  goto: (screen) => set({ screen }),

  newGame(party, playerName, form = "m") {
    const state = chapterFor("councilman").createInitialState({ party, playerName, form });
    const persist = get().persist;
    set({ state, pending: [], report: null, notice: null, screen: "desk", savedAt: persist && saveGame(state) ? Date.now() : null });
  },

  continueGame() {
    const state = loadGame();
    if (!state) return false;
    set({ state, pending: [], report: null, notice: null, screen: state.ending ? "ending" : "desk", savedAt: null });
    return true;
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
    // Autosave every week. A finished career is cleared: "Continue" never reopens an ending.
    let savedAt: number | null = null;
    if (get().persist) {
      if (next.ending) clearSave();
      else if (saveGame(next)) savedAt = Date.now();
    }
    // An election result means election night first; any other ending goes straight to the newspaper.
    const screen = next.election ? "election" : next.ending ? "ending" : "desk";
    set({ state: next, pending: [], report, screen, savedAt });
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
