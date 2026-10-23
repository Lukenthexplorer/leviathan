import { BALANCE } from "../../content/balance";
import { CHARACTERS, CHARACTER_IDS } from "../../content/councilman/characters";
import { GROUP_IDS } from "../../content/councilman/groups";
import { NEIGHBOURHOODS, NEIGHBOURHOOD_IDS } from "../../content/councilman/neighbourhoods";
import { PARTIES, type PartyId } from "../../content/councilman/parties";
import type { ChapterDefinition } from "../../core/chapter";
import { readRef } from "../../core/conditions";
import { EVENTS } from "../../content/councilman/events";
import { expectationsPressure } from "../../core/hidden";
import type { GameState } from "../../core/types";
import { LAW_IDS } from "../../content/councilman/laws";
import { readingRule, resolveCouncilmanDecision } from "./actions";
import { confessionRule, pressRule } from "./rules";

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
    inbox: [
      {
        id: "welcome",
        kind: "letter",
        from: "mentor",
        title: "Welcome to the Câmara, kid",
        body:
          `Congratulations on the election, ${playerName}. You squeezed in with the last seat, so don't let it go to your head.\n\n` +
          `Here's how it works. Every week you get three things done: a bill, a meeting, a walk in the neighbourhoods, a post, ` +
          `a chapter of a good book. Papers will pile up on this desk; answer them, they don't answer themselves.\n\n` +
          `In two years ${p.short} picks its candidate for mayor. Win the party, fill a campaign chest, and get the people on your side. ` +
          `Three things. Sounds simple.\n\nIt never is.\n\n— Otávio`,
        turn: 1,
      },
    ],
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
    // Planning a scheme answers a paper on the desk; it doesn't use up the agenda.
    const agenda = decisions.filter((d) => d.kind !== "scheme");
    if (agenda.length > BALANCE.turn.agendaSlots) {
      throw new Error(`Only ${BALANCE.turn.agendaSlots} actions per week`);
    }
    const count = (kind: string) => decisions.filter((d) => d.kind === kind).length;
    if (count("post") > BALANCE.social.maxPostsPerWeek) throw new Error("Only one post per week");
    if (count("read") > 1) throw new Error("You can only start one book per week");

    const met = decisions.filter((d) => d.kind === "meeting").map((d) => d.with as string);
    if (new Set(met).size !== met.length) throw new Error("Only one meeting per person per week");
    for (const who of met) {
      if (state.inbox.some((i) => i.from === who && i.choices?.length)) {
        throw new Error(`Answer ${who}'s last meeting before asking for another`);
      }
    }
    const schemes = decisions.filter((d) => d.kind === "scheme").map((d) => d.itemId);
    if (new Set(schemes).size !== schemes.length) throw new Error("One plan per scheme");
    const laws = decisions.filter((d) => d.kind === "proposeLaw").map((d) => d.law);
    if (new Set(laws).size !== laws.length) throw new Error("Each bill can only be proposed once");
  },

  resolveDecision: resolveCouncilmanDecision,

  weeklyRules(state) {
    return [
      ...readingRule(state),
      ...expectationsPressure(state),
      // Confession first: once everything is out, there's nothing left to dig.
      ...(state.flags.confess === 1 ? confessionRule(state) : pressRule(state)),
    ];
  },

  events: EVENTS,
  checkEnding,
};
