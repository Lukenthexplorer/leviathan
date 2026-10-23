import { describe, expect, it } from "vitest";
import { councilmanChapter as chapter } from "../chapters/councilman/chapter";
import { BALANCE } from "../content/balance";
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

  it("chains migrations step by step, and refuses a version with no path", () => {
    const storage = fakeStorage();
    const { capital: _c, ...noCapital } = midGame().player;
    const v0 = { ...midGame(), version: 0, player: noCapital };
    storage.setItem("leviathan.save", JSON.stringify({ version: 0, savedAt: "", state: v0 }));
    expect(loadGame(storage)).toBeNull(); // no 0 -> 1 migration: refuse rather than guess

    MIGRATIONS[0] = (st) => ({ ...st, flags: { ...st.flags, migrated_from_0: 1 } });
    try {
      const loaded = loadGame(storage)!;
      expect(loaded.flags.migrated_from_0).toBe(1); // 0 -> 1 ran
      expect(loaded.player.capital).toBe(BALANCE.capital.start); // then 1 -> 2 ran
    } finally {
      delete MIGRATIONS[0];
    }
  });

  it("v1 saves (before political capital) are upgraded, not lost", () => {
    const storage = fakeStorage();
    const v2 = midGame();
    const { capital: _dropped, ...oldPlayer } = v2.player;
    const v1 = { ...v2, version: 1, player: oldPlayer };
    storage.setItem("leviathan.save", JSON.stringify({ version: 1, savedAt: "", state: v1 }));
    const loaded = loadGame(storage)!;
    expect(loaded.player.capital).toBe(BALANCE.capital.start);
    expect(loaded.player.funds).toBe(v2.player.funds);
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
