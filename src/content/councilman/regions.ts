import type { RegionDef } from "../types";

/** The rest of the state, for the deputy race. Porto Ferro is one city among many. */
export const REGIONS = {
  serra_alta: {
    name: "Serra Alta",
    description: "Cidades de serra, café e colonos. Votam no fazendeiro que o avô já votava.",
    voters: 180,
    residents: { religious: 0.4, retirees: 0.3, workers: 0.2, business: 0.1 },
  },
  campo_seco: {
    name: "Campo Seco",
    description: "O sertão do estado. Seca, carro-pipa e o coronel que manda o carro-pipa.",
    voters: 150,
    residents: { periphery: 0.5, religious: 0.3, workers: 0.2 },
  },
  vale_do_ipe: {
    name: "Vale do Ipê",
    description: "Usinas de cana e cidades médias. Sindicato forte na usina, igreja forte na praça.",
    voters: 210,
    residents: { workers: 0.45, religious: 0.3, periphery: 0.15, business: 0.1 },
  },
  porto_novo: {
    name: "Porto Novo",
    description: "O porto industrial do estado. Estivadores, fábricas e greves.",
    voters: 240,
    residents: { workers: 0.5, periphery: 0.2, business: 0.15, students: 0.15 },
  },
} as const satisfies Record<string, RegionDef>;

export type RegionId = keyof typeof REGIONS;
export const REGION_IDS = Object.keys(REGIONS) as RegionId[];
