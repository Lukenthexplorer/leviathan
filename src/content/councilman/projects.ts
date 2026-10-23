import { log, newspaper, opinion, relation } from "../helpers";
import type { ProjectDef } from "../types";

/**
 * "Ajuda do gabinete": visible fixes the councillor pays for with the
 * residents' association. That is how 1980s assistencialismo worked: fast,
 * concrete, and it teaches people to expect the councillor to fix everything.
 */
export const PROJECTS = {
  nb_potholes: {
    title: "Mutirão tapa-buraco",
    summary: "Asfalto frio nos buracos piores, com os moradores ajudando. Rápido e barato. Barato demais, talvez.",
    cost: 4,
    effects: [
      { type: "neighbourhood", id: "@here", mood: 6, base: 4 },
      opinion("@residents", 4, "Tapou os buracos do bairro"),
    ],
    followUps: [
      {
        inTurns: 8,
        label: "Os buracos voltaram em {nb}",
        effects: [
          { type: "neighbourhood", id: "@here", mood: -5 },
          opinion("@residents", -3, "Os buracos voltaram"),
          newspaper(
            "news_potholes_{nbid}",
            "CHUVA LEVA O ASFALTO DO MUTIRÃO EM {NB}",
            "Bastaram duas semanas de chuva para os buracos tapados em {{date:nb_potholes_{nbid}}} reaparecerem em {nb}. " +
              "\"Foi asfalto frio jogado com pá\", diz um engenheiro da prefeitura. Os moradores já perderam a conta das rodas quebradas.",
          ),
        ],
      },
    ],
  },

  nb_pitch: {
    title: "Reforma do campinho",
    summary: "Trave nova, alambrado e iluminação no campinho de terra. O bairro inteiro aparece no domingo.",
    cost: 8,
    effects: [
      { type: "neighbourhood", id: "@here", mood: 8, base: 3 },
      opinion("periphery", 4, "Reformou o campinho"),
      opinion("workers", 3, "Reformou o campinho"),
    ],
    followUps: [
      {
        inTurns: 10,
        label: "Começa a liga infantil no campinho de {nb}",
        effects: [
          { type: "neighbourhood", id: "@here", mood: 5, addMarker: "rally" },
          opinion("religious", 3, "Tirou as crianças da rua"),
          log("Liga infantil começa no campinho de {nb}"),
        ],
      },
    ],
  },

  nb_lights: {
    title: "Postes de luz na viela",
    summary: "Postes nas vielas escuras, onde ninguém anda depois das oito.",
    cost: 6,
    effects: [{ type: "neighbourhood", id: "@here", mood: 6, base: 2 }, opinion("@residents", 2, "Iluminou as vielas")],
    followUps: [
      {
        inTurns: 6,
        label: "Menos assaltos nas vielas de {nb}",
        effects: [opinion("retirees", 4, "Ruas mais seguras à noite"), { type: "neighbourhood", id: "@here", mood: 4 }],
      },
    ],
  },

  nb_community_center: {
    title: "Reforma do centro comunitário",
    summary: "Telhado, banheiros e cadeiras novas no salão da associação de moradores. Vira o ponto de encontro do bairro.",
    cost: 12,
    effects: [
      { type: "neighbourhood", id: "@here", mood: 5, base: 10 },
      opinion("@residents", 3, "Reformou o centro comunitário"),
      relation("community_leader", 6),
      // Remembered for the campaign: rallies here are cheaper (step 3).
      { type: "flag", key: "community_center_{nbid}", set: 1 },
    ],
  },

  nb_cleanup: {
    title: "Mutirão de limpeza",
    summary: "Caminhão, vassouras e um sábado de sol. O entulho de meses vai embora num dia.",
    cost: 3,
    effects: [{ type: "neighbourhood", id: "@here", mood: 4 }, opinion("@residents", 2, "Organizou um mutirão de limpeza")],
  },
} as const satisfies Record<string, ProjectDef>;

export type ProjectId = keyof typeof PROJECTS;
export const PROJECT_IDS = Object.keys(PROJECTS) as ProjectId[];
