import { monthOf } from "./calendar";
import { allOpinions, opinionOf } from "./groups";
import type { Comparison, Condition, GameState, NumRef } from "./types";

/** Resolve a NumRef like "opinion:students" to a number in the current state. */
export function readRef(state: GameState, ref: NumRef): number {
  switch (ref) {
    case "turn":
      return state.turn;
    case "month":
      return monthOf(state.turn);
    case "funds":
      return state.player.funds;
    case "capital":
      return state.player.capital;
    case "integrity":
      return state.hidden.integrity;
    case "expectations":
      return state.hidden.expectations;
    case "dossierThreads":
      return state.hidden.dossier.reduce((s, d) => s + d.threads, 0);
    case "unexposedThreads":
      return state.hidden.dossier.filter((d) => !d.exposed).reduce((s, d) => s + d.threads, 0);
    case "exposedThreads":
      return state.hidden.dossier.filter((d) => d.exposed).reduce((s, d) => s + d.threads, 0);
    case "averageOpinion": {
      const ops = Object.values(allOpinions(state));
      return ops.length ? ops.reduce((a, b) => a + b, 0) / ops.length : 0;
    }
  }

  const [prefix, key = ""] = ref.split(":") as [string, string?];
  switch (prefix) {
    case "opinion":
      return opinionOf(state, key);
    case "relation":
      return requireKey(state.characters, key, ref).relation;
    case "flag":
      return state.flags[key] ?? 0; // unset flags read as 0
    case "mood":
      return requireKey(state.neighbourhoods, key, ref).mood;
    case "base":
      return requireKey(state.neighbourhoods, key, ref).base;
    case "exposed":
      return state.hidden.dossier.some((d) => d.id === key && d.exposed) ? 1 : 0;
  }
  throw new Error(`Unknown ref "${ref}"`);
}

function requireKey<T>(record: Record<string, T>, key: string, ref: string): T {
  const v = record[key];
  if (v === undefined) throw new Error(`Ref "${ref}" points to nothing`);
  return v;
}

function compare(a: number, op: Comparison, b: number): boolean {
  switch (op) {
    case ">":
      return a > b;
    case ">=":
      return a >= b;
    case "<":
      return a < b;
    case "<=":
      return a <= b;
    case "==":
      return a === b;
    case "!=":
      return a !== b;
  }
}

/**
 * Evaluate a condition tree. The `in` checks narrow the union type:
 * TypeScript knows that inside `if ("all" in c)` c is `{ all: Condition[] }`.
 */
export function evaluate(state: GameState, c: Condition): boolean {
  if ("all" in c) return c.all.every((x) => evaluate(state, x));
  if ("any" in c) return c.any.some((x) => evaluate(state, x));
  if ("not" in c) return !evaluate(state, c.not);
  if ("ref" in c) return compare(readRef(state, c.ref), c.op, c.value);
  if ("law" in c) return state.laws[c.law] === c.is;
  if ("bookFinished" in c) return state.books.finished.includes(c.bookFinished);
  if ("party" in c) return state.party === c.party;
  const never: never = c; // compile error if a new Condition kind isn't handled
  throw new Error(`Unhandled condition ${JSON.stringify(never)}`);
}
