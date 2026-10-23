import type { PartyDef } from "../types";

export const PARTY_IDS = ["labour", "liberal", "conservative", "centrao"] as const;
export type PartyId = (typeof PARTY_IDS)[number];

/** Topic tags must match the `topics` used in laws.ts (they're ids, kept in English). */
export const PARTIES = {
  labour: {
    name: "Partido Trabalhista Popular",
    short: "PTP",
    ideology: "Esquerda trabalhista",
    description: "Nasceu nas greves operárias dos anos 70. Forte nos sindicatos e entre os pobres, malvisto pelos empresários.",
    startingOpinions: { workers: 25, business: -20, students: 15, retirees: 0, religious: -5, periphery: 20 },
    boss: {
      name: "Cida Ramos",
      title: "Presidente municipal do PTP",
      bio: "Ex-líder sindical. Leal a quem é leal à linha do partido.",
    },
    favouredTopics: ["wages", "transport", "housing", "sanitation", "education"],
    opposedTopics: ["deregulation", "privatisation"],
  },
  liberal: {
    name: "Novo Rumo Liberal",
    short: "NRL",
    ideology: "Liberal de mercado",
    description: "Jovens profissionais e empreendedores. Fala em eficiência e em planilhas.",
    startingOpinions: { workers: -15, business: 30, students: 5, retirees: -5, religious: -5, periphery: -15 },
    boss: {
      name: "Fernando Albuquerque Lins",
      title: "Coordenador regional do NRL",
      bio: "Banqueiro de investimentos que virou político. Mede tudo, inclusive lealdade.",
    },
    favouredTopics: ["taxes", "deregulation", "privatisation", "safety"],
    opposedTopics: ["wages", "regulation"],
  },
  conservative: {
    name: "Partido Ordem e Família",
    short: "POF",
    ideology: "Conservador",
    description: "Ordem, fé e família. Crescendo rápido nas igrejas e nos quartéis.",
    startingOpinions: { workers: 0, business: 10, students: -25, retirees: 20, religious: 30, periphery: -5 },
    boss: {
      name: "Coronel Haroldo Vieira",
      title: "Presidente estadual do POF",
      bio: "Coronel reformado da PM. Exige disciplina e demonstrações públicas de fé.",
    },
    favouredTopics: ["safety", "family", "charity"],
    opposedTopics: ["culture"],
  },
  centrao: {
    name: "União do Centro Democrático",
    short: "UCD",
    ideology: "Centrão",
    description: "Apoia quem estiver no governo, em troca de cargos e orçamento. Não tem inimigos, só preços.",
    startingOpinions: { workers: 5, business: 10, students: -10, retirees: 10, religious: 10, periphery: 5 },
    boss: {
      name: "Valdomiro Peixoto",
      title: "Eterno tesoureiro da UCD",
      bio: "Já serviu a seis governos de quatro ideologias diferentes. Nunca esquece um favor.",
    },
    favouredTopics: ["construction", "charity"],
    // The big tent has no ideology, but it does have contracts.
    opposedTopics: ["transparency"],
  },
} as const satisfies Record<PartyId, PartyDef>;
