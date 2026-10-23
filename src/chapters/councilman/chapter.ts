import { BALANCE } from "../../content/balance";
import { CHARACTERS, CHARACTER_IDS, type CharacterId } from "../../content/councilman/characters";
import { GROUP_IDS } from "../../content/councilman/groups";
import { NEIGHBOURHOODS, NEIGHBOURHOOD_IDS } from "../../content/councilman/neighbourhoods";
import { PARTIES, type PartyId } from "../../content/councilman/parties";
import type { ChapterDefinition, ChapterSetup } from "../../core/chapter";
import { readRef } from "../../core/conditions";
import { EVENTS } from "../../content/councilman/events";
import { expectationsPressure } from "../../core/hidden";
import type { Effect, GameState } from "../../core/types";
import { councilmanGoals, goalsMet } from "./goals";
import { LAW_IDS } from "../../content/councilman/laws";
import { capitalRule, readingRule, resolveCouncilmanDecision } from "./actions";
import { confessionRule, pressRule } from "./rules";

const C = BALANCE.councilman;

export const COUNCILMAN_ENDINGS = ["arrested", "expelled", "lost_support", "candidacy", "kingmaker", "passed_over"] as const;
export type CouncilmanEnding = (typeof COUNCILMAN_ENDINGS)[number];

function createInitialState({ playerName, party, form = "m" }: ChapterSetup): GameState {
  const p = PARTIES[party as PartyId];
  if (!p) throw new Error(`Unknown party "${party}"`);

  return {
    version: 2,
    chapterId: "councilman",
    turn: 1,
    party,
    player: { name: playerName, form, funds: C.startingFunds, capital: BALANCE.capital.start },
    groups: Object.fromEntries(GROUP_IDS.map((g) => [g, { baseline: p.startingOpinions[g], memories: [] }])),
    hidden: {
      integrity: BALANCE.hidden.integrityStart,
      expectations: BALANCE.hidden.expectationsStart,
      dossier: [],
    },
    characters: Object.fromEntries(CHARACTER_IDS.map((c) => [c, { relation: CHARACTERS[c].startingRelation }])),
    neighbourhoods: Object.fromEntries(
      NEIGHBOURHOOD_IDS.map((n) => [n, { mood: NEIGHBOURHOODS[n].startingMood, base: 0, markers: [] }]),
    ),
    laws: Object.fromEntries(LAW_IDS.map((l) => [l, "draft" as const])),
    books: { reading: null, finished: [] },
    queue: [],
    inbox: [
      {
        id: "welcome",
        kind: "letter",
        from: "mentor",
        title: "Bem-vind" + (form === "f" ? "a" : "o") + " à Câmara, garot" + (form === "f" ? "a" : "o"),
        body:
          `Parabéns pela eleição, ${playerName}. Você entrou com a última vaga, então não deixe isso subir à cabeça.\n\n` +
          `É assim que funciona. Toda semana você consegue fazer três coisas: um projeto de lei, uma reunião, uma caminhada nos bairros, ` +
          `uma entrevista na rádio, um capítulo de um bom livro. Os papéis vão se acumular nesta mesa; responda, eles não se respondem sozinhos.\n\n` +
          `Agora, o que importa. Na semana ${C.conventionWeek}, a convenção do ${p.short} escolhe quem disputa a prefeitura. ` +
          `Para a escolha cair em você, precisa chegar lá com as três coisas ao mesmo tempo:\n\n` +
          `• A cúpula do partido confiando em você (${p.boss.name} decide)\n` +
          `• ${C.fundsNeeded} mil no caixa de campanha\n` +
          `• Pelo menos ${C.groupsNeeded} grupos da cidade do seu lado\n\n` +
          `Falta uma, e o partido escolhe outro. A partir da semana ${C.nominationOpensWeek} dá para pedir a indicação antes da convenção. ` +
          `Deixei um bilhete na sua mesa, "Rumo à prefeitura", para você não esquecer.\n\nParece simples. Nunca é.\n\n— Otávio`,
        turn: 1,
      },
    ],
    history: [],
    firedEvents: [],
    flags: {},
    ending: null,
  };
}

/** Game-over checks first (a scandal can still sink a candidacy), then the convention. */
function checkEnding(state: GameState): CouncilmanEnding | null {
  if (readRef(state, "exposedThreads") >= C.arrestAtExposedThreads) return "arrested";
  if (readRef(state, "relation:party_boss") <= C.expelledAtBossRelation) return "expelled";
  if (readRef(state, "averageOpinion") <= C.lostSupportAtAverageOpinion) return "lost_support";
  // Asking for the nomination early, with everything in place, wins it.
  if (state.flags.sought_nomination === 1 && goalsMet(state)) return "candidacy";
  if (state.turn >= C.conventionWeek) {
    if (goalsMet(state)) return "candidacy";
    if (state.flags.backed_rival) return "kingmaker";
    return "passed_over";
  }
  return null;
}

/**
 * Four weeks before the convention, the party boss writes saying exactly what's
 * still missing. A defeat you were warned about is fair; a surprise is not.
 */
function conventionWarningRule(state: GameState): Effect[] {
  if (state.turn !== C.conventionWeek - C.conventionWarningWeeks || state.flags.convention_warned) return [];
  const missing = councilmanGoals(state).filter((g) => !g.met);
  const body = missing.length
    ? "A convenção escolhe o candidato à prefeitura daqui a quatro semanas. Seu nome está na mesa, mas falta:\n\n" +
      missing.map((g) => `• ${g.label}: ${g.progress}`).join("\n") +
      "\n\nQuatro semanas. Use bem."
    : "A convenção escolhe o candidato à prefeitura daqui a quatro semanas. Você tem a cúpula, o dinheiro e o povo. Não estrague tudo agora.";
  return [
    { type: "flag", key: "convention_warned", set: 1 },
    {
      type: "deskItem",
      item: {
        id: "convention_warning",
        kind: "letter",
        from: "party_boss",
        expression: missing.length ? "suspicious" : "pleased",
        title: "Convenção em quatro semanas",
        body,
        turn: state.turn,
      },
    },
  ];
}

/** Asked for the nomination but something slipped the same week: the party says "not yet". */
function nominationRule(state: GameState): Effect[] {
  if (state.flags.sought_nomination !== 1 || goalsMet(state)) return [];
  return [
    { type: "flag", key: "sought_nomination", set: 0 },
    {
      type: "deskItem",
      item: {
        id: `nomination_refused@${state.turn}`,
        kind: "letter",
        from: "party_boss",
        expression: "neutral",
        title: "Ainda não",
        body: "A cúpula discutiu seu nome. Cedo demais, foi a conclusão. Volte quando tiver tudo no lugar: o partido, o dinheiro e o povo.",
        turn: state.turn,
      },
    },
  ];
}

export const councilmanChapter: ChapterDefinition = {
  id: "councilman",
  createInitialState,

  validateDecisions(state, decisions) {
    // Planning a scheme answers a paper on the desk; it doesn't use up the agenda.
    const agenda = decisions.filter((d) => d.kind !== "scheme");
    if (agenda.length > BALANCE.turn.agendaSlots) {
      throw new Error(`Só dá para fazer ${BALANCE.turn.agendaSlots} coisas por semana`);
    }
    const count = (kind: string) => decisions.filter((d) => d.kind === kind).length;
    if (count("media") > BALANCE.media.maxPerWeek) throw new Error("Só uma aparição na mídia por semana");
    if (count("read") > 1) throw new Error("Só dá para começar um livro por semana");

    const met = decisions.filter((d) => d.kind === "meeting").map((d) => d.with as string);
    if (new Set(met).size !== met.length) throw new Error("Uma reunião por pessoa por semana");
    for (const who of met) {
      if (state.inbox.some((i) => i.from === who && i.choices?.length)) {
        throw new Error(`Responda o último papel de ${who === "party_boss" ? "seu partido" : CHARACTERS[who as CharacterId].name} antes de pedir outra reunião`);
      }
    }
    const schemes = decisions.filter((d) => d.kind === "scheme").map((d) => d.itemId);
    if (new Set(schemes).size !== schemes.length) throw new Error("Um plano por esquema");
    if (decisions.some((d) => d.kind === "seekNomination")) {
      if (state.turn < C.nominationOpensWeek) throw new Error(`As pré-candidaturas só abrem na semana ${C.nominationOpensWeek}`);
      if (!goalsMet(state)) throw new Error("Você ainda não reúne as três condições para pedir a indicação");
    }
    if (count("fundraise") > 1) throw new Error("Uma vaquinha por semana");
    const laws = decisions.filter((d) => d.kind === "proposeLaw").map((d) => d.law);
    if (new Set(laws).size !== laws.length) throw new Error("Cada projeto só pode ser proposto uma vez");
  },

  resolveDecision: resolveCouncilmanDecision,

  weeklyRules(state) {
    return [
      ...readingRule(state),
      ...capitalRule(state),
      ...nominationRule(state),
      ...conventionWarningRule(state),
      ...expectationsPressure(state),
      // Confession first: once everything is out, there's nothing left to dig.
      ...(state.flags.confess === 1 ? confessionRule(state) : pressRule(state)),
    ];
  },

  events: EVENTS,
  checkEnding,
};
