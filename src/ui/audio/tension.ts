import { readRef } from "../../core/conditions";
import type { Frame } from "../../chapters/councilman/broadcast";
import { PLAYER } from "../../chapters/councilman/election";
import type { GameState, TurnReport } from "../../core/types";

/**
 * How tense the music should be (0..1). The music is one of the ways hidden
 * variables leak to the player: a journalist digging into you makes the drums
 * creep in long before anything is published. Felt, never shown.
 */
export function musicTension(state: GameState, report: TurnReport | null): number {
  const unpopular = Math.max(0, -readRef(state, "averageOpinion")) / 50;
  const investigated = (state.flags.investigation ?? 0) / 100;
  const scandal = report?.exposed.length ? 0.6 : 0;
  return Math.min(1, unpopular * 0.5 + investigated * 0.5 + scandal);
}

/** Points of margin at which the counting night is fully relaxed. */
const CALM_MARGIN = 12;

/**
 * Election night: how tight the count is for the player (0..1). The race that
 * matters is with the candidate right above (or, when leading, right below), so a
 * comfortable lead and a hopeless deficit are both calm; a coin flip is not.
 */
export function electionTension(frame: Frame): number {
  const mine = frame.shares[PLAYER] ?? 0;
  const others = Object.entries(frame.shares).filter(([id]) => id !== PLAYER).map(([, v]) => v);
  if (!others.length) return 0;
  const above = others.filter((v) => v >= mine);
  const gap = above.length ? Math.min(...above) - mine : mine - Math.max(...others);
  return Math.max(0.1, Math.min(1, 1 - gap / CALM_MARGIN));
}
