import { BOOKS, type BookId } from "../../content/councilman/books";
import { ENDINGS, type EndingTone } from "../../content/councilman/endings";
import { GROUPS, GROUP_IDS } from "../../content/councilman/groups";
import { NEIGHBOURHOODS, NEIGHBOURHOOD_IDS } from "../../content/councilman/neighbourhoods";
import { PARTIES, type PartyId } from "../../content/councilman/parties";
import { monthYear, weekDate } from "../../core/calendar";
import { allOpinions } from "../../core/groups";
import { fillTemplate, lowerFirst } from "../../core/text";
import { BALANCE } from "../../content/balance";
import type { ElectionResult, GameState } from "../../core/types";
import { PLAYER } from "./election";

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
  /** Victories only: the chapter that isn't written yet. */
  next?: string;
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

const OFFICE: Record<ElectionResult["path"], string> = {
  council: "a reeleição para a Câmara",
  mayor: "a Prefeitura de Porto Ferro",
  deputy: "uma vaga na Assembleia Legislativa",
};

const pct = (votes: number, valid: number) => `${((votes / valid) * 100).toFixed(1).replace(".", ",")}%`;
const num = (n: number) => n.toLocaleString("pt-BR");
const sentence = (s: string) => `${s.replace(/^./, (c) => c.toUpperCase())}.`;

/** Seat won by fewer than `closeRaceMargin` points over the first one left out. */
function wonByAHair(r: ElectionResult): boolean {
  if (r.runoff || !r.elected.includes(PLAYER) || r.elected.at(-1) !== PLAYER) return false;
  const valid = Object.values(r.final).reduce((a, b) => a + b, 0);
  const firstOut = Object.entries(r.final)
    .filter(([id]) => !r.elected.includes(id))
    .sort((a, b) => b[1] - a[1])[0];
  return !!firstOut && ((r.final[PLAYER]! - firstOut[1]) / valid) * 100 < BALANCE.election.closeRaceMargin;
}

/**
 * The election, as history tells it: the count, and the strongest reasons for
 * and against (summed over every neighbourhood or region they came from).
 */
function electionSection(state: GameState, r: ElectionResult): LegacySection {
  const t = (text: string) => fillTemplate(state, text);
  const name = (id: string) => r.candidates.find((c) => c.id === id)?.name ?? id;
  const valid = Object.values(r.final).reduce((a, b) => a + b, 0);
  const ranking = Object.keys(r.final).sort((a, b) => r.final[b]! - r.final[a]!);
  const place = ranking.indexOf(PLAYER) + 1;
  const won = r.elected.includes(PLAYER);

  const paragraphs = [
    t(
      `Em ${lowerFirst(monthYear(BALANCE.campaign.endWeek + 1))}, {{player}} disputou ${OFFICE[r.path]}. Teve ${num(r.final[PLAYER]!)} votos ` +
        `(${pct(r.final[PLAYER]!, valid)} dos válidos), ${place}º lugar entre ${ranking.length} candidatos.`,
    ),
  ];
  if (r.runoff) {
    const [a, b] = r.runoff.candidates;
    const v = Object.values(r.runoff.final).reduce((x, y) => x + y, 0);
    const pair = r.runoff.candidates.includes(PLAYER) ? t(`{{player}} e ${name(a === PLAYER ? b : a)}`) : `${name(a)} e ${name(b)}`;
    paragraphs.push(
      `Ninguém passou da metade: o segundo turno ficou entre ${pair}. ${name(r.runoff.winner)} venceu, com ` +
        `${pct(r.runoff.final[r.runoff.winner]!, v)} dos votos válidos.`,
    );
  } else if (!won) {
    paragraphs.push(`${r.elected.length > 1 ? "Ficaram com as vagas" : "Venceu"}: ${r.elected.map(name).join(" e ")}.`);
  }
  if (wonByAHair(r)) paragraphs.push("Foi por um fio. Na contagem final, a vaga esteve a poucas urnas de mudar de dono.");

  // Reasons, summed per cause across units; the line quoted is the unit where it weighed most.
  const byCause = new Map<string, { total: number; text: string; top: number }>();
  for (const c of r.causes) {
    const v = c.value ?? 0;
    const key = `${c.cause.kind}:${c.cause.id}`;
    const prev = byCause.get(key);
    if (!prev) byCause.set(key, { total: v, text: c.text, top: Math.abs(v) });
    else {
      prev.total += v;
      if (Math.abs(v) > prev.top) Object.assign(prev, { text: c.text, top: Math.abs(v) });
    }
  }
  const reasons = [...byCause.values()];
  const helped = reasons.filter((x) => x.total > 0).sort((a, b) => b.total - a.total).slice(0, 2);
  const hurt = reasons.filter((x) => x.total < 0).sort((a, b) => a.total - b.total).slice(0, 2);
  if (helped.length) paragraphs.push(`A favor: ${helped.map((x) => sentence(t(x.text))).join(" ")}`);
  if (hurt.length) paragraphs.push(`Contra: ${hurt.map((x) => sentence(t(x.text))).join(" ")}`);
  else if (!won) paragraphs.push("Contra: nenhum escândalo, nenhuma promessa quebrada. Os adversários só tiveram mais votos.");

  return { title: "A eleição", paragraphs };
}

/**
 * Write the legacy page from the whole career. Pure: everything comes from
 * the state and its history, so every ending reads differently.
 */
export function writeLegacy(state: GameState): Legacy {
  const ending = ENDINGS[state.ending ?? ""] ?? ENDINGS.lost_support!;
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
    `Quem mais ${state.player.form === "f" ? "a" : "o"} apoiou: ${GROUPS[best].the}. Quem menos perdoou: ${GROUPS[worst].the}${
      grudge ? t(`, que nunca esqueceram: {{worst:${worst}}}`) : ""
    }.`,
  ];

  // -- what came out, and what didn't
  const exposed = state.hidden.dossier.filter((d) => d.exposed);
  const buried = state.hidden.dossier.filter((d) => !d.exposed);
  const sections: LegacySection[] = [];
  if (state.election) sections.push(electionSection(state, state.election));
  sections.push(
    { title: "A carreira", paragraphs: career },
    { title: "O povo", paragraphs: people },
  );
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

  // A seat kept by a handful of votes is a victory that doesn't feel like one.
  const tone = ending.tone === "victory" && state.election && wonByAHair(state.election) ? "bittersweet" : ending.tone;

  return {
    tone,
    date: weekDate(state.turn),
    kicker: ending.kicker,
    headline: t(ending.headline),
    lede: t(ending.lede),
    sections,
    ...(ending.next ? { next: t(ending.next) } : {}),
    verdict: { title: "O veredito da história", paragraphs: [verdictFor(state.hidden.integrity)] },
  };
}
