import { BALANCE } from "../../content/balance";
import { CHARACTERS, CHARACTER_IDS } from "../../content/councilman/characters";
import { GROUP_IDS } from "../../content/councilman/groups";
import { NEIGHBOURHOODS, NEIGHBOURHOOD_IDS } from "../../content/councilman/neighbourhoods";
import { PARTIES, type PartyId } from "../../content/councilman/parties";
import type { ChapterDefinition } from "../../core/chapter";
import { readRef } from "../../core/conditions";
import { expectationsPressure, investigationStep } from "../../core/hidden";
import type { GameState } from "../../core/types";
import { resolvePost, type CouncilmanDecision } from "./actions";

const C = BALANCE.councilman;

export const COUNCILMAN_ENDINGS = ["arrested", "expelled", "lost_support", "candidacy"] as const;
export type CouncilmanEnding = (typeof COUNCILMAN_ENDINGS)[number];

function createInitialState({ playerName, party }: { playerName: string; party: string }): GameState {
  const p = PARTIES[party as PartyId];
  if (!p) throw new Error(`Unknown party "${party}"`);

  return {
    version: 1,
    chapterId: "councilman",
    turn: 1,
    party,
    player: { name: playerName, funds: C.startingFunds },
    groups: Object.fromEntries(GROUP_IDS.map((g) => [g, { baseline: p.startingOpinions[g], memories: [] }])),
    hidden: {
      integrity: BALANCE.hidden.integrityStart,
      expectations: BALANCE.hidden.expectationsStart,
      dossier: [],
    },
    characters: Object.fromEntries(CHARACTER_IDS.map((c) => [c, { relation: CHARACTERS[c].startingRelation }])),
    neighbourhoods: Object.fromEntries(
      NEIGHBOURHOOD_IDS.map((n) => [n, { mood: NEIGHBOURHOODS[n].startingMood, base: 0, markers: [] }]),
    ),
    laws: {},
    books: { reading: null, finished: [] },
    queue: [],
    inbox: [],
    history: [],
    firedEvents: [],
    flags: {},
    ending: null,
  };
}

function checkEnding(state: GameState): CouncilmanEnding | null {
  if (readRef(state, "exposedThreads") >= C.arrestAtExposedThreads) return "arrested";
  if (readRef(state, "relation:party_boss") <= C.expelledAtBossRelation) return "expelled";
  if (readRef(state, "averageOpinion") <= C.lostSupportAtAverageOpinion) return "lost_support";
  return null;
}

export const councilmanChapter: ChapterDefinition = {
  id: "councilman",
  createInitialState,

  validateDecisions(_state, decisions) {
    if (decisions.length > BALANCE.turn.agendaSlots) {
      throw new Error(`Only ${BALANCE.turn.agendaSlots} actions per week`);
    }
    if (decisions.filter((d) => d.kind === "post").length > BALANCE.social.maxPostsPerWeek) {
      throw new Error("Only one post per week");
    }
  },

  resolveDecision(_state, decision) {
    const d = decision as CouncilmanDecision;
    switch (d.kind) {
      case "post":
        return resolvePost(d);
    }
    throw new Error(`Unknown councilman decision "${decision.kind}"`);
  },

  weeklyRules(state) {
    return [...expectationsPressure(state), ...investigationStep(state, "journalist", "party_boss")];
  },

  events: [],
  checkEnding,
};
