import { BOOKS, type BookId } from "../../content/councilman/books";
import { ENDINGS, type EndingTone } from "../../content/councilman/endings";
import { GROUPS, GROUP_IDS } from "../../content/councilman/groups";
import { NEIGHBOURHOODS, NEIGHBOURHOOD_IDS } from "../../content/councilman/neighbourhoods";
import { PARTIES, type PartyId } from "../../content/councilman/parties";
import { monthYear, weekDate } from "../../core/calendar";
import { allOpinions } from "../../core/groups";
import { fillTemplate, lowerFirst } from "../../core/text";
import type { GameState } from "../../core/types";

export interface LegacySection {
  title: string;
  paragraphs: string[];
}

/** The final page: a newspaper front page, then what history learned later. */
export interface Legacy {
  tone: EndingTone;
  date: string;
  kicker: string;
  headline: string;
  lede: string;
  sections: LegacySection[];
  /** Revealed only now: the hidden morality, in words. */
  verdict: LegacySection;
}

/** The hidden integrity score, finally put into words by "history". */
function verdictFor(integrity: number): string {
  if (integrity >= 70) return "Os historiadores concordam: foi uma carreira limpa, coisa rara no seu tempo. Custou caro. Quase ninguém percebeu na época.";
  if (integrity >= 45) return "Uma carreira com manchas. Pequenos favores, silêncios convenientes. A história perdoa, mas registra.";
  if (integrity >= 20) return "O padrão da época: favores trocados por votos, dinheiro que ninguém declarou, amigos nos lugares certos. Nada de extraordinário. Esse era o problema.";
  return "Um caso de estudo em corrupção municipal, citado até hoje em salas de aula. Tudo estava à venda, e quase tudo foi vendido.";
}

/**
 * Write the legacy page from the whole career. Pure: everything comes from
 * the state and its history, so every ending reads differently.
 */
export function writeLegacy(state: GameState): Legacy {
  const ending = ENDINGS[state.ending ?? ""] ?? ENDINGS.passed_over!;
  const t = (text: string) => fillTemplate(state, text);
  const party = PARTIES[state.party as PartyId];

  // -- the career
  const passed = state.history.filter((h) => h.text.startsWith("Câmara aprova: ")).map((h) => h.text.replace("Câmara aprova: ", ""));
  const books = state.books.finished.map((b) => BOOKS[b as BookId]?.title).filter(Boolean);
  const roots = NEIGHBOURHOOD_IDS.filter((n) => (state.neighbourhoods[n]?.base ?? 0) >= 40).map((n) => NEIGHBOURHOODS[n].name);
  const career = [
    t(`Foram ${state.turn - 1} semanas na Câmara de Porto Ferro pelo ${party.name}.`),
    passed.length
      ? `Deixou ${passed.length} ${passed.length > 1 ? "leis aprovadas" : "lei aprovada"}: ${passed.join("; ")}.`
      : t("Não deixou nenhuma lei aprovada com seu nome."),
    roots.length ? `Tinha raízes de verdade em ${roots.join(", ")}.` : t("Nunca chegou a criar raízes em nenhum bairro."),
    books.length ? `Na estante do gabinete, marcados e sublinhados: ${books.join(", ")}.` : "Os livros do gabinete continuaram com o plástico.",
  ];

  // -- the people
  const ops = allOpinions(state);
  const sorted = [...GROUP_IDS].sort((a, b) => (ops[b] ?? 0) - (ops[a] ?? 0));
  const best = sorted[0]!;
  const worst = sorted.at(-1)!;
  // Only name a grudge if the group actually holds one (a bad memory), not just a cold start.
  const grudge = (ops[worst] ?? 0) < 0 && state.groups[worst]?.memories.some((m) => m.impact < 0);
  const people = [
    `Quem mais ${state.player.form === "f" ? "a" : "o"} apoiou foram os ${GROUPS[best].name.toLowerCase()}. Quem menos perdoou foram os ${GROUPS[worst].name.toLowerCase()}${
      grudge ? t(`, que nunca esqueceram: {{worst:${worst}}}`) : ""
    }.`,
  ];

  // -- what came out, and what didn't
  const exposed = state.hidden.dossier.filter((d) => d.exposed);
  const buried = state.hidden.dossier.filter((d) => !d.exposed);
  const sections: LegacySection[] = [
    { title: "A carreira", paragraphs: career },
    { title: "O povo", paragraphs: people },
  ];
  if (exposed.length) {
    sections.push({
      title: "Os escândalos",
      paragraphs: exposed.map((d) => `${monthYear(d.turn)}: ${lowerFirst(d.label)}.`.replace(/^./, (c) => c.toUpperCase())),
    });
  }
  sections.push({
    title: "O que ninguém soube",
    paragraphs: buried.length
      ? [
          "Décadas depois, um arquivo doado à universidade revelou o que a imprensa da época nunca publicou:",
          ...buried.map((d) => `${monthYear(d.turn)}: ${lowerFirst(d.label)}.`.replace(/^./, (c) => c.toUpperCase())),
        ]
      : [t("Os arquivos não guardam nenhum segredo sobre {{player}}. Os pesquisadores procuraram. Muito.")],
  });

  return {
    tone: ending.tone,
    date: weekDate(state.turn),
    kicker: ending.kicker,
    headline: t(ending.headline),
    lede: t(ending.lede),
    sections,
    verdict: { title: "O veredito da história", paragraphs: [verdictFor(state.hidden.integrity)] },
  };
}
