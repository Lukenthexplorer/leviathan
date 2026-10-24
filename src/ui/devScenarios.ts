import { councilmanChapter } from "../chapters/councilman/chapter";
import { BALANCE } from "../content/balance";
import type { GameState } from "../core/types";
import { useGame } from "./store";

/**
 * Dev-only shortcuts for testing: open the game with ?teste=<name>.
 * Autosave is turned off for the tab, so the real career is never touched.
 * Each scenario stops one click before the interesting part, so the browser
 * has a user gesture and sounds can play.
 *
 *   ?teste=eleicao           week 40, mayor race: periphery base, tight count, runoff
 *   ?teste=eleicao-vitoria   week 40, a strong mayor campaign
 *   ?teste=eleicao-derrota   week 40, a weak mayor campaign
 *   ?teste=deputado          week 40, state deputy race
 *   ?teste=vereador          week 40, re-election race
 *   ?teste=decisao           week 31: next week is the path decision
 *   ?teste=campanha          week 33: the campaign desk
 */
const cause = { kind: "system" as const, id: "teste", turn: 1, label: "cenário de teste" };

function base(): GameState {
  const s = councilmanChapter.createInitialState({ playerName: "Ana Lima", party: "labour", form: "f" });
  s.inbox = [];
  s.player.funds = 60;
  s.player.capital = 12;
  s.flags.convention_warned = 1;
  return s;
}

function love(s: GameState, groups: Record<string, number>) {
  for (const [g, v] of Object.entries(groups)) s.groups[g]!.memories.push({ label: "teste", impact: v, turn: s.turn, cause });
}

function electionEve(path: "mayor" | "deputy" | "council", strength: number): GameState {
  const s = base();
  s.turn = BALANCE.campaign.endWeek;
  s.flags.path_offered = 1;
  love(s, { periphery: 90 * strength, workers: 70 * strength, religious: 60 * strength, retirees: 40 * strength });
  s.neighbourhoods.morro_esperanca!.base = Math.round(80 * strength);
  s.neighbourhoods.vila_operaria!.base = Math.round(60 * strength);
  s.laws.hillside_sanitation = "passed";
  s.campaign = {
    path,
    presence: { morro_esperanca: 90 * strength, vila_operaria: 80 * strength, centro: 40 * strength, sao_bento: 40 * strength },
    cabos: {},
    endorsements: strength >= 1 ? ["lurdes", "union"] : [],
    attacks: [],
    opponentDamage: {},
    polls: [],
  };
  return s;
}

const SCENARIOS: Record<string, () => GameState> = {
  eleicao: () => electionEve("mayor", 1),
  "eleicao-vitoria": () => {
    const s = electionEve("mayor", 1.3);
    love(s, { business: 40, students: 40 });
    s.campaign!.endorsements.push("pastor", "commerce");
    return s;
  },
  "eleicao-derrota": () => electionEve("mayor", 0.4),
  deputado: () => {
    const s = electionEve("deputy", 1);
    s.campaign!.presence = { ...s.campaign!.presence, porto_novo: 40, vale_do_ipe: 30 };
    return s;
  },
  vereador: () => electionEve("council", 0.8),
  decisao: () => {
    const s = base();
    s.turn = BALANCE.campaign.decisionWeek - 1;
    s.characters.party_boss!.relation = 45;
    return s;
  },
  campanha: () => {
    const s = base();
    s.turn = BALANCE.campaign.startWeek;
    s.flags.path_offered = 1;
    s.campaign = { path: "mayor", presence: {}, cabos: {}, endorsements: [], attacks: [], opponentDamage: {}, polls: [] };
    s.characters.community_leader!.relation = 30;
    return s;
  },
};

/** Called once at startup in dev. Returns the scenario name if one was loaded. */
export function loadDevScenario(): string | null {
  const name = new URLSearchParams(window.location.search).get("teste");
  if (!name) return null;
  const make = SCENARIOS[name];
  if (!make) {
    console.warn(`Cenário de teste desconhecido: "${name}". Opções: ${Object.keys(SCENARIOS).join(", ")}`);
    return null;
  }
  useGame.setState({ state: make(), screen: "desk", pending: [], report: null, notice: null, persist: false });
  return name;
}
