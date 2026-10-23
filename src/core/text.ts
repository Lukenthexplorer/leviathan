import { monthYear } from "./calendar";
import { evaluate } from "./conditions";
import { memoryWeight } from "./groups";
import type { Condition, DeskItem, GameState } from "./types";

/**
 * Templates let content refer back to the player's own history, which is how
 * the game "always shows the connection" between a crisis and its cause.
 *
 *   {{player}}            the player's name ({{PLAYER}} for headlines)
 *   {{flag:posts}}        a flag's value
 *   {{date:<causeId>}}    month and year of the FIRST history entry whose cause id starts with <causeId>
 *   {{what:<causeId>}}    that entry's label ("Proposed the Bus Fare Freeze")
 *   {{worst:<group>}}     the memory hurting that group most right now, e.g.
 *                         "the Night Safety Patrols (March 1989)"
 */
export function fillTemplate(state: GameState, text: string): string {
  return text.replace(/\{\{(\w+)(?::([\w-]+))?\}\}/g, (match, key: string, arg = "") => {
    switch (key) {
      case "player":
        return state.player.name;
      case "PLAYER":
        return state.player.name.toUpperCase();
      case "flag":
        return String(state.flags[arg] ?? 0);
      case "date": {
        const h = firstCause(state, arg);
        return h ? monthYear(h.turn) : "recent months";
      }
      case "what": {
        const h = firstCause(state, arg);
        return h ? h.cause.label : "earlier decisions";
      }
      case "worst": {
        const g = state.groups[arg];
        const worst = g?.memories
          .filter((m) => m.impact < 0)
          .sort((a, b) => memoryWeight(a, state.turn) - memoryWeight(b, state.turn))[0];
        return worst ? `${lowerFirst(worst.cause.label)} (${monthYear(worst.cause.turn)})` : "years of neglect";
      }
    }
    return match;
  });
}

/** "Proposed the Night Safety Patrols" -> "proposed the Night Safety Patrols" (keeps proper nouns). */
export function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

function firstCause(state: GameState, idPrefix: string) {
  return state.history.find((h) => h.cause.id.startsWith(idPrefix));
}

export function fillItem<T extends Pick<DeskItem, "title" | "body">>(state: GameState, item: T): T {
  return { ...item, title: fillTemplate(state, item.title), body: fillTemplate(state, item.body) };
}

/** A different wording (and portrait expression) depending on the hidden state. First match wins. */
export interface TextVariant {
  when: Condition;
  title?: string;
  body?: string;
  expression?: DeskItem["expression"];
}

export function pickVariant<T extends Pick<DeskItem, "title" | "body" | "expression">>(
  state: GameState,
  item: T,
  variants: readonly TextVariant[] = [],
): T {
  const v = variants.find((x) => evaluate(state, x.when));
  if (!v) return item;
  return { ...item, title: v.title ?? item.title, body: v.body ?? item.body, expression: v.expression ?? item.expression };
}
