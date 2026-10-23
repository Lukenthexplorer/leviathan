/**
 * Core data model. Everything here is plain, serialisable data: no classes,
 * no functions. That is what lets us save to localStorage with JSON.stringify
 * and test the simulation without a browser.
 *
 * Ids are plain strings in the core so any chapter can define its own groups,
 * characters, laws... Content tests check that every id actually exists.
 */

// ------------------------------------------------------------------ state

export interface GameState {
  version: number;
  chapterId: string;
  /** Current week. Decisions taken now are resolved by advanceTurn, which moves to turn + 1. */
  turn: number;
  party: string;
  player: PlayerState;
  groups: Record<string, GroupState>;
  hidden: HiddenState;
  characters: Record<string, CharacterState>;
  neighbourhoods: Record<string, NeighbourhoodState>;
  laws: Record<string, LawStatus>;
  books: { reading: { id: string; progress: number } | null; finished: string[] };
  /** Delayed consequences waiting to fire. */
  queue: ScheduledEffect[];
  /** Papers currently on the desk. */
  inbox: DeskItem[];
  /** Everything that happened, with causes. Feeds newspapers and the legacy page. */
  history: HistoryEntry[];
  /** Ids of one-shot events that already fired. */
  firedEvents: string[];
  /** Free-form counters for content ("posts_populist": 3, "met_donor": 1). */
  flags: Record<string, number>;
  ending: string | null;
}

export interface PlayerState {
  name: string;
  /** Campaign money, in thousands. */
  funds: number;
}

/**
 * A group's opinion is never stored: it is computed from a fixed baseline plus
 * memories that fade over time (see groups.ts).
 */
export interface GroupState {
  baseline: number;
  memories: Memory[];
}

export interface Memory {
  label: string;
  impact: number;
  turn: number;
  cause: Cause;
}

/** Never shown to the player directly. */
export interface HiddenState {
  /** 100 = spotless, 0 = rotten. */
  integrity: number;
  /** Promises the public expects you to deliver. */
  expectations: number;
  dossier: DossierEntry[];
}

export interface DossierEntry {
  id: string;
  label: string;
  /** Loose threads an investigator can pull. More threads = easier to expose. */
  threads: number;
  turn: number;
  exposed: boolean;
}

export interface CharacterState {
  /** -100..100: how this character feels about the player. */
  relation: number;
}

export interface NeighbourhoodState {
  mood: number;
  /** How established the player's political base is here (0..100). */
  base: number;
  markers: MapMarker[];
}

export type MapMarker = "protest" | "construction" | "rally" | "police";

export type LawStatus = "draft" | "proposed" | "passed" | "rejected";

// ------------------------------------------------------------------ causes

/** Why something happened. Attached to every effect so the game can explain itself. */
export interface Cause {
  kind: "law" | "post" | "meeting" | "neighbourhood" | "book" | "event" | "scheme" | "system";
  id: string;
  turn: number;
  label: string;
}

export interface HistoryEntry {
  turn: number;
  cause: Cause;
  text: string;
}

// ------------------------------------------------------------------ effects

/**
 * The effect DSL: data describing a change to the state.
 * Content (laws, events, books...) is written entirely in these.
 */
export type Effect =
  | { type: "opinion"; group: string; delta: number; label: string }
  | { type: "funds"; delta: number }
  | { type: "integrity"; delta: number }
  | { type: "expectations"; delta: number }
  | { type: "dossier"; id: string; label: string; threads: number }
  | { type: "expose"; id: string }
  | { type: "relation"; character: string; delta: number }
  | { type: "neighbourhood"; id: string; mood?: number; base?: number; addMarker?: MapMarker; removeMarker?: MapMarker }
  | { type: "flag"; key: string; add?: number; set?: number }
  | { type: "law"; id: string; status: LawStatus }
  | { type: "deliver"; amount: number }
  | { type: "startBook"; id: string }
  | { type: "readProgress"; amount: number }
  | { type: "finishBook"; id: string }
  | { type: "schedule"; inTurns: number; label: string; effects: Effect[] }
  | { type: "deskItem"; item: DeskItem }
  | { type: "log"; text: string };

export interface ScheduledEffect {
  fireOnTurn: number;
  label: string;
  effects: Effect[];
  /** The original decision that caused this, so a newspaper can link back to it. */
  cause: Cause;
}

// ------------------------------------------------------------------ conditions

/**
 * Numeric values a condition can read. Template literal types make
 * "opinion:students" type-check while "opinon:students" does not.
 */
export type NumRef =
  | "turn"
  | "funds"
  | "integrity"
  | "expectations"
  | "dossierThreads"
  | "unexposedThreads"
  | "exposedThreads"
  | "averageOpinion"
  | `opinion:${string}`
  | `relation:${string}`
  | `flag:${string}`
  | `mood:${string}`
  | `base:${string}`;

export type Comparison = ">" | ">=" | "<" | "<=" | "==" | "!=";

export type Condition =
  | { all: Condition[] }
  | { any: Condition[] }
  | { not: Condition }
  | { ref: NumRef; op: Comparison; value: number }
  | { law: string; is: LawStatus }
  | { bookFinished: string }
  | { party: string };

// ------------------------------------------------------------------ desk & decisions

export interface DeskChoice {
  id: string;
  label: string;
  effects: Effect[];
  /** Choice is only offered when this holds (e.g. a book unlocks an argument). */
  requires?: Condition;
}

export interface DeskItem {
  id: string;
  kind: "letter" | "event" | "newspaper" | "report" | "phone";
  from?: string;
  title: string;
  body: string;
  choices?: DeskChoice[];
  /** For newspapers: the earlier decision this story is about. */
  cause?: Cause;
  turn: number;
}

/**
 * What the player did this week. `choose` (answering a desk item) and `dismiss`
 * (filing a paper that has no choices) are handled by the core; every other
 * kind is resolved by the active chapter.
 */
export type Decision =
  | { kind: "choose"; itemId: string; choiceId: string }
  | { kind: "dismiss"; itemId: string }
  | ChapterDecision;

/** Desk answers don't use up the week's agenda; chapter actions do. */
export function isDeskAnswer(d: Decision): boolean {
  return d.kind === "choose" || d.kind === "dismiss";
}

export interface ChapterDecision {
  kind: string;
  [key: string]: unknown;
}

// ------------------------------------------------------------------ turn report

/** What advanceTurn tells the UI so it can animate what changed. */
export interface TurnReport {
  fromTurn: number;
  toTurn: number;
  opinionChanges: Record<string, { before: number; after: number }>;
  /** Delayed consequences that fired this turn. */
  consequences: { label: string; cause: Cause }[];
  newDeskItems: DeskItem[];
  ending: string | null;
}
