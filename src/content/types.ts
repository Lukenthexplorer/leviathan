import type { TextVariant } from "../core/text";
import type { Condition, DeskChoice, Effect, Hint } from "../core/types";

/**
 * Shapes of content data files. Content is plain data; chapters interpret it.
 */

export interface GroupDef {
  name: string;
  /** With its article, for sentences: "os empresários", "a periferia". */
  the: string;
  description: string;
  /** What this group cares about. Laws and posts are tagged with the same topics. */
  concerns: string[];
}

export interface PartyDef {
  name: string;
  short: string;
  ideology: string;
  description: string;
  /** Starting opinion of each group towards a member of this party. */
  startingOpinions: Record<string, number>;
  boss: { name: string; title: string; bio: string };
  /** Law topics that please / anger the party bosses. */
  favouredTopics: string[];
  opposedTopics: string[];
}

export interface CharacterDef {
  name: string;
  role: string;
  bio: string;
  /** Portrait file prefix in public/assets/portraits. */
  portrait: string;
  startingRelation: number;
}

export interface NeighbourhoodDef {
  name: string;
  description: string;
  startingMood: number;
  /** Share of each group living here (0..1). Building a base here wins these groups over. */
  residents: Record<string, number>;
}

export interface LawDef {
  title: string;
  summary: string;
  /** Matched against party favoured/opposed topics. */
  topics: string[];
  /** Base council votes in favour (0..100); 50+ passes after modifiers. */
  councilSupport: number;
  /** Political capital it costs to put this bill to a vote. */
  cost: number;
  /** Law can only be proposed when this holds (e.g. a book unlocks it). */
  requires?: Condition;
  /** Applied when the law passes. */
  onPass: Effect[];
  /** Consequences that arrive weeks after passing. */
  followUps?: { inTurns: number; label: string; effects: Effect[] }[];
  /** How much it fulfils public expectations when passed. */
  delivers: number;
  /** This law is the smarter version of another one (shown grouped with it, unlocked by a book). */
  upgradeOf?: string;
  /** The delayed consequence, in words, for players who read the right book. */
  hint?: Hint;
  /** Only exists if someone offered it to you (a desk letter sets flag `offered_<id>`). Hidden otherwise. */
  offer?: boolean;
}

export interface BookDef {
  title: string;
  author: string;
  year: number;
  weeksToRead: number;
  /** Shown when finished: the real idea, in plain words. This is the "learning" part. */
  lesson: string;
  unlocksText: string;
}

export interface MeetingDef {
  id: string;
  with: string;
  /** Offered only when this holds. First matching meeting in the list wins. */
  when?: Condition;
  /** Can happen again (fallback small talk). Otherwise once per game. */
  repeatable?: boolean;
  title: string;
  body: string;
  choices: DeskChoice[];
  /** Same meeting, different tone depending on hidden state. */
  variants?: TextVariant[];
}

/** One choice inside a scheme slot ("who carries the money?" -> "your brother-in-law"). */
export interface SchemeOption {
  id: string;
  label: string;
  description: string;
  /** Shown on the planning board: the weak link, in words. */
  weakness: string;
  /** Loose threads this choice leaves in the dossier. */
  threads: number;
  /** Third-person phrase for the dossier label, e.g. "carried by the councillor's brother-in-law". */
  phrase: string;
  requires?: Condition;
  /** Extra consequences, often delayed: a weak link that breaks months later. */
  effects?: Effect[];
}

export interface SchemeSlot {
  id: string;
  question: string;
  options: SchemeOption[];
}

/**
 * A conspiracy to plan. The same structure will cover every scheme in later
 * chapters (rigging votes, silencing enemies...): who, how, and who knows.
 */
export interface SchemeDef {
  title: string;
  briefing: string;
  dossierId: string;
  /** Uses {slotId} placeholders filled with each picked option's phrase. */
  dossierLabel: string;
  /** What the newspaper calls it if it ever comes out. */
  headline: string;
  effects: Effect[];
  slots: SchemeSlot[];
  abort: { label: string; effects: Effect[] };
}

/**
 * A way to reach the public, tied to an era. The mechanic is the same in every
 * era (explain calmly vs promise everything); the channel, words and look change.
 */
export interface MediaChannelDef {
  style: "informative" | "populist";
  /** Years in which this channel exists (inclusive). */
  from: number;
  to: number;
  name: string;
  /** Shown in the panel; {topic} and {group} are filled in. */
  description: string;
  /** Agenda line, e.g. "Entrevista na rádio para {group}". {group} includes its article ("a periferia"). */
  agenda: string;
  /** History/cause label, e.g. "Deu entrevista na rádio sobre {topic}". */
  cause: string;
}

/**
 * A neighbourhood project paid from the campaign chest ("Ajuda do gabinete").
 * Written once, done anywhere: inside effects, `"@here"` means the chosen
 * neighbourhood, an opinion for group `"@residents"` is shared among the groups
 * living there (by their share), and `{nb}` / `{nbid}` in text become its
 * name / id.
 */
export interface ProjectDef {
  title: string;
  summary: string;
  /** Campaign money it costs, in thousands. */
  cost: number;
  effects: Effect[];
  followUps?: { inTurns: number; label: string; effects: Effect[] }[];
}

/** An opponent in a race. Their strength per unit feeds the vote model (step 4). */
export interface CandidateDef {
  name: string;
  /** Party or label shown on TV ("PRN", "independente"...). */
  party: string;
  bio: string;
  /** Portrait file prefix (placeholder until art exists). */
  portrait: string;
  /** Base strength per electoral unit (neighbourhood or region id), 0..100. */
  profile: Record<string, number>;
  /** How they attack in the campaign: the tone of their accusations. */
  attackVerb: string;
}

/** Someone whose public support moves votes: Dona Lurdes, a pastor, the union... */
export interface EndorserDef {
  name: string;
  /** The group whose votes they carry. */
  group: string;
  /** Where their word counts most. */
  units: string[];
  requires: Condition;
  /** Shown when they can't be asked yet, in words. */
  lockedText: string;
  /** What they want in return: said out loud, and it raises expectations. */
  promise: string;
}

/** A region of the state, for the deputy race. */
export interface RegionDef {
  name: string;
  description: string;
  /** Registered voters, in thousands. */
  voters: number;
  /** Share of each group living there (0..1). */
  residents: Record<string, number>;
}
