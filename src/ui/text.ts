import type { CouncilmanDecision } from "../chapters/councilman/actions";
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
    case "post":
      return `${c.style === "populist" ? "Fiery" : "Explainer"} post for ${GROUPS[c.group].name.toLowerCase()}`;
    case "proposeLaw":
      return `Propose: ${LAWS[c.law].title}`;
    case "neighbourhood":
      return `Walk the streets of ${NEIGHBOURHOODS[c.id].name}`;
    case "meeting":
      return `Meet ${characterName(state, c.with)}`;
    case "read":
      return `Start reading ${BOOKS[c.book].title}`;
  }
  return d.kind;
}

/** Relations are felt, not measured: the player sees words, not numbers. */
export function relationWord(v: number): string {
  if (v <= -50) return "Hostile";
  if (v <= -15) return "Cold";
  if (v < 15) return "Neutral";
  if (v < 50) return "Friendly";
  return "Close";
}

export function moodWord(v: number): string {
  if (v <= -40) return "Furious";
  if (v <= -10) return "Restless";
  if (v < 10) return "Calm";
  if (v < 40) return "Content";
  return "Thriving";
}

/** Why a choice or bill is locked, in words. */
export function lockReason(c: Condition | undefined): string {
  if (!c) return "";
  if ("bookFinished" in c) return `Requires reading ${BOOKS[c.bookFinished as keyof typeof BOOKS]?.title ?? c.bookFinished}`;
  return "Not available yet";
}
