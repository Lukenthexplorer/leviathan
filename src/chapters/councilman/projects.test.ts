import { describe, expect, it } from "vitest";
import { BALANCE } from "../../content/balance";
import { PROJECTS, PROJECT_IDS } from "../../content/councilman/projects";
import type { ProjectDef } from "../../content/types";
import { advanceTurn } from "../../core/advanceTurn";
import { opinionOf } from "../../core/groups";
import type { Decision, GameState } from "../../core/types";
import { localize, projectCooldown } from "./actions";
import { councilmanChapter as chapter } from "./chapter";
import { badEffects } from "./testing/lint";

const P = BALANCE.projects;
const start = () => {
  const s = chapter.createInitialState({ playerName: "Ana Lima", party: "labour", form: "f" });
  s.player.funds = 40;
  return s;
};
const step = (s: GameState, d: Decision[] = []) => advanceTurn(s, d, chapter).state;
const wait = (s: GameState, n: number) => {
  for (let i = 0; i < n; i++) s = step(s);
  return s;
};

describe("content lint: projects", () => {
  it("every project, localized to every neighbourhood, references real things", () => {
    for (const id of PROJECT_IDS) {
      const p: ProjectDef = PROJECTS[id];
      const all = [...p.effects, ...(p.followUps ?? []).flatMap((f) => f.effects)];
      expect(badEffects(localize(all, "morro_esperanca")), id).toEqual([]);
    }
  });
});

describe("neighbourhood projects", () => {
  it("cost money, raise mood and roots, and win over the residents", () => {
    const s = start();
    const after = step(s, [{ kind: "project", project: "nb_potholes", nb: "vila_operaria" }]);
    expect(after.player.funds).toBe(s.player.funds - PROJECTS.nb_potholes.cost);
    expect(after.flags.spent_total).toBe(PROJECTS.nb_potholes.cost);
    expect(after.neighbourhoods.vila_operaria!.mood).toBeGreaterThan(s.neighbourhoods.vila_operaria!.mood);
    expect(after.neighbourhoods.vila_operaria!.base).toBeGreaterThan(0);
    expect(opinionOf(after, "workers")).toBeGreaterThan(opinionOf(s, "workers")); // workers live in Vila Operária
  });

  it("raise expectations: people start expecting the councillor to fix everything", () => {
    const s = start();
    const after = step(s, [{ kind: "project", project: "nb_cleanup", nb: "centro" }]);
    expect(after.hidden.expectations).toBe(P.expectationsPerProject - BALANCE.expectations.forgetPerWeek);
  });

  it("can't be afforded without money, or repeated in the same neighbourhood too soon", () => {
    const broke = start();
    broke.player.funds = 2;
    expect(() => step(broke, [{ kind: "project", project: "nb_pitch", nb: "centro" }])).toThrow("Dinheiro insuficiente");

    let s = step(start(), [{ kind: "project", project: "nb_cleanup", nb: "centro" }]);
    expect(projectCooldown(s, "centro")).toBe(P.cooldownWeeks - 1);
    expect(() => step(s, [{ kind: "project", project: "nb_lights", nb: "centro" }])).toThrow("acabou de receber");
    expect(() => step(s, [{ kind: "project", project: "nb_lights", nb: "sao_bento" }])).not.toThrow(); // other places are fine
    s = wait(s, P.cooldownWeeks - 1);
    expect(projectCooldown(s, "centro")).toBe(0);
  });

  it("the cheap fix comes back: potholes return, and the paper names where and when", () => {
    let s = step(start(), [{ kind: "project", project: "nb_potholes", nb: "morro_esperanca" }]);
    s = wait(s, 8);
    const news = s.inbox.find((i) => i.id === "news_potholes_morro_esperanca")!;
    expect(news.title).toBe("CHUVA LEVA O ASFALTO DO MUTIRÃO EM MORRO DA ESPERANÇA");
    expect(news.body).toContain("tapados em janeiro de 1989 reaparecerem em Morro da Esperança");
  });

  it("a renovated community centre is remembered for the campaign", () => {
    const s = step(start(), [{ kind: "project", project: "nb_community_center", nb: "morro_esperanca" }]);
    expect(s.flags.community_center_morro_esperanca).toBe(1);
    expect(s.characters.community_leader!.relation).toBeGreaterThan(start().characters.community_leader!.relation);
  });
});
