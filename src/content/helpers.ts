import type { Effect } from "../core/types";

/** Shorthands so content files read like design notes, not JSON soup. */

export const opinion = (group: string, delta: number, label: string): Effect => ({ type: "opinion", group, delta, label });
export const relation = (character: string, delta: number): Effect => ({ type: "relation", character, delta });
export const flag = (key: string, add = 1): Effect => ({ type: "flag", key, add });
export const integrity = (delta: number): Effect => ({ type: "integrity", delta });
/** Declared, legal money (or spending). */
export const funds = (delta: number): Effect => ({ type: "funds", delta });
/** Undeclared money: fast, and it leaves trails. */
export const dirtyFunds = (delta: number): Effect => ({ type: "funds", delta, source: "dirty" });
export const expectations = (delta: number): Effect => ({ type: "expectations", delta });
export const log = (text: string): Effect => ({ type: "log", text });

/** A newspaper landing on the desk. Body text may use templates like {{date:law_id}}. */
export const newspaper = (id: string, headline: string, body: string): Effect => ({
  type: "deskItem",
  item: { id, kind: "newspaper", title: headline, body, turn: 0 },
});
