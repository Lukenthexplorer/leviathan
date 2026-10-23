import { describe, expect, it } from "vitest";
import { ENDINGS } from "../../content/councilman/endings";
import { COUNCILMAN_ENDINGS, councilmanChapter as chapter } from "./chapter";
import { writeLegacy } from "./legacy";
import { badTemplates } from "./testing/lint";

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
    const s = career("candidacy");
    s.history.push({ turn: 3, cause: { kind: "law", id: "x", turn: 2, label: "" }, text: "Câmara aprova: Ronda Noturna" });
    const text = writeLegacy(s).sections.flatMap((x) => x.paragraphs).join(" ");
    expect(text).toContain("1 lei aprovada: Ronda Noturna");
  });

  it("finally reveals the secrets that never came out", () => {
    const s = career("candidacy");
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
    const clean = career("passed_over");
    clean.hidden.integrity = 90;
    const rotten = career("passed_over");
    rotten.hidden.integrity = 5;
    expect(writeLegacy(clean).verdict.paragraphs[0]).toContain("limpa");
    expect(writeLegacy(rotten).verdict.paragraphs[0]).toContain("corrupção");
  });
});
