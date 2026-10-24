import { describe, expect, it } from "vitest";
import { ENDINGS } from "../../content/councilman/endings";
import { COUNCILMAN_ENDINGS, councilmanChapter as chapter } from "./chapter";
import { writeLegacy } from "./legacy";
import type { Cause, ElectionResult } from "../../core/types";
import { badTemplates } from "./testing/lint";

const sys = (id: string): Cause => ({ kind: "system", id, turn: 41, label: id });

/** A hand-made count: easier to read than a whole campaign. */
const result = (final: Record<string, number>, elected: string[], extra: Partial<ElectionResult> = {}): ElectionResult => ({
  path: "council",
  candidates: [
    { id: "player", name: "Ana Lima", party: "PT", portrait: "player" },
    { id: "rival", name: "Jorge Salles", party: "PT", portrait: "x" },
    { id: "third", name: "Dona Cida", party: "PT", portrait: "x" },
  ],
  batches: [],
  final,
  finalNulls: 0,
  winner: Object.keys(final).sort((a, b) => final[b]! - final[a]!)[0]!,
  elected,
  causes: [
    { unitId: "centro", text: "Em Centro, a opinião dos moradores pesou", cause: sys("opinion"), value: 4 },
    { unitId: "morro_esperanca", text: "As raízes de {{player}} em Morro da Esperança fizeram diferença", cause: sys("roots"), value: 9 },
    { unitId: "vila_operaria", text: "As raízes de {{player}} em Vila Operária fizeram diferença", cause: sys("roots"), value: 6 },
    { unitId: "centro", text: "Os escândalos cobraram seu preço", cause: sys("scandal"), value: -5 },
  ],
  ...extra,
});

const career = (ending: string, form: "m" | "f" = "f") => {
  const s = chapter.createInitialState({ playerName: "Ana Lima", party: "labour", form });
  s.turn = 30;
  s.ending = ending;
  return s;
};

describe("legacy page", () => {
  it("every ending has text, with valid templates", () => {
    for (const id of COUNCILMAN_ENDINGS) {
      expect(ENDINGS, id).toHaveProperty(id);
      expect(badTemplates(ENDINGS[id]!.headline + ENDINGS[id]!.lede), id).toEqual([]);
    }
  });

  it("writes the headline in the player's chosen form", () => {
    expect(writeLegacy(career("arrested", "f")).headline).toBe("VEREADORA ANA LIMA DEIXA A CÂMARA ALGEMADA");
    expect(writeLegacy(career("arrested", "m")).headline).toBe("VEREADOR ANA LIMA DEIXA A CÂMARA ALGEMADO");
  });

  it("lists the laws the councillor actually passed", () => {
    const s = career("reelected");
    s.history.push({ turn: 3, cause: { kind: "law", id: "x", turn: 2, label: "" }, text: "Câmara aprova: Ronda Noturna" });
    const text = writeLegacy(s).sections.flatMap((x) => x.paragraphs).join(" ");
    expect(text).toContain("1 lei aprovada: Ronda Noturna");
  });

  it("finally reveals the secrets that never came out", () => {
    const s = career("reelected");
    s.hidden.dossier.push(
      { id: "a", label: "Voto vendido na licitação do anel viário", threads: 2, turn: 10, exposed: false },
      { id: "b", label: "Dinheiro de empreiteira", threads: 3, turn: 5, exposed: true },
    );
    const legacy = writeLegacy(s);
    const secrets = legacy.sections.find((x) => x.title === "O que ninguém soube")!.paragraphs.join(" ");
    expect(secrets).toContain("Março de 1989: voto vendido na licitação do anel viário");
    expect(secrets).not.toContain("dinheiro de empreiteira"); // that one was already a scandal
    expect(legacy.sections.find((x) => x.title === "Os escândalos")!.paragraphs[0]).toContain("dinheiro de empreiteira");
  });

  it("turns the hidden integrity score into history's verdict", () => {
    const clean = career("defeated_council");
    clean.hidden.integrity = 90;
    const rotten = career("defeated_council");
    rotten.hidden.integrity = 5;
    expect(writeLegacy(clean).verdict.paragraphs[0]).toContain("limpa");
    expect(writeLegacy(rotten).verdict.paragraphs[0]).toContain("corrupção");
  });

  it("tells the election: the count, and the strongest reasons for and against", () => {
    const s = career("reelected");
    s.election = result({ player: 4000, rival: 5000, third: 1000 }, ["rival", "player"]);
    const section = writeLegacy(s).sections[0]!;
    expect(section.title).toBe("A eleição");
    const text = section.paragraphs.join(" ");
    expect(text).toContain("Ana Lima disputou a reeleição para a Câmara. Teve 4.000 votos (40,0% dos válidos), 2º lugar entre 3 candidatos.");
    // Roots summed over two neighbourhoods (15) beat opinion (4); the quote is where it weighed most.
    expect(text).toContain("A favor: As raízes de Ana Lima em Morro da Esperança fizeram diferença. Em Centro");
    expect(text).toContain("Contra: Os escândalos cobraram seu preço.");
  });

  it("names who took the seat when the player lost, and the runoff when there was one", () => {
    const lost = career("defeated_council");
    lost.election = result({ player: 1000, rival: 5000, third: 4000 }, ["rival", "third"]);
    expect(writeLegacy(lost).sections[0]!.paragraphs.join(" ")).toContain("Ficaram com as vagas: Jorge Salles e Dona Cida.");

    const mayor = career("elected_mayor");
    mayor.election = result({ player: 4500, rival: 4000, third: 1500 }, ["player"], {
      path: "mayor",
      runoff: { candidates: ["player", "rival"], batches: [], final: { player: 5200, rival: 4800 }, finalNulls: 0, winner: "player" },
    });
    expect(writeLegacy(mayor).sections[0]!.paragraphs.join(" ")).toContain(
      "o segundo turno ficou entre Ana Lima e Jorge Salles. Ana Lima venceu, com 52,0% dos votos válidos.",
    );
  });

  it("a seat kept by a hair is bittersweet; a comfortable one is a victory", () => {
    const hair = career("reelected");
    hair.election = result({ rival: 5000, player: 2550, third: 2450 }, ["rival", "player"]);
    expect(writeLegacy(hair).tone).toBe("bittersweet");
    const easy = career("reelected");
    easy.election = result({ rival: 5000, player: 4000, third: 1000 }, ["rival", "player"]);
    expect(writeLegacy(easy).tone).toBe("victory");
  });

  it("victories promise the next chapter; defeats don't", () => {
    for (const id of COUNCILMAN_ENDINGS) {
      const legacy = writeLegacy(career(id));
      if (legacy.tone === "defeat") expect(legacy.next, id).toBeUndefined();
      else expect(legacy.next, id).toBeTruthy();
      expect(badTemplates(ENDINGS[id]!.next ?? ""), id).toEqual([]);
    }
  });

  it("old saves without cause weights still get a legacy page (no NaN, no crash)", () => {
    const s = career("reelected");
    s.election = result({ player: 4000, rival: 5000, third: 1000 }, ["rival", "player"]);
    s.election.causes = s.election.causes.map(({ value: _v, ...c }) => c);
    const text = writeLegacy(s).sections.flatMap((x) => x.paragraphs).join(" ");
    expect(text).not.toContain("NaN");
    expect(text).not.toContain("undefined");
  });
});
