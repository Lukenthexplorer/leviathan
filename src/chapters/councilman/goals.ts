import { BALANCE } from "../../content/balance";
import { GROUPS, GROUP_IDS } from "../../content/councilman/groups";
import { allOpinions } from "../../core/groups";
import type { GameState } from "../../core/types";

const C = BALANCE.councilman;

export interface Goal {
  id: "nomination" | "funds" | "support";
  label: string;
  met: boolean;
  /** Player-facing progress. Hidden numbers (the boss's trust) stay in words. */
  progress: string;
}

/**
 * The three requirements to run for mayor (Build Brief §10).
 * Pure: the desk shows it, the convention checks it, tests verify it.
 */
export function councilmanGoals(state: GameState): Goal[] {
  const boss = state.characters.party_boss?.relation ?? 0;
  const ops = allOpinions(state);
  const supporters = GROUP_IDS.filter((g) => (ops[g] ?? 0) >= C.groupSupportThreshold);
  const backedRival = (state.flags.backed_rival ?? 0) > 0;

  return [
    {
      id: "nomination",
      label: "Indicação do partido",
      met: boss >= C.nominationRelation && !backedRival,
      progress: backedRival ? "Você prometeu apoiar a Renata" : boss >= C.nominationRelation ? "A cúpula confia em você" : "A cúpula ainda não confia em você",
    },
    {
      id: "funds",
      label: "Dinheiro de campanha",
      met: state.player.funds >= C.fundsNeeded,
      progress: `${state.player.funds}k de ${C.fundsNeeded}k`,
    },
    {
      id: "support",
      label: `Apoio de ${C.groupsNeeded} grupos`,
      met: supporters.length >= C.groupsNeeded,
      progress: supporters.length ? `${supporters.length} a favor: ${supporters.map((g) => GROUPS[g].name).join(", ")}` : "Nenhum grupo a favor ainda",
    },
  ];
}

export const goalsMet = (state: GameState) => councilmanGoals(state).every((g) => g.met);
