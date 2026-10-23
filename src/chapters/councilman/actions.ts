import { BALANCE } from "../../content/balance";
import { BOOKS, type BookId } from "../../content/councilman/books";
import { GROUPS, GROUP_IDS, type GroupId } from "../../content/councilman/groups";
import { LAWS, type LawId } from "../../content/councilman/laws";
import { MEETINGS } from "../../content/councilman/meetings";
import { NEIGHBOURHOODS, type NeighbourhoodId } from "../../content/councilman/neighbourhoods";
import { PARTIES, type PartyId } from "../../content/councilman/parties";
import { SCHEMES, type SchemeId } from "../../content/councilman/schemes";
import type { SchemeDef, SchemeOption } from "../../content/types";
import type { CharacterId } from "../../content/councilman/characters";
import { channelFor } from "../../content/media";
import { yearOf } from "../../core/calendar";
import { evaluate } from "../../core/conditions";
import { opinionOf } from "../../core/groups";
import { pickVariant } from "../../core/text";
import type { Cause, ChapterDecision, Effect, GameState } from "../../core/types";

/**
 * The Councilman's desk actions, as typed decisions.
 * Each `resolve*` function reads the state and returns effects + a cause.
 * Nothing here mutates state: the core applies the effects.
 */

export type MediaStyle = "informative" | "populist";

export type CouncilmanDecision =
  /** Speak to a group through the media of the era: explain calmly, or promise everything. */
  | { kind: "media"; style: MediaStyle; group: GroupId }
  /** `lobby` 0..maxLobbyLevel: extra capital spent buying votes in the corridors. */
  | { kind: "proposeLaw"; law: LawId; lobby?: number }
  | { kind: "neighbourhood"; id: NeighbourhoodId }
  | { kind: "meeting"; with: CharacterId }
  | { kind: "read"; book: BookId }
  | { kind: "fundraise" }
  | { kind: "seekNomination" }
  /** Answer a scheme paper with a plan (picks per slot), or null to walk away. */
  | { kind: "scheme"; itemId: string; scheme: SchemeId; picks: Record<string, string> | null };

type Resolved = { effects: Effect[]; cause: Omit<Cause, "turn"> };

// ------------------------------------------------------------------ media

const M = BALANCE.media;

/** The channel this style uses in the current year: radio in 1989, social media from 2016. */
export const mediaChannel = (state: GameState, style: MediaStyle) => channelFor(yearOf(state.turn), style);

export function resolveMedia(state: GameState, d: { style: MediaStyle; group: GroupId }): Resolved {
  const group = GROUPS[d.group];
  const topic = group.concerns[0]!;
  const channel = mediaChannel(state, d.style);
  const fill = (t: string) => t.replace("{topic}", topic).replace("{group}", group.the);

  if (d.style === "informative") {
    return {
      cause: { kind: "media", id: `media_informative_${d.group}`, label: fill(channel.cause) },
      effects: [
        { type: "opinion", group: d.group, delta: M.informativeTarget, label: `Explicou ${topic} com clareza` },
        { type: "flag", key: "media_informative" },
      ],
    };
  }

  // Populist: big, fast, and it raises what everyone expects of you.
  const others: Effect[] = GROUP_IDS.filter((g) => g !== d.group).map((g) => ({
    type: "opinion",
    group: g,
    delta: M.populistOthers,
    label: `Repercussão: ${channel.name.toLowerCase()}`,
  }));
  return {
    cause: { kind: "media", id: `media_populist_${d.group}`, label: fill(channel.cause) },
    effects: [
      { type: "opinion", group: d.group, delta: M.populistTarget, label: `Prometeu ação sobre ${topic}` },
      ...others,
      { type: "expectations", delta: M.populistExpectations },
      { type: "flag", key: "media_populist" },
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

/** Capital needed to propose a bill at a given lobbying level. */
export function lawCost(id: LawId, lobby = 0): number {
  return LAWS[id].cost + lobby * L.lobbyCostPerLevel;
}

/**
 * Deterministic whip count: how many votes the bill gets (with optional
 * lobbying). Exported so the UI can show "likely to pass" before committing.
 */
export function lawVoteScore(state: GameState, id: LawId, lobby = 0): { score: number; passes: boolean } {
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
    (state.flags.rival_ally ? L.rivalAllyBonus : 0) +
    lobby * L.lobbyVotesPerLevel;
  return { score: Math.round(score), passes: score >= L.passThreshold };
}

export function resolveProposeLaw(state: GameState, id: LawId, lobby = 0): Resolved {
  const law = LAWS[id];
  if (!law) throw new Error(`Unknown law "${id}"`);
  if (!lawAvailable(state, id)) throw new Error(`"${law.title}" não pode ser proposto agora`);
  if (lobby < 0 || lobby > L.maxLobbyLevel) throw new Error(`Invalid lobby level ${lobby}`);
  const cost = lawCost(id, lobby);
  if (state.player.capital < cost) throw new Error(`Capital político insuficiente: "${law.title}" custa ${cost}`);

  const party = PARTIES[state.party as PartyId];
  const topics: readonly string[] = law.topics;
  const bossReaction =
    topics.filter((t) => (party.favouredTopics as readonly string[]).includes(t)).length * L.bossFavouredReaction +
    topics.filter((t) => (party.opposedTopics as readonly string[]).includes(t)).length * L.bossOpposedReaction;

  const { passes } = lawVoteScore(state, id, lobby);
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
        { type: "capital", delta: C.lawPassedPrestige },
        { type: "flag", key: "laws_passed" },
        { type: "log", text: `Câmara aprova: ${law.title}` },
        ...followUps,
      ]
    : [
        { type: "law", id, status: "rejected" },
        { type: "capital", delta: C.lawRejectedLoss },
        { type: "flag", key: "laws_rejected" },
        { type: "log", text: `Câmara rejeita: ${law.title}` },
      ];

  return {
    cause: { kind: "law", id, label: `Propôs o projeto ${law.title}` },
    effects: [
      { type: "capital", delta: -cost },
      ...(lobby > 0 ? [{ type: "flag", key: "lobbied_laws" } as Effect] : []),
      { type: "law", id, status: "proposed" },
      { type: "relation", character: "party_boss", delta: bossReaction },
      { type: "schedule", inTurns: L.weeksToVote, label: passes ? `Câmara aprova: ${law.title}` : `Câmara rejeita: ${law.title}`, effects: outcome },
    ],
  };
}

// ------------------------------------------------------------------ political capital

const C = BALANCE.capital;

/** What next week's capital income would be, and why. The desk shows the breakdown. */
export function capitalIncome(state: GameState): { total: number; supporters: number; bossTrust: boolean } {
  const supporters = Object.keys(state.groups).filter((g) => opinionOf(state, g) >= C.supportThreshold).length;
  const bossTrust = (state.characters.party_boss?.relation ?? 0) >= C.bossTrustAt;
  // Whole points only: half a point of capital means nothing to a player.
  const total = C.weeklyBase + Math.floor(supporters * C.perSupportingGroup) + (bossTrust ? C.bossTrustBonus : 0);
  return { total, supporters, bossTrust };
}

/** Weekly: the mandate, your supporters and the party's trust turn into political capital. */
export function capitalRule(state: GameState): Effect[] {
  return [{ type: "capital", delta: capitalIncome(state).total }];
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
    label: `Apareceu em ${nb.name}`,
  }));

  return {
    cause: { kind: "neighbourhood", id, label: `Percorreu as ruas de ${nb.name}` },
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

/**
 * How many times in a row you've made small talk with this person recently.
 * Courting someone every week stops working: each repeat is worth less.
 */
export function smalltalkStreak(state: GameState, who: string): number {
  const last = state.flags[`smalltalk_last_${who}`];
  if (last === undefined || state.turn - last > BALANCE.meetings.repeatWindowWeeks) return 0;
  return state.flags[`smalltalk_streak_${who}`] ?? 0;
}

const IMPATIENT = "\n\nDá para notar: é a terceira vez em pouco tempo. A conversa é educada, mas mais curta.";

export function resolveMeeting(state: GameState, who: CharacterId): Resolved {
  const m = nextMeeting(state, who);
  if (!m) throw new Error(`Nobody to meet: "${who}"`);

  // Repeat small talk: relation gains shrink with each visit in a row.
  const streak = m.repeatable ? smalltalkStreak(state, who) : 0;
  const factor = BALANCE.meetings.repeatDecay ** streak;
  const choices = m.choices.map((c) => ({
    ...c,
    effects: c.effects.map((e) => (e.type === "relation" && e.delta > 0 ? { ...e, delta: Math.round(e.delta * factor) } : e)),
  }));

  const item = pickVariant(
    state,
    { id: `${m.id}@${state.turn}`, kind: "letter" as const, from: who, title: m.title, body: m.body, choices, turn: state.turn },
    m.variants,
  );
  if (streak >= 2) item.body += IMPATIENT;

  return {
    cause: { kind: "meeting", id: m.id, label: m.title },
    effects: [
      { type: "flag", key: `met_${m.id}` },
      ...(m.repeatable
        ? ([
            { type: "flag", key: `smalltalk_streak_${who}`, set: streak + 1 },
            { type: "flag", key: `smalltalk_last_${who}`, set: state.turn },
          ] as Effect[])
        : []),
      { type: "deskItem", item },
    ],
  };
}

// ------------------------------------------------------------------ books

export function resolveRead(state: GameState, id: BookId): Resolved {
  const book = BOOKS[id];
  if (!book) throw new Error(`Unknown book "${id}"`);
  if (state.books.finished.includes(id)) throw new Error(`Você já leu ${book.title}`);
  if (state.books.reading?.id === id) throw new Error(`Você já está lendo ${book.title}`);
  return {
    cause: { kind: "book", id, label: `Começou a ler ${book.title}` },
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
    { type: "log", text: `Terminou de ler ${book.title}` },
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

// ------------------------------------------------------------------ campaign

/** How much a small-donor drive raises: honest money grows with your roots in the neighbourhoods. */
export function fundraiseAmount(state: GameState): number {
  const roots = Object.values(state.neighbourhoods).reduce((s, n) => s + n.base, 0);
  return Math.round(BALANCE.fundraising.base + roots * BALANCE.fundraising.perRootPoint);
}

export function resolveFundraise(state: GameState): Resolved {
  const amount = fundraiseAmount(state);
  return {
    cause: { kind: "neighbourhood", id: "fundraise", label: `Fez uma vaquinha de campanha (${amount}k)` },
    effects: [{ type: "funds", delta: amount }, { type: "flag", key: "fundraisers" }],
  };
}

export function resolveSeekNomination(): Resolved {
  return {
    cause: { kind: "system", id: "seek_nomination", label: "Pediu a indicação do partido à prefeitura" },
    effects: [{ type: "flag", key: "sought_nomination", set: 1 }],
  };
}

// ------------------------------------------------------------------ conspiracy

export type SchemePicks = Record<string, string>;

/** The options picked for each slot, in slot order. Throws on an incomplete or invalid plan. */
export function pickedOptions(state: GameState, def: SchemeDef, picks: SchemePicks): SchemeOption[] {
  return def.slots.map((slot) => {
    const opt = slot.options.find((o) => o.id === picks[slot.id]);
    if (!opt) throw new Error(`O plano precisa de uma resposta para "${slot.question}"`);
    if (opt.requires && !evaluate(state, opt.requires)) throw new Error(`"${opt.label}" não é uma opção para você agora`);
    return opt;
  });
}

/** How many loose threads a plan would leave. The planning board shows this as risk. */
export function schemeThreads(def: SchemeDef, picks: SchemePicks): number {
  return def.slots.reduce((sum, slot) => sum + (slot.options.find((o) => o.id === picks[slot.id])?.threads ?? 0), 0);
}

export function resolveScheme(state: GameState, d: { itemId: string; scheme: SchemeId; picks: SchemePicks | null }): Resolved {
  const def: SchemeDef = SCHEMES[d.scheme];
  if (!def) throw new Error(`Unknown scheme "${d.scheme}"`);
  if (!state.inbox.some((i) => i.id === d.itemId && i.scheme === d.scheme)) throw new Error(`No "${d.scheme}" plan on the desk`);

  if (!d.picks) {
    return {
      cause: { kind: "scheme", id: d.scheme, label: `Desistiu: ${def.title}` },
      effects: [{ type: "removeDeskItem", id: d.itemId }, ...def.abort.effects],
    };
  }

  const options = pickedOptions(state, def, d.picks);
  const label = def.dossierLabel.replace(/\{(\w+)\}/g, (_, slot: string) => options[def.slots.findIndex((s) => s.id === slot)]?.phrase ?? "");
  return {
    cause: { kind: "scheme", id: d.scheme, label: `Planejou: ${def.title}` },
    effects: [
      { type: "removeDeskItem", id: d.itemId },
      ...def.effects,
      ...options.flatMap((o) => o.effects ?? []),
      { type: "dossier", id: def.dossierId, label, headline: def.headline, threads: schemeThreads(def, d.picks) },
    ],
  };
}

// ------------------------------------------------------------------ dispatch

export function resolveCouncilmanDecision(state: GameState, decision: ChapterDecision): Resolved {
  const d = decision as CouncilmanDecision;
  switch (d.kind) {
    case "media":
      return resolveMedia(state, d);
    case "proposeLaw":
      return resolveProposeLaw(state, d.law, d.lobby ?? 0);
    case "neighbourhood":
      return resolveNeighbourhood(state, d.id);
    case "meeting":
      return resolveMeeting(state, d.with);
    case "read":
      return resolveRead(state, d.book);
    case "scheme":
      return resolveScheme(state, d);
    case "fundraise":
      return resolveFundraise(state);
    case "seekNomination":
      return resolveSeekNomination();
  }
  throw new Error(`Unknown councilman decision "${decision.kind}"`);
}
