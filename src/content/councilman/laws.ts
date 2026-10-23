import { log, newspaper, opinion } from "../helpers";
import type { LawDef } from "../types";

/**
 * Local bills a councillor can propose. Every law helps someone and costs
 * someone, and most have a consequence that arrives weeks later.
 * Topics are ids (English) matched against party favoured/opposed topics.
 */
export const LAWS = {
  bus_fare_freeze: {
    title: "Congelamento da Passagem",
    summary: "Congela a tarifa de ônibus por dois anos. As empresas de ônibus vão querer compensação.",
    topics: ["transport", "wages"],
    councilSupport: 45,
    onPass: [
      opinion("students", 8, "Congelou a passagem"),
      opinion("workers", 6, "Congelou a passagem"),
      opinion("periphery", 6, "Congelou a passagem"),
      opinion("business", -6, "Congelou a passagem sem compensação"),
    ],
    followUps: [
      {
        inTurns: 6,
        label: "Empresas cortam linhas noturnas após o congelamento da passagem",
        effects: [
          opinion("periphery", -6, "Ônibus noturnos cortados"),
          opinion("workers", -4, "Ônibus noturnos cortados"),
          { type: "neighbourhood", id: "morro_esperanca", mood: -6 },
          newspaper(
            "news_night_buses",
            "CORTE NOS ÔNIBUS NOTURNOS: EMPRESAS CULPAM O CONGELAMENTO",
            "Três linhas noturnas que atendiam o morro foram canceladas ontem. O sindicato das empresas de ônibus diz que o congelamento " +
              "aprovado em {{date:bus_fare_freeze}} não deixou \"outra opção\". Quem trabalha no turno da noite agora caminha duas horas até em casa.",
          ),
        ],
      },
    ],
    delivers: 12,
  },

  hillside_sanitation: {
    title: "Saneamento para o Morro da Esperança",
    summary: "Leva esgoto e água tratada morro acima. Caro, lento, e ninguém no Centro vai perceber.",
    topics: ["sanitation", "housing", "construction"],
    councilSupport: 40,
    onPass: [opinion("periphery", 10, "Lutou pelo saneamento do morro"), opinion("business", -3, "Mais gasto público")],
    followUps: [
      {
        inTurns: 4,
        label: "Começam as obras de saneamento no Morro da Esperança",
        effects: [{ type: "neighbourhood", id: "morro_esperanca", mood: 8, addMarker: "construction" }],
      },
      {
        inTurns: 12,
        label: "Posto de saúde registra menos crianças doentes no morro",
        effects: [
          { type: "neighbourhood", id: "morro_esperanca", mood: 12, removeMarker: "construction" },
          opinion("periphery", 8, "A água limpa chegou"),
          opinion("religious", 3, "A água limpa chegou"),
          log("Água tratada chega ao Morro da Esperança"),
          newspaper(
            "news_clean_water",
            "ÁGUA TRATADA CHEGA AO MORRO DA ESPERANÇA",
            "Pela primeira vez na história, o morro tem água encanada e esgoto. O posto de saúde registra um terço a menos de crianças doentes. " +
              "As obras começaram com um projeto {{g:do vereador/da vereadora}} {{player}}, em {{date:hillside_sanitation}}.",
          ),
        ],
      },
    ],
    delivers: 15,
  },

  night_safety_patrols: {
    title: "Ronda Noturna",
    summary: "Mais guardas municipais nas ruas à noite, com poder de revista.",
    topics: ["safety"],
    councilSupport: 60,
    onPass: [
      opinion("retirees", 8, "Mais policiamento à noite"),
      opinion("business", 6, "Mais policiamento à noite"),
      opinion("religious", 4, "Mais policiamento à noite"),
      opinion("students", -6, "Poder de revista para a guarda"),
    ],
    followUps: [
      {
        inTurns: 5,
        label: "Denúncias de abuso da Ronda Noturna no morro",
        effects: [
          opinion("periphery", -8, "Abordados pela nova ronda"),
          { type: "neighbourhood", id: "morro_esperanca", mood: -10, addMarker: "police" },
          newspaper(
            "news_patrols",
            "\"PARAM A GENTE POR SER JOVEM\": RONDA É ACUSADA DE ABUSO",
            "Moradores do Morro da Esperança relatam revistas toda noite feitas pelos guardas criados em {{date:night_safety_patrols}}. " +
              "A ronda era para o Centro. Mas parece passar as noites no morro.",
          ),
        ],
      },
    ],
    delivers: 8,
  },

  university_culture_fund: {
    title: "Fundo de Cultura Estudantil",
    summary: "Bolsas para teatro, música e coletivos estudantis na Cidade Universitária.",
    topics: ["culture", "education"],
    councilSupport: 45,
    onPass: [opinion("students", 10, "Financiou a cultura estudantil"), opinion("religious", -4, "Dinheiro público para arte \"degenerada\"")],
    followUps: [
      {
        inTurns: 6,
        label: "Festival de rua lota a Cidade Universitária",
        effects: [{ type: "neighbourhood", id: "cidade_universitaria", mood: 10, addMarker: "rally" }],
      },
    ],
    delivers: 6,
  },

  pharmacy_discount: {
    title: "Farmácia do Aposentado",
    summary: "Desconto municipal em remédios para aposentados. Popular, e nada barato.",
    topics: ["health", "pensions"],
    councilSupport: 55,
    onPass: [opinion("retirees", 10, "Remédio mais barato"), opinion("religious", 2, "Cuidado com os idosos")],
    followUps: [
      {
        inTurns: 10,
        label: "Auditoria encontra rombo no orçamento da saúde após a Farmácia do Aposentado",
        effects: [
          opinion("business", -5, "Rombo da Farmácia do Aposentado"),
          log("Orçamento da saúde estoura"),
          newspaper(
            "news_pharmacy_hole",
            "AUDITORIA ENCONTRA ROMBO NO ORÇAMENTO DA SAÚDE",
            "O desconto em remédios para aposentados aprovado em {{date:pharmacy_discount}} custou três vezes o previsto. " +
              "Empresários perguntam quem vai pagar. \"Nós, como sempre\", disse um lojista.",
          ),
        ],
      },
    ],
    delivers: 10,
  },

  church_tax_exemption: {
    title: "Isenção de IPTU para Templos",
    summary: "Isenta templos e seus projetos sociais do imposto predial municipal.",
    topics: ["family", "charity"],
    councilSupport: 55,
    onPass: [opinion("religious", 12, "Isentou as igrejas de imposto"), opinion("students", -5, "Isenção de imposto para igrejas")],
    delivers: 6,
  },

  downtown_tax_cut: {
    title: "Corte do ISS no Centro",
    summary: "Reduz o imposto sobre serviços para pequenos negócios do Centro, contra as lojas fechadas.",
    topics: ["taxes", "deregulation"],
    councilSupport: 50,
    requires: { bookFinished: "hayek" },
    onPass: [
      opinion("business", 12, "Cortou impostos das empresas"),
      opinion("workers", -3, "Corte de imposto para os patrões"),
      opinion("periphery", -3, "Corte de imposto para os patrões"),
    ],
    followUps: [
      {
        inTurns: 8,
        label: "Novas lojas abrem no Centro após o corte do ISS",
        effects: [{ type: "neighbourhood", id: "centro", mood: 10 }, opinion("workers", 5, "Novos empregos no Centro"), log("Vitrines reabrem no Centro")],
      },
    ],
    delivers: 8,
  },

  public_works_jobs: {
    title: "Frente de Trabalho em Obras Públicas",
    summary: "Contrata desempregados para consertar ruas e praças. Gastar agora, crescer depois.",
    topics: ["jobs", "construction", "wages"],
    councilSupport: 45,
    requires: { bookFinished: "keynes" },
    onPass: [opinion("workers", 10, "Criou frentes de trabalho"), opinion("periphery", 6, "Criou frentes de trabalho")],
    followUps: [
      {
        inTurns: 5,
        label: "Frentes de trabalho em ação na Vila Operária",
        effects: [{ type: "neighbourhood", id: "vila_operaria", mood: 10, addMarker: "construction" }],
      },
      {
        inTurns: 16,
        label: "Frente de trabalho estoura o orçamento",
        effects: [
          { type: "neighbourhood", id: "vila_operaria", removeMarker: "construction" },
          opinion("business", -6, "Estouro das obras públicas"),
          log("Obras públicas estouram o orçamento"),
          newspaper(
            "news_works_overrun",
            "FRENTE DE TRABALHO ESTOURA O ORÇAMENTO, MAS A VILA OPERÁRIA TEM RUAS NOVAS",
            "A frente de trabalho criada em {{date:public_works_jobs}} está 40% acima do orçamento, diz a Fazenda. " +
              "Os economistas se dividem: uns veem desperdício, outros um estímulo keynesiano de livro fazendo exatamente o que prometia.",
          ),
        ],
      },
    ],
    delivers: 15,
  },
} as const satisfies Record<string, LawDef>;

export type LawId = keyof typeof LAWS;
export const LAW_IDS = Object.keys(LAWS) as LawId[];
