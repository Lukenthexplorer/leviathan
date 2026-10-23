import { flag, funds, integrity, log, newspaper, opinion, relation } from "../helpers";
import type { SchemeDef } from "../types";

/**
 * Conspiracies. Every choice is a trade-off between cost, convenience and
 * loose threads, and some weak links break much later, by themselves.
 */
export const SCHEMES = {
  teixeira_donation: {
    title: "O dinheiro do Teixeira",
    briefing:
      "O contador de Augusto Teixeira vai ter 40 mil prontos na sexta. Sem declarar, claro. " +
      "O dinheiro precisa chegar à sua campanha sem encostar no seu nome. Quem leva, como viaja e quem fica sabendo: isso é com você.",
    dossierId: "teixeira_cash",
    dossierLabel: "Dinheiro não declarado da Teixeira Construções {intermediary}, {payment}",
    headline: "O DINHEIRO DA EMPREITEIRA",
    effects: [funds(40), integrity(-12), flag("hid_donation"), log("Escondeu uma doação ilegal da Teixeira Construções")],
    slots: [
      {
        id: "intermediary",
        question: "Quem leva o dinheiro?",
        options: [
          {
            id: "brother_in_law",
            label: "Seu cunhado, o Tonho",
            description: "Família. Te deve um favor. Adora churrasco, cerveja e plateia.",
            weakness: "Fala demais quando bebe. E vai querer gastar um pouco.",
            threads: 2,
            phrase: "levado pelo cunhado de quem recebeu",
            effects: [
              {
                type: "schedule",
                inTurns: 8,
                label: "Tonho aparece de picape zero",
                effects: [{ type: "thread", id: "teixeira_cash", add: 1 }, log("Os vizinhos perguntam como o Tonho pagou a picape nova")],
              },
            ],
          },
          {
            id: "doleiro",
            label: "Beto Câmbio, doleiro",
            description: "Move dinheiro para metade dos políticos do estado. Cobra 15%.",
            weakness: "Se a Polícia Federal pegar ele um dia, ele guarda cadernos muito detalhados.",
            threads: 1,
            phrase: "movimentado por um doleiro",
            effects: [
              funds(-6),
              {
                type: "schedule",
                inTurns: 14,
                label: "Polícia Federal prende o doleiro Beto Câmbio",
                effects: [
                  { type: "thread", id: "teixeira_cash", add: 3 },
                  flag("doleiro_arrested"),
                  newspaper(
                    "news_doleiro",
                    "PF PRENDE O DOLEIRO 'BETO CÂMBIO'",
                    "Numa operação de madrugada, agentes federais prenderam Roberto 'Beto Câmbio' Assis, suspeito de movimentar milhões em dinheiro político. " +
                      "Os investigadores apreenderam cadernos cheios de iniciais e datas. Fontes dizem que ele negocia uma delação.",
                  ),
                ],
              },
            ],
          },
          {
            id: "party_accountant",
            label: "O contador do partido",
            description: "Já fez isso cem vezes. Limpo, profissional, e o partido vai saber.",
            weakness: "Agora o partido é dono de um pedaço de você, e o partido tem memória longa.",
            threads: 1,
            phrase: "operado pelo próprio contador do partido",
            requires: { ref: "relation:party_boss", op: ">=", value: 10 },
            effects: [relation("party_boss", 8), flag("party_knows")],
          },
          {
            id: "yourself",
            label: "Você, pessoalmente",
            description: "Sem intermediários. Um estacionamento, uma bolsa esportiva, dez minutos.",
            weakness: "Câmeras de segurança. Porteiros. Seu próprio rosto.",
            threads: 3,
            phrase: "recolhido em mãos",
          },
        ],
      },
      {
        id: "payment",
        question: "Como o dinheiro viaja?",
        options: [
          {
            id: "cash",
            label: "Dinheiro vivo numa bolsa",
            description: "Sem banco, sem registro.",
            weakness: "Dinheiro vivo precisa de mãos, e mãos lembram.",
            threads: 1,
            phrase: "numa bolsa cheia de dinheiro vivo",
          },
          {
            id: "invoices",
            label: "Notas frias de consultoria",
            description: "Teixeira paga sua \"consultoria\" por estudos que ninguém nunca vai escrever.",
            weakness: "Papel dura para sempre, e auditor adora papel.",
            threads: 2,
            phrase: "disfarçado de notas frias de consultoria",
          },
          {
            id: "church",
            label: "Doação a uma obra social de igreja",
            description: "O sopão do Pastor Gilmar recebe uma doação generosa e depois \"empresta\" vans e voluntários à sua campanha.",
            weakness: "Se um dia vier à tona, os fiéis vão se sentir usados.",
            threads: 1,
            phrase: "lavado por meio de um sopão de igreja",
            effects: [flag("laundered_church")],
          },
          {
            id: "smurfing",
            label: "Cinquenta doações pequenas",
            description: "Funcionários do Teixeira \"doam\" um pouquinho cada um, dentro da lei, com o dinheiro dele.",
            weakness: "Cinquenta pessoas sabem que foram usadas. Cinquenta.",
            threads: 3,
            phrase: "fatiado em cinquenta doações falsas",
          },
        ],
      },
      {
        id: "knows",
        question: "Quem fica sabendo?",
        options: [
          {
            id: "alone",
            label: "Ninguém além de você",
            description: "Você cuida de cada detalhe pessoalmente.",
            weakness: "Cada detalhe carrega suas digitais.",
            threads: 1,
            phrase: "sem mais ninguém envolvido",
          },
          {
            id: "chief_of_staff",
            label: "Marta, sua chefe de gabinete",
            description: "Leal, discreta, mal paga. Vai querer um bônus.",
            weakness: "Lealdade tem preço, e agora você definiu qual é.",
            threads: 1,
            phrase: "com ajuda da chefe de gabinete",
            effects: [funds(-3)],
          },
          {
            id: "otavio",
            label: "Otávio",
            description: "Foi ele quem marcou o almoço. Ia descobrir de qualquer jeito, e gosta de ser útil.",
            weakness: "Se o Otávio um dia se virar contra você, esse segredo vira junto.",
            threads: 0,
            phrase: "com o conhecimento de um veterano do partido",
            effects: [relation("mentor", 10), flag("mentor_knows")],
          },
        ],
      },
    ],
    abort: {
      label: "Desistir. Dizer ao Teixeira que fique com o dinheiro.",
      effects: [relation("donor", -20), integrity(3), flag("backed_out_of_scheme"), opinion("business", -2, "Esnobou um grande financiador")],
    },
  },
} as const satisfies Record<string, SchemeDef>;

export type SchemeId = keyof typeof SCHEMES;
