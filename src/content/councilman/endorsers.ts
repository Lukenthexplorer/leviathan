import type { EndorserDef } from "../types";

/** People whose word moves votes. Each asks for something in return. */
export const ENDORSERS = {
  lurdes: {
    name: "Dona Lurdes Batista",
    group: "periphery",
    units: ["morro_esperanca"],
    requires: { ref: "relation:community_leader", op: ">=", value: 20 },
    lockedText: "Dona Lurdes ainda não confia em você o bastante",
    promise: "\"Eu peço voto pra você no morro. Mas quando ganhar, o saneamento vem primeiro.\"",
  },
  pastor: {
    name: "Pastor Gilmar Rocha",
    group: "religious",
    units: ["sao_bento", "morro_esperanca"],
    requires: { all: [{ ref: "opinion:religious", op: ">=", value: 10 }, { ref: "flag:laundered_church", op: "==", value: 0 }] },
    lockedText: "Os religiosos ainda não estão com você",
    promise: "\"A igreja apoia quem defende a família. Vamos lembrar disso depois da eleição.\"",
  },
  union: {
    name: "Sindicato dos Metalúrgicos",
    group: "workers",
    units: ["vila_operaria"],
    requires: { ref: "opinion:workers", op: ">=", value: 10 },
    lockedText: "Os trabalhadores ainda não estão com você",
    promise: "\"O sindicato fecha com você. Mas a pauta salarial vai ter que andar.\"",
  },
  commerce: {
    name: "Associação Comercial",
    group: "business",
    units: ["centro", "jardim_atlantico"],
    requires: { ref: "opinion:business", op: ">=", value: 10 },
    lockedText: "Os empresários ainda não estão com você",
    promise: "\"Nossos associados vão saber em quem votar. Contamos com menos impostos.\"",
  },
} as const satisfies Record<string, EndorserDef>;

export type EndorserId = keyof typeof ENDORSERS;
export const ENDORSER_IDS = Object.keys(ENDORSERS) as EndorserId[];
