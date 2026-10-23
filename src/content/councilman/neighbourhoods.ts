import type { NeighbourhoodDef } from "../types";

export const NEIGHBOURHOOD_IDS = ["centro", "jardim_atlantico", "vila_operaria", "morro_esperanca", "cidade_universitaria", "sao_bento"] as const;
export type NeighbourhoodId = (typeof NEIGHBOURHOOD_IDS)[number];

export const NEIGHBOURHOODS = {
  centro: {
    name: "Centro",
    description: "Colonial facades, street vendors and the City Council building.",
    startingMood: 0,
    residents: { business: 0.4, workers: 0.2, retirees: 0.2, periphery: 0.2 },
  },
  jardim_atlantico: {
    name: "Jardim Atlântico",
    description: "Beachfront towers, private security and the yacht club.",
    startingMood: 15,
    residents: { business: 0.6, retirees: 0.3, religious: 0.1 },
  },
  vila_operaria: {
    name: "Vila Operária",
    description: "Rows of workers' houses around the old steel mill.",
    startingMood: -5,
    residents: { workers: 0.6, religious: 0.2, retirees: 0.2 },
  },
  morro_esperanca: {
    name: "Morro da Esperança",
    description: "A hillside community without proper sanitation, an hour by bus from anywhere.",
    startingMood: -20,
    residents: { periphery: 0.7, religious: 0.2, workers: 0.1 },
  },
  cidade_universitaria: {
    name: "Cidade Universitária",
    description: "The federal university campus, its bars and its graffiti.",
    startingMood: 5,
    residents: { students: 0.8, workers: 0.2 },
  },
  sao_bento: {
    name: "São Bento",
    description: "Quiet streets, the cathedral and the pension office queue.",
    startingMood: 10,
    residents: { retirees: 0.5, religious: 0.4, business: 0.1 },
  },
} as const satisfies Record<NeighbourhoodId, NeighbourhoodDef>;
