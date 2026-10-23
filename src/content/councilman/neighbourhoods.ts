import type { NeighbourhoodDef } from "../types";

export const NEIGHBOURHOOD_IDS = ["centro", "jardim_atlantico", "vila_operaria", "morro_esperanca", "cidade_universitaria", "sao_bento"] as const;
export type NeighbourhoodId = (typeof NEIGHBOURHOOD_IDS)[number];

export const NEIGHBOURHOODS = {
  centro: {
    name: "Centro",
    description: "Fachadas coloniais, camelôs e o prédio da Câmara Municipal.",
    startingMood: 0,
    residents: { business: 0.4, workers: 0.2, retirees: 0.2, periphery: 0.2 },
  },
  jardim_atlantico: {
    name: "Jardim Atlântico",
    description: "Prédios de frente para o mar, segurança particular e o iate clube.",
    startingMood: 15,
    residents: { business: 0.6, retirees: 0.3, religious: 0.1 },
  },
  vila_operaria: {
    name: "Vila Operária",
    description: "Fileiras de casas de operários em volta da velha siderúrgica.",
    startingMood: -5,
    residents: { workers: 0.6, religious: 0.2, retirees: 0.2 },
  },
  morro_esperanca: {
    name: "Morro da Esperança",
    description: "Uma comunidade no morro sem saneamento, a uma hora de ônibus de qualquer lugar.",
    startingMood: -20,
    residents: { periphery: 0.7, religious: 0.2, workers: 0.1 },
  },
  cidade_universitaria: {
    name: "Cidade Universitária",
    description: "O campus da federal, seus bares e seus grafites.",
    startingMood: 5,
    residents: { students: 0.8, workers: 0.2 },
  },
  sao_bento: {
    name: "São Bento",
    description: "Ruas tranquilas, a catedral e a fila do INSS.",
    startingMood: 10,
    residents: { retirees: 0.5, religious: 0.4, business: 0.1 },
  },
} as const satisfies Record<NeighbourhoodId, NeighbourhoodDef>;
