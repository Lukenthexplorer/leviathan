import type { EventDef } from "../../core/chapter";
import { flag, funds, integrity, opinion, relation } from "../helpers";

/**
 * Events: things that happen TO the player. Every trigger is a condition on
 * the state, never chance. Variants change a character's words and face
 * according to hidden variables: this is how hidden morality leaks out.
 *
 * Templates ({{worst:students}}, {{date:media_populist}}, {{g:o/a}}...) let
 * newspapers name the player's own earlier decision. See core/text.ts.
 */
export const EVENTS: EventDef[] = [
  // =============================================================== the Mentor
  {
    id: "mentor_checkin",
    trigger: { ref: "turn", op: ">=", value: 4 },
    item: {
      id: "mentor_checkin",
      kind: "letter",
      from: "mentor",
      expression: "neutral",
      title: "Um bilhete do Otávio",
      body:
        "Garot{{g:o/a}}, um conselho. Você está fazendo amizade com as pessoas erradas: os eleitores. Eleitor esquece. " +
        "O partido lembra. Venha me ver quando estiver pront{{g:o/a}} para aprender como as coisas são feitas de verdade.",
      choices: [
        { id: "thanks", label: "Agradecer o conselho", effects: [relation("mentor", 4)] },
        { id: "nomination", label: "Perguntar o que é preciso para ganhar a indicação", effects: [relation("mentor", 2), flag("mentor_explained")] },
      ],
    },
    variants: [
      {
        when: { ref: "integrity", op: "<", value: 55 },
        expression: "pleased",
        body:
          "Garot{{g:o/a}}! O Teixeira me disse que você é uma pessoa razoável. Eu sempre soube. " +
          "Fica comigo e a indicação é mera formalidade. A gente cuida dos nossos.",
      },
    ],
  },
  {
    id: "mentor_favour",
    trigger: { all: [{ ref: "turn", op: ">=", value: 9 }, { ref: "relation:mentor", op: ">=", value: 20 }] },
    item: {
      id: "mentor_favour",
      kind: "letter",
      from: "mentor",
      expression: "pleased",
      title: "O sobrinho do Otávio",
      body:
        "O filho da minha irmã, o Juninho, precisa de um emprego. Nada pesado. Um cargo no seu gabinete, um salário, " +
        "nem precisa aparecer às sextas. Nem às segundas. Seria uma gentileza enorme com um velho amigo.",
      choices: [
        {
          id: "hire",
          label: "Colocar o Juninho na folha",
          effects: [
            relation("mentor", 15),
            integrity(-8),
            flag("hired_nephew"),
            { type: "dossier", id: "nephew_payroll", label: "Sobrinho do Otávio como funcionário fantasma", threads: 2 },
          ],
        },
        {
          id: "see_through",
          label: "\"Eu sei exatamente o que é isso, Otávio.\"",
          requires: { bookFinished: "machiavelli" },
          effects: [relation("mentor", -5), relation("party_boss", 5), flag("mentor_respects")],
        },
        { id: "refuse", label: "Recusar, com toda a gentileza possível", effects: [relation("mentor", -15), integrity(2)] },
      ],
    },
  },
  {
    id: "mentor_drifts",
    trigger: { all: [{ ref: "turn", op: ">=", value: 12 }, { ref: "relation:mentor", op: "<=", value: -10 }] },
    onFire: [relation("party_boss", -8), relation("rival", 5)],
    item: {
      id: "mentor_drifts",
      kind: "report",
      title: "Fofoca de corredor",
      body:
        "Seu assessor ouviu na máquina de café: Otávio Brandão anda dizendo para quem quiser ouvir " +
        "que Renata Saldanha é \"o futuro do partido\". A chefia do partido estava na sala.",
    },
  },

  // =============================================================== the Rival
  {
    id: "rival_credit",
    trigger: {
      all: [{ ref: "flag:laws_passed", op: ">=", value: 1 }, { ref: "turn", op: ">=", value: 5 }, { ref: "relation:rival", op: "<", value: 15 }],
    },
    item: {
      id: "rival_credit",
      kind: "phone",
      from: "rival",
      expression: "pleased",
      title: "A Renata está no rádio",
      body:
        "Seu assessor aumenta o rádio. Renata Saldanha explica, com carinho e em detalhes, " +
        "como lutou pelo projeto que você escreveu. O apresentador a chama de \"a vereadora que faz acontecer\".",
      choices: [
        {
          id: "confront",
          label: "Ligar para a rádio e esclarecer a história",
          effects: [relation("rival", -15), opinion("students", 2, "Defendeu o próprio trabalho"), relation("party_boss", -3)],
        },
        { id: "let_go", label: "Deixar pra lá. Vão ter outros projetos.", effects: [relation("rival", 5), flag("let_rival_credit")] },
        {
          id: "leak",
          label: "Vazar o que você sabe sobre o dinheiro de campanha dela",
          requires: { ref: "flag:rival_dirt", op: ">=", value: 1 },
          effects: [relation("rival", -25), integrity(-5), relation("journalist", 10), flag("leaked_rival")],
        },
      ],
    },
  },
  {
    id: "rival_pact",
    trigger: { all: [{ ref: "flag:rival_ally", op: ">=", value: 1 }, { ref: "turn", op: ">=", value: 12 }] },
    item: {
      id: "rival_pact",
      kind: "letter",
      from: "rival",
      expression: "neutral",
      title: "Uma proposta da Renata",
      body:
        "\"Vamos ser adultos. Só um de nós leva a indicação desta vez. Me apoia, e quando eu for prefeita " +
        "você preside esta Câmara. Na próxima, é a sua vez. Eu cumpro minha palavra.\"",
      choices: [
        { id: "accept", label: "Apertar a mão dela", effects: [relation("rival", 15), relation("party_boss", -6), flag("backed_rival")] },
        { id: "decline", label: "\"Que vença a melhor candidatura.\"", effects: [relation("rival", -12)] },
      ],
    },
  },
  {
    id: "rival_tipoff",
    trigger: { all: [{ ref: "relation:rival", op: "<=", value: -20 }, { ref: "unexposedThreads", op: ">=", value: 1 }] },
    onFire: [{ type: "flag", key: "investigation", add: 35 }, flag("rival_leaked_you")],
    item: {
      id: "rival_tipoff",
      kind: "phone",
      from: "journalist",
      expression: "suspicious",
      title: "Helena Vaz na linha",
      body:
        "\"{{g:Vereador/Vereadora}}. Alguém deixou um envelope no jornal hoje de manhã. Sem nome. " +
        "Papéis muito interessantes sobre as suas finanças. Quer comentar antes de eu começar a fazer ligações?\"",
      choices: [
        { id: "no_comment", label: "\"Sem comentários.\"", effects: [relation("journalist", -5)] },
        { id: "who", label: "\"Pergunta pra Renata Saldanha onde ela conseguiu isso.\"", effects: [relation("journalist", -2), relation("rival", -10)] },
      ],
    },
  },

  // =============================================================== the Journalist
  {
    id: "journalist_profile",
    trigger: { ref: "turn", op: ">=", value: 3 },
    item: {
      id: "journalist_profile",
      kind: "letter",
      from: "journalist",
      expression: "neutral",
      title: "Pedido de entrevista: Correio de Porto Ferro",
      body:
        "{{g:Vereador/Vereadora}}, o Correio está fazendo perfis dos novos membros da Câmara. Quem você é, no que acredita, " +
        "quem pagou sua campanha. O de sempre. Trinta minutos do seu tempo? — Helena Vaz",
      choices: [
        {
          id: "grant",
          label: "Dar a entrevista",
          effects: [relation("journalist", 10), opinion("students", 2, "Uma entrevista inteligente"), opinion("retirees", 2, "Uma entrevista inteligente")],
        },
        { id: "decline", label: "Sem tempo, desculpe", effects: [relation("journalist", -8)] },
        {
          id: "off_record",
          label: "Em off: apontar ela para os financiadores da Renata",
          requires: { ref: "flag:rival_dirt", op: ">=", value: 1 },
          effects: [relation("journalist", 12), relation("rival", -15), flag("leaked_rival")],
        },
      ],
    },
    variants: [
      {
        when: { ref: "unexposedThreads", op: ">=", value: 1 },
        expression: "suspicious",
        body:
          "{{g:Vereador/Vereadora}}, o Correio está fazendo perfis dos novos membros da Câmara. Tenho interesse especial nas " +
          "suas finanças de campanha. Dinheiro de empreiteira, principalmente, pelo que ouvi. Trinta minutos? Eu detestaria escrever sem ouvir o seu lado. — H. Vaz",
      },
    ],
  },
  {
    id: "journalist_sniffing",
    trigger: { all: [{ ref: "flag:investigation", op: ">=", value: 40 }, { ref: "unexposedThreads", op: ">=", value: 1 }] },
    item: {
      id: "journalist_sniffing",
      kind: "phone",
      from: "journalist",
      expression: "suspicious",
      title: "Helena Vaz, de novo",
      body:
        "\"Estou seguindo um dinheiro, {{g:vereador/vereadora}}. Ele vive passando pela porta do seu gabinete. " +
        "Vou publicar quando conseguir provar. Você podia poupar o tempo de nós duas.\"",
      choices: [
        { id: "deny", label: "Negar tudo", effects: [relation("journalist", -10), flag("lied_to_press")] },
        { id: "confess", label: "Abrir o jogo. Contar tudo.", effects: [relation("journalist", 15), flag("confess")] },
        { id: "threaten", label: "Mencionar seus advogados. E as dívidas do editor dela.", effects: [relation("journalist", -25), integrity(-5), flag("threatened_press")] },
      ],
    },
  },
  {
    id: "journalist_ally",
    trigger: {
      all: [
        { ref: "turn", op: ">=", value: 8 },
        { ref: "relation:journalist", op: ">=", value: 15 },
        { ref: "dossierThreads", op: "==", value: 0 },
        { ref: "integrity", op: ">=", value: 60 },
      ],
    },
    onFire: [flag("rival_dirt")],
    item: {
      id: "journalist_ally",
      kind: "phone",
      from: "journalist",
      expression: "pleased",
      title: "Uma dica da Helena",
      body:
        "\"Você é das poucas pessoas naquele prédio sobre quem eu não tenho uma pasta. Então, um favor entre gente honesta: " +
        "veja quem pagou os panfletos da Renata Saldanha. Teixeira Construções. Você não ouviu isso de mim.\"",
      choices: [{ id: "thanks", label: "\"Te devo uma, Helena.\"", effects: [relation("journalist", 5)] }],
    },
  },

  // =============================================================== the Party
  {
    id: "boss_warning",
    trigger: { ref: "relation:party_boss", op: "<=", value: -25 },
    item: {
      id: "boss_warning",
      kind: "letter",
      from: "party_boss",
      expression: "angry",
      title: "Último aviso",
      body:
        "O partido te deu uma cadeira. O partido pode dar essa cadeira para outra pessoa. " +
        "Da próxima vez que você nos envergonhar, vai ler sobre a sua expulsão no Correio.",
      choices: [
        { id: "apologise", label: "Pedir desculpas e prometer votar com a bancada", effects: [relation("party_boss", 15), flag("party_line"), integrity(-2)] },
        { id: "firm", label: "Manter sua posição", effects: [relation("party_boss", -8), opinion("students", 3, "Enfrentou a máquina do partido")] },
      ],
    },
  },
  {
    id: "boss_fundraiser",
    trigger: { all: [{ ref: "turn", op: ">=", value: 8 }, { ref: "relation:party_boss", op: ">=", value: 20 }] },
    item: {
      id: "boss_fundraiser",
      kind: "letter",
      from: "party_boss",
      expression: "pleased",
      title: "Convite: jantar de arrecadação do partido",
      body: "Traje a rigor. Trezentos convidados, todos com talão de cheque. Sua mesa fica perto da frente. Isso significa alguma coisa.",
      choices: [
        { id: "attend", label: "Ir e circular pelo salão", effects: [funds(12), relation("party_boss", 4)] },
        { id: "skip", label: "Mandar suas desculpas", effects: [relation("party_boss", -3)] },
      ],
    },
  },

  // =============================================================== weak links breaking (conspiracy)
  {
    id: "mentor_leak",
    trigger: { all: [{ ref: "flag:mentor_knows", op: ">=", value: 1 }, { ref: "relation:mentor", op: "<=", value: -10 }, { ref: "exposed:teixeira_cash", op: "==", value: 0 }] },
    onFire: [{ type: "flag", key: "investigation", add: 40 }, { type: "thread", id: "teixeira_cash", add: 2 }],
    item: {
      id: "mentor_leak",
      kind: "report",
      title: "Visto no Bar Brasil",
      body:
        "Seu assessor viu Otávio Brandão num almoço comprido com Helena Vaz ontem. Era ele quem mais falava. " +
        "Ele sabe exatamente como o dinheiro do Teixeira chegou até você.",
    },
  },
  {
    id: "church_scandal",
    trigger: { all: [{ ref: "flag:laundered_church", op: ">=", value: 1 }, { ref: "exposed:teixeira_cash", op: "==", value: 1 }] },
    onFire: [{ type: "neighbourhood", id: "sao_bento", mood: -15, addMarker: "protest" }, opinion("religious", -15, "Usou um sopão para lavar dinheiro")],
    item: {
      id: "church_scandal",
      kind: "newspaper",
      title: "SOPÃO DE IGREJA FOI USADO PARA LAVAR DINHEIRO DE CAMPANHA",
      body:
        "O Pastor Gilmar Rocha chorou ao contar ao Correio que sua obra social foi \"usada como lavanderia\" por {{g:o vereador/a vereadora}} {{player}}. " +
        "Fiéis se reuniram em frente à catedral de São Bento ontem à noite. \"Demos de comer aos famintos com dinheiro roubado\", disse uma voluntária.",
    },
  },

  // =============================================================== crises (newspapers)
  {
    id: "crisis_students",
    trigger: { ref: "opinion:students", op: "<=", value: -15 },
    onFire: [
      { type: "neighbourhood", id: "cidade_universitaria", mood: -10, addMarker: "protest" },
      { type: "neighbourhood", id: "centro", addMarker: "protest" },
    ],
    item: {
      id: "crisis_students",
      kind: "newspaper",
      title: "ESTUDANTES MARCHAM ATÉ A CÂMARA",
      body:
        "Milhares de estudantes marcharam ontem da Cidade Universitária até as escadarias da Câmara Municipal, " +
        "gritando o nome {{g:do vereador/da vereadora}} {{player}}. Os organizadores citaram como a gota d'água: {{worst:students}}. " +
        "\"A gente lembra\", dizia uma faixa.",
    },
  },
  {
    id: "crisis_periphery",
    trigger: { ref: "opinion:periphery", op: "<=", value: -15 },
    onFire: [{ type: "neighbourhood", id: "morro_esperanca", mood: -10, addMarker: "protest" }],
    item: {
      id: "crisis_periphery",
      kind: "newspaper",
      title: "PNEUS QUEIMADOS FECHAM A AVENIDA: O MORRO ESTÁ REVOLTADO",
      body:
        "Moradores do Morro da Esperança bloquearam a avenida principal por seis horas. Lideranças comunitárias disseram ao Correio " +
        "que a revolta vem de: {{worst:periphery}}. \"Eles só sobem o morro para tirar foto.\"",
    },
  },
  {
    id: "crisis_business",
    trigger: { ref: "opinion:business", op: "<=", value: -35 },
    onFire: [relation("donor", -10)],
    item: {
      id: "crisis_business",
      kind: "newspaper",
      title: "ASSOCIAÇÃO COMERCIAL FECHA AS PORTAS PARA {{PLAYER}}",
      body:
        "A Associação Comercial de Porto Ferro votou por recusar qualquer reunião com {{g:o vereador/a vereadora}} {{player}}. " +
        "O presidente da entidade citou: {{worst:business}}. \"Toda loja da Rua Direita pagou por essa decisão.\"",
    },
  },
  {
    id: "crisis_religious",
    trigger: { ref: "opinion:religious", op: "<=", value: -20 },
    item: {
      id: "crisis_religious",
      kind: "newspaper",
      title: "DO PÚLPITO, UM ALERTA SOBRE {{g:O VEREADOR/A VEREADORA}}",
      body:
        "No domingo, pastores de quatro igrejas pediram às congregações que \"orassem pela consciência\" {{g:do vereador/da vereadora}} {{player}}. " +
        "Vários mencionaram: {{worst:religious}}.",
    },
  },
  {
    id: "crisis_retirees",
    trigger: { ref: "opinion:retirees", op: "<=", value: -20 },
    item: {
      id: "crisis_retirees",
      kind: "newspaper",
      title: "CARTAS DOS LEITORES: \"VOTEI. NUNCA MAIS.\"",
      body:
        "Nesta semana o Correio recebeu 143 cartas de aposentados sobre {{g:o vereador/a vereadora}} {{player}}, a maioria sobre: " +
        "{{worst:retirees}}. Publicamos uma seleção na página 6. Nenhuma é gentil.",
    },
  },
  {
    id: "crisis_workers",
    trigger: { ref: "opinion:workers", op: "<=", value: -15 },
    onFire: [{ type: "neighbourhood", id: "vila_operaria", mood: -8, addMarker: "protest" }],
    item: {
      id: "crisis_workers",
      kind: "newspaper",
      title: "SINDICATO DOS METALÚRGICOS: {{PLAYER}} 'NÃO É BEM-VIND{{g:O/A}}' NA VILA OPERÁRIA",
      body:
        "A assembleia do sindicato votou por unanimidade declarar {{g:o vereador/a vereadora}} {{player}} indesejad{{g:o/a}} nos portões da fábrica, " +
        "citando: {{worst:workers}}.",
    },
  },
  {
    id: "promises_crash",
    trigger: { ref: "flag:weeks_over_expectations", op: ">=", value: 4 },
    item: {
      id: "promises_crash",
      kind: "newspaper",
      title: "{{g:O VEREADOR/A VEREADORA}} QUE PROMETEU DEMAIS",
      body:
        "Desde {{date:media_populist}}, {{g:o vereador/a vereadora}} {{player}} fez {{flag:media_populist}} promessas em público, " +
        "do carro de som ao microfone das rádios. O Correio foi atrás dos resultados. Achou muito pouco. " +
        "Quem aplaudia nas esquinas agora repete outra coisa: a decepção.",
    },
  },
  {
    id: "rising_star",
    trigger: { all: [{ ref: "averageOpinion", op: ">=", value: 25 }, { ref: "turn", op: ">=", value: 6 }] },
    onFire: [relation("party_boss", 5)],
    item: {
      id: "rising_star",
      kind: "newspaper",
      title: "UMA ESTRELA EM ASCENSÃO NA CÂMARA?",
      body:
        "Com poucos meses de mandato, {{g:o vereador/a vereadora}} {{player}} é o nome na boca de Porto Ferro. " +
        "Fontes do partido, em off, não descartaram ambições maiores.",
    },
  },
];
