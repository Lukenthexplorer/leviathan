import { CHAPTERS } from "../chapters";
import { BALANCE } from "../content/balance";
import type { GameState } from "../core/types";

/**
 * Save / load. The whole GameState is plain JSON (no classes, no functions),
 * so a save file is just that object plus a version number.
 *
 * Storage is passed in (defaults to localStorage) so tests can use a fake.
 */

/** Bump when GameState's shape changes, and add a migration below. */
export const SAVE_VERSION = 3;
const KEY = "leviathan.save";

export interface SaveFile {
  version: number;
  savedAt: string;
  state: GameState;
}

/** A short description for the title screen's "Continue" button. */
export interface SaveSummary {
  playerName: string;
  party: string;
  turn: number;
  savedAt: string;
}

/**
 * Migrations upgrade old saves step by step: migrations[1] turns a version-1
 * save into version 2, and so on. A save is never thrown away because the
 * game grew: it is upgraded.
 */
export const MIGRATIONS: Record<number, (state: GameState) => GameState> = {
  // v2 added political capital. Old careers start with the default amount.
  1: (state) => ({ ...state, version: 2, player: { ...state.player, capital: state.player.capital ?? BALANCE.capital.start } }),
  // v3 added the campaign and the election. Saves past the decision week get the decision paper on their next week.
  2: (state) => ({ ...state, version: 3, campaign: state.campaign ?? null, election: state.election ?? null }),
};

type KeyValueStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/** localStorage can be missing (private mode, tests) or throw (quota): never crash the game over a save. */
function defaultStorage(): KeyValueStorage | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

export function saveGame(state: GameState, storage = defaultStorage(), now = new Date()): boolean {
  if (!storage) return false;
  const file: SaveFile = { version: SAVE_VERSION, savedAt: now.toISOString(), state };
  try {
    storage.setItem(KEY, JSON.stringify(file));
    return true;
  } catch {
    return false;
  }
}

/** Returns null for no save, a corrupted save, or one we can't migrate. */
export function loadGame(storage = defaultStorage()): GameState | null {
  const file = readFile(storage);
  if (!file) return null;
  let { state } = file;
  for (let v = file.version; v < SAVE_VERSION; v++) {
    const migrate = MIGRATIONS[v];
    if (!migrate) return null;
    state = migrate(state);
  }
  return state;
}

export function saveSummary(storage = defaultStorage()): SaveSummary | null {
  const file = readFile(storage);
  if (!file) return null;
  return { playerName: file.state.player.name, party: file.state.party, turn: file.state.turn, savedAt: file.savedAt };
}

export function clearSave(storage = defaultStorage()): void {
  try {
    storage?.removeItem(KEY);
  } catch {
    // nothing to do
  }
}

function readFile(storage: KeyValueStorage | null): SaveFile | null {
  try {
    const raw = storage?.getItem(KEY);
    if (!raw) return null;
    const file = JSON.parse(raw) as SaveFile;
    // Minimal sanity check: right shape, a chapter we know, and not from a future version.
    if (typeof file?.version !== "number" || file.version > SAVE_VERSION) return null;
    if (!file.state || !CHAPTERS[file.state.chapterId] || typeof file.state.turn !== "number") return null;
    return file;
  } catch {
    return null; // corrupted JSON
  }
}
