import { describe, expect, it } from "vitest";
import { councilmanChapter as chapter } from "../chapters/councilman/chapter";
import { advanceTurn } from "../core/advanceTurn";
import { MIGRATIONS, SAVE_VERSION, clearSave, loadGame, saveGame, saveSummary } from "./save";

/** An in-memory stand-in for localStorage. */
function fakeStorage() {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  };
}

const midGame = () => {
  let s = chapter.createInitialState({ playerName: "Ana Lima", party: "labour", form: "f" });
  s = advanceTurn(s, [{ kind: "proposeLaw", law: "hillside_sanitation" }, { kind: "meeting", with: "donor" }], chapter).state;
  return advanceTurn(s, [], chapter).state;
};

describe("save / load", () => {
  it("round-trips a game exactly, delayed consequences included", () => {
    const storage = fakeStorage();
    const s = midGame();
    expect(saveGame(s, storage)).toBe(true);
    const loaded = loadGame(storage)!;
    expect(loaded).toEqual(s);
    // The loaded game keeps playing identically to the original.
    expect(advanceTurn(loaded, [], chapter)).toEqual(advanceTurn(s, [], chapter));
  });

  it("summarises the save for the title screen", () => {
    const storage = fakeStorage();
    saveGame(midGame(), storage, new Date("2026-10-22T12:00:00Z"));
    expect(saveSummary(storage)).toEqual({ playerName: "Ana Lima", party: "labour", turn: 3, savedAt: "2026-10-22T12:00:00.000Z" });
  });

  it("no save, corrupted save, or unknown chapter all load as nothing (never crash)", () => {
    const storage = fakeStorage();
    expect(loadGame(storage)).toBeNull();
    storage.setItem("leviathan.save", "{not json");
    expect(loadGame(storage)).toBeNull();
    storage.setItem("leviathan.save", JSON.stringify({ version: 1, savedAt: "", state: { chapterId: "presidency", turn: 1 } }));
    expect(loadGame(storage)).toBeNull();
  });

  it("refuses saves from a newer version of the game", () => {
    const storage = fakeStorage();
    storage.setItem("leviathan.save", JSON.stringify({ version: SAVE_VERSION + 1, savedAt: "", state: midGame() }));
    expect(loadGame(storage)).toBeNull();
  });

  it("upgrades old saves through migrations", () => {
    const storage = fakeStorage();
    const old = midGame();
    storage.setItem("leviathan.save", JSON.stringify({ version: SAVE_VERSION - 1, savedAt: "", state: old }));
    expect(loadGame(storage)).toBeNull(); // no migration for that version: refuse rather than guess

    MIGRATIONS[SAVE_VERSION - 1] = (st) => ({ ...st, flags: { ...st.flags, migrated: 1 } });
    try {
      expect(loadGame(storage)!.flags.migrated).toBe(1);
    } finally {
      delete MIGRATIONS[SAVE_VERSION - 1];
    }
  });

  it("works without any storage (private mode) and clears cleanly", () => {
    expect(saveGame(midGame(), null)).toBe(false);
    expect(loadGame(null)).toBeNull();
    const storage = fakeStorage();
    saveGame(midGame(), storage);
    clearSave(storage);
    expect(loadGame(storage)).toBeNull();
  });
});
