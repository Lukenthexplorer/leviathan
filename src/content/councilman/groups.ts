import type { GroupDef } from "../types";

export const GROUP_IDS = ["workers", "business", "students", "retirees", "religious", "periphery"] as const;
export type GroupId = (typeof GROUP_IDS)[number];

export const GROUPS = {
  workers: {
    name: "Trabalhadores",
    description: "Operários, motoristas de ônibus e estivadores de Porto Ferro. Organizados, orgulhosos e cansados de promessas.",
    concerns: ["emprego", "salário", "transporte"],
  },
  business: {
    name: "Empresários",
    description: "Lojistas e a Associação Comercial. Querem menos imposto e menos papelada.",
    concerns: ["impostos", "regulação", "segurança"],
  },
  students: {
    name: "Estudantes",
    description: "Barulhentos, mobilizados e rápidos para ir às ruas. Lembram dos protestos da passagem.",
    concerns: ["educação", "transporte", "cultura"],
  },
  retirees: {
    name: "Aposentados",
    description: "Votam em todas as eleições e leem o jornal. Inteiro.",
    concerns: ["saúde", "aposentadoria", "segurança"],
  },
  religious: {
    name: "Religiosos",
    description: "Paróquias católicas e igrejas evangélicas em plena expansão. Pastores carregam muitos votos.",
    concerns: ["família", "segurança", "caridade"],
  },
  periphery: {
    name: "Periferia",
    description: "As comunidades do morro que a cidade esquece até a época de eleição.",
    concerns: ["moradia", "saneamento", "segurança", "transporte"],
  },
} as const satisfies Record<GroupId, GroupDef>;
