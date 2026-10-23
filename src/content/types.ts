import type { Condition, DeskChoice, Effect } from "../core/types";

/**
 * Shapes of content data files. Content is plain data; chapters interpret it.
 */

export interface GroupDef {
  name: string;
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
  /** Law can only be proposed when this holds (e.g. a book unlocks it). */
  requires?: Condition;
  /** Applied when the law passes. */
  onPass: Effect[];
  /** Consequences that arrive weeks after passing. */
  followUps?: { inTurns: number; label: string; effects: Effect[] }[];
  /** How much it fulfils public expectations when passed. */
  delivers: number;
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
}
