import { BALANCE } from "../../content/balance";
import { monthYear } from "../../core/calendar";
import { investigationStep } from "../../core/hidden";
import { lowerFirst } from "../../core/text";
import type { Effect, GameState } from "../../core/types";

const I = BALANCE.investigation;

/**
 * The journalist's weekly digging (core rule) plus the Councilman chapter's
 * way of telling the story: an exposé lands on the desk as a newspaper that
 * names when the act happened.
 */
export function pressRule(state: GameState): Effect[] {
  const effects = investigationStep(state, "journalist", "party_boss");
  const exposed = effects.find((e) => e.type === "expose");
  if (exposed?.type !== "expose") return effects;

  const entry = state.hidden.dossier.find((d) => d.id === exposed.id)!;
  effects.push({
    type: "deskItem",
    item: {
      id: `scandal_${entry.id}`,
      kind: "newspaper",
      title: `EXCLUSIVE: ${(entry.headline ?? entry.label).toUpperCase()}`,
      body:
        `Documents obtained by the Correio show that in ${monthYear(entry.turn)} councillor {{player}} was involved in what sources ` +
        `describe as "${lowerFirst(entry.label)}". ${entry.threads > 2 ? "Several people" : "At least one person"} close to the councillor ` +
        `confirmed the story. The councillor's office did not respond. — Helena Vaz`,
      turn: state.turn,
    },
  });
  return effects;
}

/** Coming clean: everything is exposed at once, but the damage is softened and integrity recovers. */
export function confessionRule(state: GameState): Effect[] {
  if (state.flags.confess !== 1) return [];
  const hidden = state.hidden.dossier.filter((d) => !d.exposed);
  const threads = hidden.reduce((s, d) => s + d.threads, 0);
  const hit = threads * I.scandalOpinionPerThread * I.confessionDamageFactor;
  return [
    { type: "flag", key: "confess", set: 2 },
    { type: "flag", key: "investigation", set: 0 },
    ...hidden.map((d): Effect => ({ type: "expose", id: d.id })),
    ...Object.keys(state.groups).map((group): Effect => ({ type: "opinion", group, delta: hit, label: "Confessed wrongdoing" })),
    { type: "integrity", delta: I.confessionIntegrity },
    { type: "log", text: "Confessed to the press" },
    {
      type: "deskItem",
      item: {
        id: "news_confession",
        kind: "newspaper",
        title: "COUNCILLOR {{PLAYER}} CONFESSES",
        body:
          `In an extraordinary interview with this newspaper, councillor {{player}} admitted to ${hidden.map((d) => lowerFirst(d.label)).join("; ")}. ` +
          `"I made mistakes. I want to be judged on what comes next," the councillor said. Porto Ferro is not used to this. Nobody knows quite what to make of it.`,
        turn: state.turn,
      },
    },
  ];
}
