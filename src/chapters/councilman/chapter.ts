import { BALANCE } from "../../content/balance";
import { CHARACTERS, CHARACTER_IDS } from "../../content/councilman/characters";
import { GROUP_IDS } from "../../content/councilman/groups";
import { NEIGHBOURHOODS, NEIGHBOURHOOD_IDS } from "../../content/councilman/neighbourhoods";
import { PARTIES, type PartyId } from "../../content/councilman/parties";
import type { ChapterDefinition } from "../../core/chapter";
import { readRef } from "../../core/conditions";
import { expectationsPressure, investigationStep } from "../../core/hidden";
import type { GameState } from "../../core/types";
import { LAW_IDS } from "../../content/councilman/laws";
import { readingRule, resolveCouncilmanDecision } from "./actions";

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
    laws: Object.fromEntries(LAW_IDS.map((l) => [l, "draft" as const])),
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

  validateDecisions(state, decisions) {
    if (decisions.length > BALANCE.turn.agendaSlots) {
      throw new Error(`Only ${BALANCE.turn.agendaSlots} actions per week`);
    }
    const count = (kind: string) => decisions.filter((d) => d.kind === kind).length;
    if (count("post") > BALANCE.social.maxPostsPerWeek) throw new Error("Only one post per week");
    if (count("read") > 1) throw new Error("You can only start one book per week");

    const met = decisions.filter((d) => d.kind === "meeting").map((d) => d.with as string);
    if (new Set(met).size !== met.length) throw new Error("Only one meeting per person per week");
    for (const who of met) {
      if (state.inbox.some((i) => i.from === who && i.kind === "letter")) {
        throw new Error(`Answer ${who}'s last meeting before asking for another`);
      }
    }
    const laws = decisions.filter((d) => d.kind === "proposeLaw").map((d) => d.law);
    if (new Set(laws).size !== laws.length) throw new Error("Each bill can only be proposed once");
  },

  resolveDecision: resolveCouncilmanDecision,

  weeklyRules(state) {
    return [
      ...readingRule(state),
      ...expectationsPressure(state),
      ...investigationStep(state, "journalist", "party_boss"),
    ];
  },

  events: [],
  checkEnding,
};
