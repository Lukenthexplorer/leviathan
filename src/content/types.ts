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
