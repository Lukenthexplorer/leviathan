import { BALANCE } from "../content/balance";
import type { Cause, Effect, GameState } from "./types";

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const { hidden: H, relation: R, neighbourhood: N } = BALANCE;

/**
 * Apply one effect to a *draft* state (a clone owned by advanceTurn), so
 * mutating it here is safe. `cause` is stamped onto anything that needs to
 * remember why it happened.
 */
export function applyEffect(state: GameState, effect: Effect, cause: Cause): void {
  switch (effect.type) {
    case "opinion": {
      const g = state.groups[effect.group];
      if (!g) throw new Error(`Effect targets unknown group "${effect.group}"`);
      g.memories.push({ label: effect.label, impact: effect.delta, turn: state.turn, cause });
      return;
    }
    case "funds":
      state.player.funds = Math.max(0, state.player.funds + effect.delta);
      return;
    case "integrity":
      state.hidden.integrity = clamp(state.hidden.integrity + effect.delta, H.integrityMin, H.integrityMax);
      return;
    case "expectations":
      state.hidden.expectations = clamp(state.hidden.expectations + effect.delta, H.expectationsMin, H.expectationsMax);
      return;
    case "deliver":
      // Delivering on promises lowers the pressure of expectations.
      state.hidden.expectations = clamp(state.hidden.expectations - effect.amount, H.expectationsMin, H.expectationsMax);
      return;
    case "dossier":
      state.hidden.dossier.push({ id: effect.id, label: effect.label, threads: effect.threads, turn: state.turn, exposed: false });
      return;
    case "relation": {
      const c = state.characters[effect.character];
      if (!c) throw new Error(`Effect targets unknown character "${effect.character}"`);
      c.relation = clamp(c.relation + effect.delta, R.min, R.max);
      return;
    }
    case "neighbourhood": {
      const nb = state.neighbourhoods[effect.id];
      if (!nb) throw new Error(`Effect targets unknown neighbourhood "${effect.id}"`);
      if (effect.mood) nb.mood = clamp(nb.mood + effect.mood, N.moodMin, N.moodMax);
      if (effect.base) nb.base = clamp(nb.base + effect.base, N.baseMin, N.baseMax);
      if (effect.addMarker && !nb.markers.includes(effect.addMarker)) nb.markers.push(effect.addMarker);
      if (effect.removeMarker) nb.markers = nb.markers.filter((m) => m !== effect.removeMarker);
      return;
    }
    case "flag":
      state.flags[effect.key] = effect.set ?? (state.flags[effect.key] ?? 0) + (effect.add ?? 1);
      return;
    case "law":
      state.laws[effect.id] = effect.status;
      return;
    case "schedule":
      // Not applied now: parked in the queue with the ORIGINAL cause attached.
      state.queue.push({ fireOnTurn: state.turn + effect.inTurns, label: effect.label, effects: effect.effects, cause });
      return;
    case "deskItem":
      state.inbox.push({ ...effect.item, turn: state.turn });
      return;
    case "log":
      state.history.push({ turn: state.turn, cause, text: effect.text });
      return;
  }
}

export function applyEffects(state: GameState, effects: readonly Effect[], cause: Cause): void {
  for (const e of effects) applyEffect(state, e, cause);
}
