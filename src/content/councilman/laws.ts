import { expectations, log, newspaper, opinion } from "../helpers";
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
    hint: { text: "Analistas preveem: sem compensação, as empresas de ônibus vão cortar as linhas noturnas.", by: ["keynes", "hayek"] },
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
    hint: { text: "Quem conhece o poder sabe: a ronda vai passar as noites no morro, não no Centro.", by: ["machiavelli", "faoro"] },
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
    hint: { text: "Analistas preveem: o desconto vai custar bem mais que o estimado e abrir um rombo na saúde.", by: ["keynes", "hayek"] },
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
    upgradeOf: "cesta_basica",
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
    hint: { text: "Analistas preveem: vai estourar o orçamento, mas as ruas e os empregos ficam.", by: ["keynes"] },
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
    hint: { text: "Analistas preveem: as empresas vão repassar o custo para a passagem de quem trabalha.", by: ["hayek", "keynes"] },
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
    upgradeOf: "price_freeze",
    title: "Regularização das Feiras Livres",
    summary: "Licença, horário e ponto fixo para feirantes. Ordem para uns, perda do ponto para outros.",
    topics: ["regulation"],
    councilSupport: 50,
    cost: 3,
    requires: { bookFinished: "hayek" },
    onPass: [
      opinion("business", 4, "Organizou as feiras"),
      opinion("workers", 2, "Feiras mais organizadas"),
      opinion("periphery", -3, "Camelôs perderam o ponto"),
    ],
    delivers: 4,
  },

  market_concession: {
    title: "Concessão do Mercado Municipal",
    summary: "Entrega a gestão do velho Mercado Municipal a uma empresa privada por 20 anos, em troca de reforma e aluguel.",
    topics: ["privatisation", "deregulation"],
    councilSupport: 45,
    cost: 5,
    onPass: [
      opinion("business", 8, "Concedeu o Mercado Municipal"),
      opinion("workers", -4, "Mercado entregue à iniciativa privada"),
      opinion("periphery", -2, "Mercado entregue à iniciativa privada"),
    ],
    followUps: [
      {
        inTurns: 10,
        label: "Mercado Municipal reabre reformado, e mais caro",
        effects: [
          { type: "neighbourhood", id: "centro", mood: 8 },
          opinion("retirees", -3, "Mercado reformado, mas mais caro"),
          newspaper(
            "news_market",
            "MERCADO REABRE LINDO; FREGUESES RECLAMAM DOS PREÇOS",
            "Reformado pela concessionária desde {{date:market_concession}}, o Mercado Municipal ganhou piso novo, banheiros e estacionamento. " +
              "Os antigos feirantes, porém, dizem que o aluguel dobrou. \"Ficou bonito pra quem pode\", resume Dona Neusa, há 30 anos na banca de temperos.",
          ),
        ],
      },
    ],
    delivers: 6,
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
    hint: { text: "O Diário Oficial vai mostrar o que todo mundo desconfia: obras pelo dobro do preço.", by: ["faoro"] },
  },

  // ------------------------------------------------------------ naive versions (books unlock the smarter ones)
  cesta_basica: {
    title: "Cesta Básica Municipal",
    summary: "Uma cesta de alimentos por mês para as famílias do morro e da periferia. Rápido, visível, e o dinheiro não dura para sempre.",
    topics: ["charity", "housing"],
    councilSupport: 55,
    cost: 4,
    onPass: [
      opinion("periphery", 9, "Distribuiu cestas básicas"),
      opinion("religious", 5, "Distribuiu cestas básicas"),
      expectations(12),
    ],
    followUps: [
      {
        inTurns: 12,
        label: "Acaba o dinheiro da Cesta Básica Municipal",
        effects: [
          opinion("periphery", -10, "A cesta básica acabou"),
          opinion("religious", -4, "A cesta básica acabou"),
          newspaper(
            "news_cesta_end",
            "A CESTA ACABOU: FILAS VOLTAM À ASSOCIAÇÃO DE MORADORES",
            "O programa aprovado em {{date:cesta_basica}} encerrou as entregas por falta de verba. Nenhum emprego foi criado no período. " +
              "\"Ajudou enquanto durou\", diz Dona Lurdes Batista. \"Agora a gente está pior, porque se acostumou.\"",
          ),
        ],
      },
    ],
    delivers: 6,
    hint: { text: "Analistas preveem: quando a verba acabar, a cesta acaba, e nada fica no lugar.", by: ["keynes"] },
  },

  price_freeze: {
    title: "Tabelamento de Preços na Feira",
    summary: "Preço máximo para arroz, feijão e carne nas feiras da cidade. A dona de casa agradece. O feirante faz as contas.",
    topics: ["regulation", "wages"],
    councilSupport: 55,
    cost: 3,
    onPass: [opinion("retirees", 6, "Tabelou os preços da feira"), opinion("workers", 5, "Tabelou os preços da feira")],
    followUps: [
      {
        inTurns: 6,
        label: "Feirantes abandonam as feiras tabeladas",
        effects: [
          opinion("retirees", -6, "As barracas da feira ficaram vazias"),
          opinion("workers", -4, "As barracas da feira ficaram vazias"),
          opinion("business", -4, "Preço tabelado abaixo do custo"),
          { type: "neighbourhood", id: "centro", mood: -6 },
          newspaper(
            "news_price_freeze",
            "FEIRA TABELADA, BARRACA VAZIA",
            "Seis semanas depois do tabelamento aprovado em {{date:price_freeze}}, metade das barracas sumiu. Os feirantes dizem que vender " +
              "abaixo do custo não paga a viagem do interior. O feijão tabelado existe. Só não se acha.",
          ),
        ],
      },
    ],
    delivers: 6,
    hint: { text: "Analistas preveem: com preço abaixo do custo, os feirantes vão simplesmente parar de vir.", by: ["hayek"] },
  },

  contract_transparency_plus: {
    upgradeOf: "contract_transparency",
    title: "Transparência com Controle Social",
    summary: "Contratos publicados e um conselho de moradores com poder de fiscalizar obras. O patrimonialismo detesta testemunhas.",
    topics: ["transparency", "regulation"],
    councilSupport: 30,
    cost: 7,
    requires: { bookFinished: "faoro" },
    onPass: [
      opinion("students", 7, "Criou o controle social das obras"),
      opinion("periphery", 4, "Moradores fiscalizando obras"),
      opinion("retirees", 3, "Abriu os contratos da prefeitura"),
      { type: "relation", character: "donor", delta: -25 },
      { type: "relation", character: "journalist", delta: 15 },
      { type: "integrity", delta: 8 },
    ],
    followUps: [
      {
        inTurns: 6,
        label: "Conselho de moradores barra obra superfaturada",
        effects: [
          opinion("periphery", 4, "Moradores barraram obra superfaturada"),
          { type: "relation", character: "donor", delta: -10 },
          newspaper(
            "news_social_control",
            "MORADORES BARRAM OBRA SUPERFATURADA",
            "O conselho criado em {{date:contract_transparency_plus}} encontrou um contrato de recapeamento pelo triplo do preço de mercado. " +
              "A obra foi suspensa. A empreiteira não quis comentar.",
          ),
        ],
      },
    ],
    delivers: 8,
  },

  // ------------------------------------------------------------ tempting: they look like progress
  beach_overpass: {
    title: "Viaduto do Jardim Atlântico",
    summary: "Um viaduto moderno ligando a orla ao Centro. Cartão-postal de cidade grande, obra que todo mundo vê.",
    topics: ["construction"],
    councilSupport: 55,
    cost: 5,
    onPass: [
      opinion("business", 8, "Aprovou o viaduto da orla"),
      opinion("retirees", 3, "Aprovou o viaduto da orla"),
      { type: "capital", delta: 2 },
      { type: "relation", character: "donor", delta: 10 },
      { type: "neighbourhood", id: "jardim_atlantico", mood: 8, addMarker: "construction" },
    ],
    followUps: [
      {
        inTurns: 10,
        label: "Verba do viaduto sai das linhas de ônibus do Morro e do posto de saúde",
        effects: [
          opinion("periphery", -9, "Perdeu ônibus e posto de saúde para o viaduto"),
          opinion("workers", -3, "Ônibus cortados para pagar o viaduto"),
          { type: "neighbourhood", id: "morro_esperanca", mood: -12 },
          { type: "neighbourhood", id: "jardim_atlantico", removeMarker: "construction" },
          newspaper(
            "news_overpass_cost",
            "O VIADUTO DA ORLA E O POSTO QUE FECHOU NO MORRO",
            "Para cobrir o custo do viaduto aprovado em {{date:beach_overpass}}, a prefeitura remanejou verbas de duas linhas de ônibus do " +
              "Morro da Esperança e do posto de saúde da comunidade. A obra ficou com a Teixeira Construções.",
          ),
        ],
      },
    ],
    delivers: 4,
    hint: { text: "Quem lê o orçamento sabe: o dinheiro do viaduto vai sair dos ônibus e da saúde do morro.", by: ["keynes", "faoro"] },
  },

  downtown_revitalization: {
    title: "Revitalização do Centro",
    summary: "Calçadas novas, fachadas pintadas e ordem nas ruas do Centro histórico.",
    topics: ["construction", "safety"],
    councilSupport: 55,
    cost: 4,
    onPass: [opinion("business", 7, "Revitalizou o Centro"), opinion("retirees", 3, "Revitalizou o Centro"), { type: "neighbourhood", id: "centro", mood: 8 }],
    followUps: [
      {
        inTurns: 3,
        label: "Fiscais retiram os camelôs do Centro revitalizado",
        effects: [
          opinion("workers", -5, "Camelôs expulsos do Centro"),
          opinion("periphery", -6, "Camelôs expulsos do Centro"),
          { type: "neighbourhood", id: "centro", addMarker: "protest" },
          newspaper(
            "news_camelos",
            "CENTRO BONITO, CAMELÔ NA RUA",
            "A revitalização aprovada em {{date:downtown_revitalization}} veio acompanhada de fiscais. Duzentos camelôs perderam o ponto. " +
              "\"Pintaram a fachada e apagaram a gente\", disse um vendedor de frutas da Rua Direita.",
          ),
        ],
      },
    ],
    delivers: 4,
    hint: { text: "Quem conhece a cidade sabe: \"ordem nas ruas\" quer dizer tirar os camelôs.", by: ["keynes", "faoro"] },
  },

  // ------------------------------------------------------------ offers: only if Teixeira brings them
  emergency_paving: {
    offer: true,
    title: "Asfaltamento Emergencial",
    summary: "Asfalto em caráter de urgência na Vila Operária, sem licitação. A empresa já está escolhida.",
    topics: ["construction"],
    councilSupport: 55,
    cost: 4,
    requires: { ref: "flag:offered_emergency_paving", op: ">=", value: 1 },
    onPass: [
      opinion("workers", 5, "Asfaltou a Vila Operária"),
      { type: "neighbourhood", id: "vila_operaria", mood: 6 },
      { type: "funds", delta: 20, source: "dirty" },
      { type: "relation", character: "donor", delta: 10 },
      { type: "dossier", id: "emergency_paving", label: "Comissão no asfaltamento emergencial sem licitação", threads: 2 },
    ],
    followUps: [
      {
        inTurns: 8,
        label: "O asfalto emergencial racha na Vila Operária",
        effects: [
          opinion("workers", -6, "O asfalto novo rachou"),
          { type: "neighbourhood", id: "vila_operaria", mood: -8 },
          { type: "thread", id: "emergency_paving", add: 1 },
          newspaper(
            "news_paving_cracks",
            "ASFALTO DE URGÊNCIA RACHA EM OITO SEMANAS",
            "O asfaltamento sem licitação aprovado em {{date:emergency_paving}} já está cheio de rachaduras. O metro quadrado custou o dobro " +
              "da média da cidade. A empresa contratada pertence ao grupo Teixeira.",
          ),
        ],
      },
    ],
    delivers: 5,
  },

  morro_rezoning: {
    offer: true,
    title: "Rezoneamento da Mata do Morro",
    summary: "Libera a encosta de mata do Morro da Esperança para um condomínio. Mais imposto, mais emprego na obra.",
    topics: ["construction", "deregulation"],
    councilSupport: 50,
    cost: 5,
    requires: { ref: "flag:offered_morro_rezoning", op: ">=", value: 1 },
    onPass: [
      opinion("business", 6, "Liberou a encosta para construção"),
      { type: "funds", delta: 30, source: "dirty" },
      { type: "relation", character: "donor", delta: 20 },
      { type: "dossier", id: "morro_rezoning", label: "Propina pelo rezoneamento da mata do Morro", threads: 3 },
      { type: "neighbourhood", id: "morro_esperanca", addMarker: "construction" },
    ],
    // The landslide is an event (events.ts): it comes when the cut slope meets the rainy season. Never by chance.
    followUps: [{ inTurns: 6, label: "Tratores derrubam a mata da encosta do Morro", effects: [{ type: "flag", key: "morro_deforested", set: 1 }] }],
    delivers: 3,
  },

  school_lunch_contract: {
    offer: true,
    title: "Merenda Escolar Terceirizada",
    summary: "A merenda das escolas municipais passa para uma empresa privada. Mais eficiência, diz o projeto.",
    topics: ["privatisation", "education"],
    councilSupport: 50,
    cost: 4,
    requires: { ref: "flag:offered_school_lunch_contract", op: ">=", value: 1 },
    onPass: [
      opinion("business", 4, "Terceirizou a merenda"),
      { type: "funds", delta: 15, source: "dirty" },
      { type: "relation", character: "donor", delta: 8 },
      { type: "dossier", id: "school_lunch_contract", label: "Comissão no contrato da merenda escolar", threads: 2 },
    ],
    followUps: [
      {
        inTurns: 6,
        label: "Merenda terceirizada piora nas escolas",
        effects: [
          opinion("students", -6, "A merenda piorou"),
          opinion("periphery", -6, "A merenda piorou"),
          newspaper(
            "news_school_lunch",
            "BOLACHA E SUCO EM PÓ: A NOVA MERENDA DAS ESCOLAS",
            "Desde a terceirização aprovada em {{date:school_lunch_contract}}, o almoço quente virou lanche nas escolas municipais. " +
              "Professoras relatam crianças desmaiando de fome no Morro. O contrato custa mais que a merenda antiga.",
          ),
        ],
      },
    ],
    delivers: 3,
  },
} as const satisfies Record<string, LawDef>;

export type LawId = keyof typeof LAWS;
export const LAW_IDS = Object.keys(LAWS) as LawId[];
