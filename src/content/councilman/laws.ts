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
    cost: 5,
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
    cost: 6,
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
    cost: 4,
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
    cost: 4,
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
    cost: 5,
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
    cost: 4,
    onPass: [opinion("religious", 12, "Isentou as igrejas de imposto"), opinion("students", -5, "Isenção de imposto para igrejas")],
    delivers: 6,
  },

  downtown_tax_cut: {
    title: "Corte do ISS no Centro",
    summary: "Reduz o imposto sobre serviços para pequenos negócios do Centro, contra as lojas fechadas.",
    topics: ["taxes", "deregulation"],
    councilSupport: 50,
    cost: 5,
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
    cost: 7,
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

  street_lighting: {
    title: "Luz nos Bairros",
    summary: "Postes e lâmpadas novas nas ruas escuras dos bairros mais pobres.",
    topics: ["safety", "construction"],
    councilSupport: 55,
    cost: 4,
    onPass: [
      opinion("periphery", 6, "Iluminou as ruas do bairro"),
      opinion("retirees", 4, "Ruas mais seguras à noite"),
      opinion("religious", 2, "Ruas mais seguras à noite"),
    ],
    followUps: [
      {
        inTurns: 4,
        label: "Postes novos acendem no Morro da Esperança",
        effects: [{ type: "neighbourhood", id: "morro_esperanca", mood: 6 }],
      },
    ],
    delivers: 8,
  },

  student_pass: {
    title: "Passe Livre Estudantil",
    summary: "Ônibus de graça para estudantes da rede pública. Alguém vai pagar a conta.",
    topics: ["transport", "education"],
    councilSupport: 40,
    cost: 6,
    onPass: [opinion("students", 12, "Aprovou o passe livre"), opinion("business", -5, "Mais um custo para as empresas")],
    followUps: [
      {
        inTurns: 8,
        label: "Empresas de ônibus aumentam a passagem para compensar o passe livre",
        effects: [
          opinion("workers", -5, "Passagem mais cara por causa do passe livre"),
          opinion("periphery", -3, "Passagem mais cara por causa do passe livre"),
          newspaper(
            "news_student_pass_fare",
            "PASSAGEM SOBE: TRABALHADOR PAGA O PASSE LIVRE",
            "As empresas de ônibus reajustaram a tarifa em 12%, citando o passe livre estudantil aprovado em {{date:student_pass}}. " +
              "\"O estudante não paga, quem paga sou eu\", disse uma diarista no ponto da Vila Operária.",
          ),
        ],
      },
    ],
    delivers: 10,
  },

  square_renovation: {
    title: "Reforma da Praça da Matriz",
    summary: "Bancos novos, coreto restaurado e jardim na praça em frente à catedral de São Bento.",
    topics: ["construction", "family"],
    councilSupport: 55,
    cost: 4,
    onPass: [opinion("religious", 5, "Reformou a praça da catedral"), opinion("retirees", 5, "Reformou a praça da catedral")],
    followUps: [
      { inTurns: 3, label: "Tapumes cercam a Praça da Matriz", effects: [{ type: "neighbourhood", id: "sao_bento", addMarker: "construction" }] },
      {
        inTurns: 10,
        label: "Praça da Matriz reinaugurada com banda e quermesse",
        effects: [{ type: "neighbourhood", id: "sao_bento", mood: 10, removeMarker: "construction", addMarker: "rally" }],
      },
    ],
    delivers: 6,
  },

  street_market: {
    title: "Regularização das Feiras Livres",
    summary: "Licença, horário e ponto fixo para feirantes. Ordem para uns, perda do ponto para outros.",
    topics: ["regulation"],
    councilSupport: 50,
    cost: 3,
    onPass: [
      opinion("business", 4, "Organizou as feiras"),
      opinion("workers", 2, "Feiras mais organizadas"),
      opinion("periphery", -3, "Camelôs perderam o ponto"),
    ],
    delivers: 4,
  },

  contract_transparency: {
    title: "Transparência nos Contratos",
    summary: "Todo contrato da prefeitura publicado no Diário Oficial, com valor, empresa e aditivos. Muita gente não vai gostar.",
    topics: ["transparency", "regulation"],
    councilSupport: 30,
    cost: 7,
    onPass: [
      opinion("students", 6, "Abriu os contratos da prefeitura"),
      opinion("retirees", 3, "Abriu os contratos da prefeitura"),
      { type: "relation", character: "donor", delta: -20 },
      { type: "relation", character: "journalist", delta: 12 },
      { type: "integrity", delta: 5 },
    ],
    followUps: [
      {
        inTurns: 6,
        label: "Correio encontra contratos superfaturados no Diário Oficial",
        effects: [
          newspaper(
            "news_transparency",
            "DIÁRIO OFICIAL REVELA: OBRAS DA CIDADE CUSTAM O DOBRO",
            "Graças à lei de transparência aprovada em {{date:contract_transparency}}, o Correio comparou preços de 40 contratos. " +
              "Asfalto, merenda, uniforme: quase tudo custa o dobro do mercado. Uma empreiteira aparece em 11 deles.",
          ),
          { type: "relation", character: "donor", delta: -10 },
        ],
      },
    ],
    delivers: 6,
  },
} as const satisfies Record<string, LawDef>;

export type LawId = keyof typeof LAWS;
export const LAW_IDS = Object.keys(LAWS) as LawId[];
