import { BOOKS } from "../../../content/councilman/books";
import { CHARACTERS } from "../../../content/councilman/characters";
import { GROUPS } from "../../../content/councilman/groups";
import { LAWS } from "../../../content/councilman/laws";
import { NEIGHBOURHOODS } from "../../../content/councilman/neighbourhoods";
import type { Condition, Effect } from "../../../core/types";

/** Content lint helpers: return a list of problems (empty = all good). */

const CAUSE_PREFIXES = [...Object.keys(LAWS), "post_populist", "post_informative"];

export function badTemplates(text: string): string[] {
  const problems: string[] = [];
  for (const [, key, arg = ""] of text.matchAll(/\{\{(\w+)(?::([^}]+))?\}\}/g)) {
    if (key === "worst" && !(arg in GROUPS)) problems.push(`{{worst:${arg}}}`);
    if ((key === "date" || key === "what") && !CAUSE_PREFIXES.some((p) => p.startsWith(arg))) problems.push(`{{${key}:${arg}}}`);
    if (key === "g" && !arg.includes("/")) problems.push(`{{g:${arg}}} needs both forms, like {{g:o/a}}`);
    if (!["player", "PLAYER", "g", "flag", "date", "what", "worst"].includes(key!)) problems.push(`{{${key}}}`);
  }
  return problems;
}

export function badEffects(effects: readonly Effect[], out: string[] = []): string[] {
  for (const e of effects) {
    if (e.type === "opinion" && !(e.group in GROUPS)) out.push(`group:${e.group}`);
    if (e.type === "relation" && !(e.character in CHARACTERS)) out.push(`character:${e.character}`);
    if (e.type === "neighbourhood" && !(e.id in NEIGHBOURHOODS)) out.push(`neighbourhood:${e.id}`);
    if (e.type === "schedule") badEffects(e.effects, out);
    if (e.type === "deskItem") out.push(...badTemplates(e.item.title + e.item.body));
  }
  return out;
}

export function badConditions(c: Condition | undefined): string[] {
  if (!c) return [];
  if ("all" in c) return c.all.flatMap(badConditions);
  if ("any" in c) return c.any.flatMap(badConditions);
  if ("not" in c) return badConditions(c.not);
  if ("bookFinished" in c && !(c.bookFinished in BOOKS)) return [`book:${c.bookFinished}`];
  if ("ref" in c) {
    const [prefix, key = ""] = c.ref.split(":");
    if (prefix === "opinion" && !(key in GROUPS)) return [c.ref];
    if (prefix === "relation" && !(key in CHARACTERS)) return [c.ref];
    if ((prefix === "mood" || prefix === "base") && !(key in NEIGHBOURHOODS)) return [c.ref];
  }
  return [];
}
