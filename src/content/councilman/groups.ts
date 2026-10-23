import type { GroupDef } from "../types";

export const GROUP_IDS = ["workers", "business", "students", "retirees", "religious", "periphery"] as const;
export type GroupId = (typeof GROUP_IDS)[number];

export const GROUPS = {
  workers: {
    the: "os trabalhadores",
    name: "Trabalhadores",
    description: "Operários, motoristas de ônibus e estivadores de Porto Ferro. Organizados, orgulhosos e cansados de promessas.",
    concerns: ["emprego", "salário", "transporte"],
  },
  business: {
    the: "os empresários",
    name: "Empresários",
    description: "Lojistas e a Associação Comercial. Querem menos imposto e menos papelada.",
    concerns: ["impostos", "regulação", "segurança"],
  },
  students: {
    the: "os estudantes",
    name: "Estudantes",
    description: "Barulhentos, mobilizados e rápidos para ir às ruas. Lembram dos protestos da passagem.",
    concerns: ["educação", "transporte", "cultura"],
  },
  retirees: {
    the: "os aposentados",
    name: "Aposentados",
    description: "Votam em todas as eleições e leem o jornal. Inteiro.",
    concerns: ["saúde", "aposentadoria", "segurança"],
  },
  religious: {
    the: "os religiosos",
    name: "Religiosos",
    description: "Paróquias católicas e igrejas evangélicas em plena expansão. Pastores carregam muitos votos.",
    concerns: ["família", "segurança", "caridade"],
  },
  periphery: {
    the: "a periferia",
    name: "Periferia",
    description: "As comunidades do morro que a cidade esquece até a época de eleição.",
    concerns: ["moradia", "saneamento", "segurança", "transporte"],
  },
} as const satisfies Record<GroupId, GroupDef>;
