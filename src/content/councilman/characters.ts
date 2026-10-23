import type { CharacterDef } from "../types";

export const CHARACTER_IDS = ["party_boss", "mentor", "rival", "journalist", "donor", "community_leader"] as const;
export type CharacterId = (typeof CHARACTER_IDS)[number];

/** party_boss's name and bio come from the chosen party (see parties.ts). */
export const CHARACTERS = {
  party_boss: {
    name: "(party boss)",
    role: "Party boss",
    bio: "Decides who gets the party's mayoral nomination.",
    portrait: "party_boss",
    startingRelation: 15,
  },
  mentor: {
    name: "Otávio Brandão",
    role: "The Mentor",
    bio: "Three-term councilman and party veteran. Knows where every body is buried, and who buried it.",
    portrait: "mentor",
    startingRelation: 20,
  },
  rival: {
    name: "Renata Saldanha",
    role: "The Rival",
    bio: "Elected the same night as you, with more votes. Ambitious, talented, and watching you.",
    portrait: "rival",
    startingRelation: 0,
  },
  journalist: {
    name: "Helena Vaz",
    role: "The Journalist",
    bio: "Investigative reporter at the Correio de Porto Ferro. Brought down a mayor in 1989.",
    portrait: "journalist",
    startingRelation: 0,
  },
  donor: {
    name: "Augusto Teixeira",
    role: "Donor",
    bio: "Owner of Teixeira Construções. Has paved half of Porto Ferro, and financed most of its council.",
    portrait: "donor",
    startingRelation: 0,
  },
  community_leader: {
    name: "Dona Lurdes Batista",
    role: "Community leader",
    bio: "Runs the residents' association on Morro da Esperança. Has seen many politicians come up the hill once.",
    portrait: "community_leader",
    startingRelation: -10,
  },
} as const satisfies Record<CharacterId, CharacterDef>;
