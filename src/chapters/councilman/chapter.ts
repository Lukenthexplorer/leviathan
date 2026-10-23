import { BALANCE } from "../../content/balance";
import { CHARACTERS, CHARACTER_IDS, type CharacterId } from "../../content/councilman/characters";
import { GROUP_IDS } from "../../content/councilman/groups";
import { NEIGHBOURHOODS, NEIGHBOURHOOD_IDS } from "../../content/councilman/neighbourhoods";
import { PARTIES, type PartyId } from "../../content/councilman/parties";
import type { ChapterDefinition, ChapterSetup } from "../../core/chapter";
import { readRef } from "../../core/conditions";
import { EVENTS } from "../../content/councilman/events";
import { expectationsPressure } from "../../core/hidden";
import type { GameState } from "../../core/types";
import { LAW_IDS } from "../../content/councilman/laws";
import { readingRule, resolveCouncilmanDecision } from "./actions";
import { confessionRule, pressRule } from "./rules";

const C = BALANCE.councilman;

export const COUNCILMAN_ENDINGS = ["arrested", "expelled", "lost_support", "candidacy"] as const;
export type CouncilmanEnding = (typeof COUNCILMAN_ENDINGS)[number];

function createInitialState({ playerName, party, form = "m" }: ChapterSetup): GameState {
  const p = PARTIES[party as PartyId];
  if (!p) throw new Error(`Unknown party "${party}"`);

  return {
    version: 1,
    chapterId: "councilman",
    turn: 1,
    party,
    player: { name: playerName, form, funds: C.startingFunds },
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
          `um post, um capítulo de um bom livro. Os papéis vão se acumular nesta mesa; responda, eles não se respondem sozinhos.\n\n` +
          `Daqui a dois anos o partido escolhe quem vai disputar a prefeitura. Conquiste a cúpula, encha o caixa de campanha e ` +
          `ponha o povo do seu lado. Três coisas. Parece simples.\n\nNunca é.\n\n— Otávio`,
        turn: 1,
      },
    ],
    history: [],
    firedEvents: [],
    flags: {},
    ending: null,
  };
}

function checkEnding(state: GameState): CouncilmanEnding | null {
  if (readRef(state, "exposedThreads") >= C.arrestAtExposedThreads) return "arrested";
  if (readRef(state, "relation:party_boss") <= C.expelledAtBossRelation) return "expelled";
  if (readRef(state, "averageOpinion") <= C.lostSupportAtAverageOpinion) return "lost_support";
  return null;
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
    if (count("post") > BALANCE.social.maxPostsPerWeek) throw new Error("Só um post por semana");
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
    const laws = decisions.filter((d) => d.kind === "proposeLaw").map((d) => d.law);
    if (new Set(laws).size !== laws.length) throw new Error("Cada projeto só pode ser proposto uma vez");
  },

  resolveDecision: resolveCouncilmanDecision,

  weeklyRules(state) {
    return [
      ...readingRule(state),
      ...expectationsPressure(state),
      // Confession first: once everything is out, there's nothing left to dig.
      ...(state.flags.confess === 1 ? confessionRule(state) : pressRule(state)),
    ];
  },

  events: EVENTS,
  checkEnding,
};
