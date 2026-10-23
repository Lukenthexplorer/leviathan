import { mediaChannel, type CouncilmanDecision } from "../chapters/councilman/actions";
import { BOOKS } from "../content/councilman/books";
import { CHARACTERS, type CharacterId } from "../content/councilman/characters";
import { GROUPS } from "../content/councilman/groups";
import { LAWS } from "../content/councilman/laws";
import { NEIGHBOURHOODS } from "../content/councilman/neighbourhoods";
import { PARTIES, type PartyId } from "../content/councilman/parties";
import type { Condition, Decision, GameState } from "../core/types";

/** Player-facing wording. Kept apart from components so text is easy to find and change. */

export function characterName(state: GameState, id: string): string {
  if (id === "party_boss") return PARTIES[state.party as PartyId].boss.name;
  return CHARACTERS[id as CharacterId]?.name ?? id;
}

export function characterRole(state: GameState, id: string): string {
  if (id === "party_boss") return PARTIES[state.party as PartyId].boss.title;
  return CHARACTERS[id as CharacterId]?.role ?? "";
}

/** One typewritten line for the agenda pad. */
export function describeDecision(state: GameState, d: Decision): string {
  const c = d as CouncilmanDecision;
  switch (c.kind) {
    case "media":
      return mediaChannel(state, c.style).agenda.replace("{group}", GROUPS[c.group].name.toLowerCase());
    case "proposeLaw":
      return `${c.lobby ? "Articular" : "Propor"}: ${LAWS[c.law].title}`;
    case "neighbourhood":
      return `Percorrer ${NEIGHBOURHOODS[c.id].name}`;
    case "meeting":
      return `Reunião com ${characterName(state, c.with)}`;
    case "read":
      return `Começar a ler ${BOOKS[c.book].title}`;
    case "scheme":
      return "Plano em andamento";
    case "fundraise":
      return "Fazer uma vaquinha de campanha";
    case "seekNomination":
      return "Pedir a indicação do partido";
  }
  return d.kind;
}

/**
 * Relations are felt, not measured: the player sees words, not numbers.
 * Nouns rather than adjectives, so they never need to agree with a character's gender.
 */
export function relationWord(v: number): string {
  if (v <= -50) return "Hostilidade";
  if (v <= -15) return "Frieza";
  if (v < 15) return "Indiferença";
  if (v < 50) return "Simpatia";
  return "Confiança";
}

export function moodWord(v: number): string {
  if (v <= -40) return "Revoltado";
  if (v <= -10) return "Inquieto";
  if (v < 10) return "Calmo";
  if (v < 40) return "Satisfeito";
  return "Próspero";
}

/** Why a choice or bill is locked, in words. */
export function lockReason(c: Condition | undefined): string {
  if (!c) return "";
  if ("bookFinished" in c) return `Requer a leitura de ${BOOKS[c.bookFinished as keyof typeof BOOKS]?.title ?? c.bookFinished}`;
  return "Ainda não disponível";
}

/** How each kind of paper is labelled on the desk. */
export const KIND_LABEL: Record<string, string> = {
  letter: "carta",
  event: "evento",
  newspaper: "jornal",
  report: "relatório",
  phone: "telefonema",
  scheme: "esquema · confidencial",
};
