import type { PartyDef } from "../types";

export const PARTY_IDS = ["labour", "liberal", "conservative", "centrao"] as const;
export type PartyId = (typeof PARTY_IDS)[number];

export const PARTIES = {
  labour: {
    name: "Partido Trabalhista Popular",
    short: "PTP",
    ideology: "Left labour",
    description: "Born in the factory strikes of the '70s. Strong with unions and the poor, distrusted by business.",
    startingOpinions: { workers: 25, business: -20, students: 15, retirees: 0, religious: -5, periphery: 20 },
    boss: {
      name: "Cida Ramos",
      title: "PTP municipal president",
      bio: "Former union leader. Loyal to those who are loyal to the party line.",
    },
    favouredTopics: ["wages", "transport", "housing", "sanitation", "education"],
    opposedTopics: ["deregulation", "privatisation"],
  },
  liberal: {
    name: "Novo Rumo Liberal",
    short: "NRL",
    ideology: "Liberal market",
    description: "Young professionals and entrepreneurs. Talks about efficiency and spreadsheets.",
    startingOpinions: { workers: -15, business: 30, students: 5, retirees: -5, religious: -5, periphery: -15 },
    boss: {
      name: "Fernando Albuquerque Lins",
      title: "NRL regional coordinator",
      bio: "Investment banker turned politician. Measures everything, including loyalty.",
    },
    favouredTopics: ["taxes", "deregulation", "privatisation", "safety"],
    opposedTopics: ["wages", "regulation"],
  },
  conservative: {
    name: "Partido Ordem e Família",
    short: "POF",
    ideology: "Conservative",
    description: "Order, faith and family. Rising fast in the churches and the barracks.",
    startingOpinions: { workers: 0, business: 10, students: -25, retirees: 20, religious: 30, periphery: -5 },
    boss: {
      name: "Colonel Haroldo Vieira",
      title: "POF state chairman",
      bio: "Retired military police colonel. Expects discipline and public displays of faith.",
    },
    favouredTopics: ["safety", "family", "charity"],
    opposedTopics: ["culture"],
  },
  centrao: {
    name: "União do Centro Democrático",
    short: "UCD",
    ideology: "Centrão (big tent)",
    description: "Supports whoever governs, in exchange for posts and budget. Has no enemies, only prices.",
    startingOpinions: { workers: 5, business: 10, students: -10, retirees: 10, religious: 10, periphery: 5 },
    boss: {
      name: "Valdomiro Peixoto",
      title: "UCD eternal treasurer",
      bio: "Has served under six governments of four different ideologies. Never forgets a favour.",
    },
    favouredTopics: ["construction", "charity"],
    opposedTopics: [],
  },
} as const satisfies Record<PartyId, PartyDef>;
