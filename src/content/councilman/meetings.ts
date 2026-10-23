import { dirtyFunds, expectations, flag, funds, integrity, opinion, relation } from "../helpers";
import type { MeetingDef } from "../types";

/**
 * Meetings the player can request. For each character, the FIRST meeting whose
 * `when` holds (and that hasn't happened yet, unless repeatable) is the one that
 * lands on the desk. Order matters: put special meetings before small talk.
 *
 * Nothing here says "corrupt" or "honest". The temptation is just... an offer.
 */
export const MEETINGS: MeetingDef[] = [
  // ------------------------------------------------------------ donor
  {
    id: "donor_first_offer",
    with: "donor",
    title: "Almoço com Augusto Teixeira",
    body:
      "Teixeira pede pelos dois sem perguntar. \"Campanha é cara, {{g:vereador/vereadora}}. Gosto de ajudar gente jovem com futuro. " +
      "Meu contador pode fazer uma contribuição... discreta. Ou oficial, se você gosta de papelada.\"",
    choices: [
      {
        id: "cash",
        label: "Aceitar a contribuição discreta",
        hint: { text: "Quem paga por fora não está doando: está comprando. A conta vem depois.", by: ["machiavelli", "faoro"] },
        // Taking the money is only the start: now it has to be hidden (see schemes.ts).
        effects: [
          relation("donor", 20),
          flag("took_dirty_money"),
          {
            type: "deskItem",
            item: {
              id: "plan_teixeira_donation",
              kind: "scheme",
              scheme: "teixeira_donation",
              from: "donor",
              title: "Plano: o dinheiro do Teixeira",
              body: "40 mil, sem declarar, prontos na sexta. O dinheiro precisa chegar à campanha sem encostar no seu nome.",
              turn: 0,
            },
          },
        ],
      },
      {
        id: "declared",
        label: "Aceitar, mas declarar oficialmente",
        effects: [funds(15), integrity(-2), relation("donor", 5), flag("owes_teixeira")],
      },
      {
        id: "hayek_pitch",
        label: "Falar de reforma de mercado em vez de dinheiro",
        requires: { bookFinished: "hayek" },
        effects: [relation("donor", 10), funds(10), opinion("business", 4, "Visão pró-negócios")],
      },
      { id: "refuse", label: "Recusar educadamente", effects: [relation("donor", -15), integrity(3)] },
    ],
  },
  {
    id: "donor_favour",
    with: "donor",
    when: { any: [{ ref: "flag:took_dirty_money", op: ">=", value: 1 }, { ref: "flag:owes_teixeira", op: ">=", value: 1 }] },
    title: "Teixeira cobra um favor",
    body:
      "\"A licitação do anel viário vai à Câmara mês que vem. Minha empresa é a mais qualificada, obviamente. " +
      "Eu detestaria ver um amigo votando contra outro amigo.\"",
    choices: [
      {
        id: "vote_for",
        label: "Prometer seu voto",
        hint: { text: "Um voto vendido uma vez é um voto que ele vai querer de novo, e um segredo que ele guarda.", by: ["machiavelli", "faoro"] },
        effects: [
          dirtyFunds(20),
          integrity(-10),
          relation("donor", 15),
          { type: "dossier", id: "ring_road_vote", label: "Voto vendido na licitação do anel viário", threads: 2 },
        ],
      },
      { id: "decline", label: "Dizer que vai julgar pelo mérito", effects: [relation("donor", -25), integrity(4)] },
    ],
  },
  {
    id: "donor_smalltalk",
    with: "donor",
    repeatable: true,
    title: "Cafezinho com o Teixeira",
    body: "Teixeira fala dos netos, do iate e de quanto a cidade deve a empreiteiros como ele.",
    choices: [{ id: "listen", label: "Ouvir com educação", effects: [relation("donor", 3)] }],
    variants: [
      {
        when: { ref: "flag:hid_donation", op: ">=", value: 1 },
        body: "Teixeira te abraça como se você fosse da família. \"Nosso amigo em comum manda lembranças.\" Ele não diz quem. Nem precisa.",
      },
    ],
  },

  // ------------------------------------------------------------ party boss
  {
    id: "boss_loyalty",
    with: "party_boss",
    title: "Convocação da sede do partido",
    body: "\"Quem chega na Câmara ou aprende a votar com a bancada, ou aprende a ficar sozinho. Qual dos dois é você?\"",
    choices: [
      { id: "loyal", label: "Jurar seguir a linha do partido", effects: [relation("party_boss", 12), flag("party_line")] },
      {
        id: "independent",
        label: "Dizer que vai votar com a consciência",
        effects: [relation("party_boss", -8), integrity(2), opinion("students", 3, "Enfrentou os caciques do partido")],
      },
    ],
  },
  {
    id: "boss_smalltalk",
    with: "party_boss",
    repeatable: true,
    title: "Relatório na sede do partido",
    body: "Você conta como foi a semana. A chefia escuta, anota e não diz nada que se possa citar.",
    choices: [{ id: "report", label: "Mostrar lealdade", effects: [relation("party_boss", 4)] }],
  },

  // ------------------------------------------------------------ mentor
  {
    id: "mentor_lessons",
    with: "mentor",
    title: "A lição do Otávio",
    body:
      "Otávio serve duas cachaças. \"O plenário é teatro, garot{{g:o/a}}. Voto se decide no corredor. " +
      "Posso te apresentar a quem importa. Naquele prédio, todo mundo deve a todo mundo.\"",
    choices: [
      {
        id: "learn",
        label: "Me ensina como a Câmara funciona de verdade",
        effects: [relation("mentor", 8), flag("council_favours"), integrity(-3)],
      },
      {
        id: "ask_price",
        label: "E o que você ganha com isso, Otávio?",
        requires: { bookFinished: "machiavelli" },
        effects: [relation("mentor", -4), flag("knows_mentor_agenda"), flag("council_favours")],
      },
      { id: "own_way", label: "Vou fazer do meu jeito", effects: [relation("mentor", -6), integrity(2)] },
    ],
  },
  {
    id: "mentor_smalltalk",
    with: "mentor",
    repeatable: true,
    title: "Jantar com o Otávio",
    body: "Otávio conta histórias de guerra da Câmara dos anos 80. Metade deve ser verdade.",
    choices: [{ id: "listen", label: "Rir nas horas certas", effects: [relation("mentor", 4)] }],
    variants: [
      {
        when: { ref: "integrity", op: "<", value: 50 },
        body: "Otávio pede o vinho caro e diz que \"agora sim\" você entende como as coisas funcionam. Ele parece orgulhoso. Isso deveria te preocupar?",
      },
    ],
  },

  // ------------------------------------------------------------ community leader
  {
    id: "leader_hill",
    with: "community_leader",
    title: "Subindo o morro com Dona Lurdes",
    body:
      "Dona Lurdes te leva por valas de esgoto a céu aberto. \"De quatro em quatro anos alguém sobe aqui e promete saneamento. " +
      "O que {{g:o senhor/a senhora}} vai me prometer?\"",
    choices: [
      {
        id: "promise",
        label: "Prometer saneamento em um ano",
        effects: [expectations(12), opinion("periphery", 8, "Prometeu saneamento"), relation("community_leader", 12), flag("promised_sanitation")],
      },
      {
        id: "honest",
        label: "\"Não posso prometer. Mas vou lutar por isso.\"",
        effects: [relation("community_leader", 5), opinion("periphery", 2, "Falou com franqueza no morro")],
      },
      {
        id: "keynes_jobs",
        label: "Propor contratar moradores para obras públicas",
        requires: { bookFinished: "keynes" },
        effects: [relation("community_leader", 14), opinion("periphery", 5, "Empregos para o morro"), opinion("workers", 2, "Plano de empregos")],
      },
    ],
  },
  {
    id: "leader_smalltalk",
    with: "community_leader",
    repeatable: true,
    title: "Reunião da associação de moradores",
    body: "Cadeiras de plástico, refrigerante morno e uma longa lista de reclamações. Dona Lurdes observa como você escuta.",
    choices: [{ id: "listen", label: "Anotar cada reclamação", effects: [relation("community_leader", 4), opinion("periphery", 1, "Escutou")] }],
  },

  // ------------------------------------------------------------ rival
  {
    id: "rival_coffee",
    with: "rival",
    title: "Café com Renata Saldanha",
    body: "Renata mexe o café devagar. \"Somos as duas únicas pessoas com menos de quarenta naquele prédio. A gente podia se ajudar. Ou não.\"",
    choices: [
      { id: "ally", label: "Propor uma aliança", effects: [relation("rival", 10), flag("rival_ally")] },
      {
        id: "probe",
        label: "Puxar o assunto das finanças de campanha dela",
        requires: { bookFinished: "machiavelli" },
        effects: [relation("rival", -6), flag("rival_dirt")],
      },
      { id: "cold", label: "Manter a conversa cordial e distante", effects: [] },
    ],
  },
  {
    id: "rival_smalltalk",
    with: "rival",
    repeatable: true,
    title: "Conversa de corredor com a Renata",
    body: "Renata está simpática. Simpática demais, talvez.",
    choices: [{ id: "chat", label: "Trocar fofocas da Câmara", effects: [relation("rival", 3)] }],
  },
];
