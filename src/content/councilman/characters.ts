import type { CharacterDef } from "../types";

export const CHARACTER_IDS = ["party_boss", "mentor", "rival", "journalist", "donor", "community_leader"] as const;
export type CharacterId = (typeof CHARACTER_IDS)[number];

/** party_boss's name and bio come from the chosen party (see parties.ts). */
export const CHARACTERS = {
  party_boss: {
    name: "(chefe do partido)",
    role: "Chefe do partido",
    bio: "Decide quem recebe a indicação do partido para prefeito.",
    portrait: "party_boss",
    startingRelation: 15,
  },
  mentor: {
    name: "Otávio Brandão",
    role: "O Mentor",
    bio: "Vereador há três mandatos e veterano do partido. Sabe onde cada corpo está enterrado, e quem enterrou.",
    portrait: "mentor",
    startingRelation: 20,
  },
  rival: {
    name: "Renata Saldanha",
    role: "A Rival",
    bio: "Eleita na mesma noite que você, com mais votos. Ambiciosa, talentosa e de olho em você.",
    portrait: "rival",
    startingRelation: 0,
  },
  journalist: {
    name: "Helena Vaz",
    role: "A Jornalista",
    bio: "Repórter investigativa do Correio de Porto Ferro. Derrubou um prefeito em 1985.",
    portrait: "journalist",
    startingRelation: 0,
  },
  donor: {
    name: "Augusto Teixeira",
    role: "Financiador",
    bio: "Dono da Teixeira Construções. Asfaltou meia Porto Ferro, e financiou quase toda a Câmara.",
    portrait: "donor",
    startingRelation: 0,
  },
  community_leader: {
    name: "Dona Lurdes Batista",
    role: "Liderança comunitária",
    bio: "Preside a associação de moradores do Morro da Esperança. Já viu muito político subir o morro uma vez só.",
    portrait: "community_leader",
    startingRelation: -10,
  },
} as const satisfies Record<CharacterId, CharacterDef>;
