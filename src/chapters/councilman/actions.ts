import { BALANCE } from "../../content/balance";
import { BOOKS, type BookId } from "../../content/councilman/books";
import { GROUPS, GROUP_IDS, type GroupId } from "../../content/councilman/groups";
import { LAWS, type LawId } from "../../content/councilman/laws";
import { MEETINGS } from "../../content/councilman/meetings";
import { NEIGHBOURHOODS, type NeighbourhoodId } from "../../content/councilman/neighbourhoods";
import { PARTIES, type PartyId } from "../../content/councilman/parties";
import type { CharacterId } from "../../content/councilman/characters";
import { evaluate } from "../../core/conditions";
import { pickVariant } from "../../core/text";
import type { Cause, ChapterDecision, Effect, GameState } from "../../core/types";

/**
 * The Councilman's desk actions, as typed decisions.
 * Each `resolve*` function reads the state and returns effects + a cause.
 * Nothing here mutates state: the core applies the effects.
 */

export type PostStyle = "informative" | "populist";

export type CouncilmanDecision =
  | { kind: "post"; style: PostStyle; group: GroupId }
  | { kind: "proposeLaw"; law: LawId }
  | { kind: "neighbourhood"; id: NeighbourhoodId }
  | { kind: "meeting"; with: CharacterId }
  | { kind: "read"; book: BookId };

type Resolved = { effects: Effect[]; cause: Omit<Cause, "turn"> };

// ------------------------------------------------------------------ social media

const S = BALANCE.social;

export function resolvePost(d: { style: PostStyle; group: GroupId }): Resolved {
  const group = GROUPS[d.group];
  const topic = group.concerns[0];

  if (d.style === "informative") {
    return {
      cause: { kind: "post", id: `post_informative_${d.group}`, label: `Posted an explainer on ${topic}` },
      effects: [
        { type: "opinion", group: d.group, delta: S.informativeTarget, label: `Explained ${topic} plainly` },
        { type: "flag", key: "posts_informative" },
      ],
    };
  }

  // Populist: big, fast, and it raises what everyone expects of you.
  const others: Effect[] = GROUP_IDS.filter((g) => g !== d.group).map((g) => ({
    type: "opinion",
    group: g,
    delta: S.populistOthers,
    label: "Viral post",
  }));
  return {
    cause: { kind: "post", id: `post_populist_${d.group}`, label: `Promised ${group.name.toLowerCase()} the world on ${topic}` },
    effects: [
      { type: "opinion", group: d.group, delta: S.populistTarget, label: `Promised action on ${topic}` },
      ...others,
      { type: "expectations", delta: S.populistExpectations },
      { type: "flag", key: "posts_populist" },
    ],
  };
}

// ------------------------------------------------------------------ laws

const L = BALANCE.laws;

export function lawAvailable(state: GameState, id: LawId): boolean {
  const law = LAWS[id];
  const status = state.laws[id] ?? "draft";
  return status === "draft" && (!("requires" in law) || evaluate(state, law.requires));
}

/**
 * Deterministic whip count: how many votes the bill gets. Exported so the UI
 * can show the player "likely to pass" before they commit.
 */
export function lawVoteScore(state: GameState, id: LawId): { score: number; passes: boolean } {
  const law = LAWS[id];
  const party = PARTIES[state.party as PartyId];
  const topics: readonly string[] = law.topics;
  const fav = topics.filter((t) => (party.favouredTopics as readonly string[]).includes(t)).length;
  const opp = topics.filter((t) => (party.opposedTopics as readonly string[]).includes(t)).length;
  const score =
    law.councilSupport +
    fav * L.favouredTopicBonus +
    opp * L.opposedTopicPenalty +
    (state.characters.party_boss?.relation ?? 0) * L.bossRelationWeight +
    (state.flags.council_favours ?? 0) * L.councilFavourBonus +
    (state.flags.rival_ally ? L.rivalAllyBonus : 0);
  return { score: Math.round(score), passes: score >= L.passThreshold };
}

export function resolveProposeLaw(state: GameState, id: LawId): Resolved {
  const law = LAWS[id];
  if (!law) throw new Error(`Unknown law "${id}"`);
  if (!lawAvailable(state, id)) throw new Error(`Law "${id}" cannot be proposed now`);

  const party = PARTIES[state.party as PartyId];
  const topics: readonly string[] = law.topics;
  const bossReaction =
    topics.filter((t) => (party.favouredTopics as readonly string[]).includes(t)).length * L.bossFavouredReaction +
    topics.filter((t) => (party.opposedTopics as readonly string[]).includes(t)).length * L.bossOpposedReaction;

  const { passes } = lawVoteScore(state, id);
  const followUps: Effect[] = ("followUps" in law ? law.followUps : []).map((f) => ({
    type: "schedule",
    inTurns: f.inTurns,
    label: f.label,
    effects: [...f.effects],
  }));

  const outcome: Effect[] = passes
    ? [
        { type: "law", id, status: "passed" },
        ...law.onPass,
        { type: "deliver", amount: law.delivers },
        { type: "flag", key: "laws_passed" },
        { type: "log", text: `Council passes the ${law.title}` },
        ...followUps,
      ]
    : [
        { type: "law", id, status: "rejected" },
        { type: "flag", key: "laws_rejected" },
        { type: "log", text: `Council rejects the ${law.title}` },
      ];

  return {
    cause: { kind: "law", id, label: `Proposed the ${law.title}` },
    effects: [
      { type: "law", id, status: "proposed" },
      { type: "relation", character: "party_boss", delta: bossReaction },
      { type: "schedule", inTurns: L.weeksToVote, label: passes ? `${law.title} passes` : `${law.title} is voted down`, effects: outcome },
    ],
  };
}

// ------------------------------------------------------------------ neighbourhood work

const N = BALANCE.neighbourhoodWork;

export function resolveNeighbourhood(state: GameState, id: NeighbourhoodId): Resolved {
  const nb = NEIGHBOURHOODS[id];
  if (!nb) throw new Error(`Unknown neighbourhood "${id}"`);
  const existingBase = state.neighbourhoods[id]?.base ?? 0;
  const boost = 1 + existingBase * N.baseCompounding;

  const residents: Effect[] = Object.entries(nb.residents).map(([group, share]) => ({
    type: "opinion",
    group,
    delta: Math.round(share * N.residentOpinion * boost * 10) / 10,
    label: `Showed up in ${nb.name}`,
  }));

  return {
    cause: { kind: "neighbourhood", id, label: `Worked the streets of ${nb.name}` },
    effects: [
      { type: "neighbourhood", id, base: N.baseGain, mood: N.moodGain },
      ...residents,
      ...(id === "morro_esperanca" ? [{ type: "relation", character: "community_leader", delta: 3 } as Effect] : []),
      { type: "flag", key: `worked_${id}` },
    ],
  };
}

// ------------------------------------------------------------------ meetings

/** Which meeting would happen if the player asked to meet this character now. */
export function nextMeeting(state: GameState, who: CharacterId) {
  return MEETINGS.find(
    (m) => m.with === who && (m.repeatable || !state.flags[`met_${m.id}`]) && (!m.when || evaluate(state, m.when)),
  );
}

export function resolveMeeting(state: GameState, who: CharacterId): Resolved {
  const m = nextMeeting(state, who);
  if (!m) throw new Error(`Nobody to meet: "${who}"`);
  const item = pickVariant(
    state,
    { id: `${m.id}@${state.turn}`, kind: "letter" as const, from: who, title: m.title, body: m.body, choices: m.choices, turn: state.turn },
    m.variants,
  );
  return {
    cause: { kind: "meeting", id: m.id, label: m.title },
    effects: [{ type: "flag", key: `met_${m.id}` }, { type: "deskItem", item }],
  };
}

// ------------------------------------------------------------------ books

export function resolveRead(state: GameState, id: BookId): Resolved {
  const book = BOOKS[id];
  if (!book) throw new Error(`Unknown book "${id}"`);
  if (state.books.finished.includes(id)) throw new Error(`Already read "${id}"`);
  if (state.books.reading?.id === id) throw new Error(`Already reading "${id}"`);
  return {
    cause: { kind: "book", id, label: `Started reading ${book.title}` },
    effects: [{ type: "startBook", id }],
  };
}

/** Weekly: turn the pages. Finishing a book puts its lesson on the desk. */
export function readingRule(state: GameState): Effect[] {
  const reading = state.books.reading;
  if (!reading) return [];
  const book = BOOKS[reading.id as BookId];
  if (reading.progress + 1 < book.weeksToRead) return [{ type: "readProgress", amount: 1 }];
  return [
    { type: "finishBook", id: reading.id },
    { type: "log", text: `Finished reading ${book.title}` },
    {
      type: "deskItem",
      item: {
        id: `book_${reading.id}`,
        kind: "report",
        title: `${book.title}, ${book.author} (${book.year})`,
        body: `${book.lesson}\n\n${book.unlocksText}`,
        turn: state.turn,
      },
    },
  ];
}

// ------------------------------------------------------------------ dispatch

export function resolveCouncilmanDecision(state: GameState, decision: ChapterDecision): Resolved {
  const d = decision as CouncilmanDecision;
  switch (d.kind) {
    case "post":
      return resolvePost(d);
    case "proposeLaw":
      return resolveProposeLaw(state, d.law);
    case "neighbourhood":
      return resolveNeighbourhood(state, d.id);
    case "meeting":
      return resolveMeeting(state, d.with);
    case "read":
      return resolveRead(state, d.book);
  }
  throw new Error(`Unknown councilman decision "${decision.kind}"`);
}
