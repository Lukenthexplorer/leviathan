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
      title: `EXCLUSIVO: ${(entry.headline ?? entry.label).toUpperCase()}`,
      body:
        `Documentos obtidos pelo Correio mostram que, em ${monthYear(entry.turn)}, {{g:o vereador/a vereadora}} {{player}} se envolveu no que ` +
        `fontes descrevem como "${lowerFirst(entry.label)}". ${entry.threads > 2 ? "Várias pessoas próximas" : "Pelo menos uma pessoa próxima"} ` +
        `{{g:ao vereador/à vereadora}} confirmaram a história. O gabinete não respondeu. — Helena Vaz`,
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
    ...Object.keys(state.groups).map((group): Effect => ({ type: "opinion", group, delta: hit, label: "Confessou irregularidades" })),
    { type: "integrity", delta: I.confessionIntegrity },
    { type: "log", text: "Confessou à imprensa" },
    {
      type: "deskItem",
      item: {
        id: "news_confession",
        kind: "newspaper",
        title: "{{g:VEREADOR/VEREADORA}} {{PLAYER}} CONFESSA",
        body:
          `Numa entrevista extraordinária a este jornal, {{g:o vereador/a vereadora}} {{player}} admitiu: ${hidden.map((d) => lowerFirst(d.label)).join("; ")}. ` +
          `"Eu errei. Quero ser julgad{{g:o/a}} pelo que vem daqui pra frente." Porto Ferro não está acostumada com isso. Ninguém sabe bem o que pensar.`,
        turn: state.turn,
      },
    },
  ];
}
