import { BALANCE } from "../content/balance";
import { readRef } from "./conditions";
import type { Effect, GameState } from "./types";

/**
 * Weekly rules for the hidden variables. They don't mutate anything: they
 * look at the state and return effects, which the core applies like any other.
 * That keeps them trivially testable and reusable by every chapter.
 */

const E = BALANCE.expectations;
const I = BALANCE.investigation;

/**
 * Unkept promises. Above the tolerance, every group loses a little opinion
 * each week. Because group memories accumulate, a long populist streak turns
 * into a steep crash rather than a single dip.
 */
export function expectationsPressure(state: GameState): Effect[] {
  const effects: Effect[] = [{ type: "expectations", delta: -E.forgetPerWeek }];
  const over = state.hidden.expectations - E.tolerance;
  if (over <= 0) return effects;
  const hit = -over * E.disappointmentPerPoint;
  for (const group of Object.keys(state.groups)) {
    effects.push({ type: "opinion", group, delta: hit, label: "Promessas não cumpridas" });
  }
  effects.push({ type: "flag", key: "weeks_over_expectations", add: 1 });
  return effects;
}

/** Weekly investigation speed, before it is added to the "investigation" flag. */
export function investigationSpeed(state: GameState, journalistId: string): number {
  const threads = readRef(state, "unexposedThreads");
  const suspicion = Math.max(0, I.suspicionIntegrity - state.hidden.integrity);
  const base = threads * I.progressPerThread + suspicion * I.progressPerSuspicionPoint;
  const hostility = Math.max(0, -(state.characters[journalistId]?.relation ?? 0));
  return base * (1 + hostility * I.hostilityMultiplierPerPoint);
}

/**
 * The journalist digs. When progress reaches the threshold, the dossier entry
 * with the most threads is exposed and a scandal hits. Nothing is random:
 * progress only comes from threads you left and integrity you lost.
 */
export function investigationStep(state: GameState, journalistId: string, bossId: string): Effect[] {
  const speed = investigationSpeed(state, journalistId);
  if (speed <= 0) return [];
  const progress = (state.flags.investigation ?? 0) + speed;

  const target = [...state.hidden.dossier].filter((d) => !d.exposed).sort((a, b) => b.threads - a.threads)[0];
  if (progress < I.exposeAt || !target) {
    return [{ type: "flag", key: "investigation", set: Math.min(progress, I.exposeAt) }];
  }

  const effects: Effect[] = [
    { type: "flag", key: "investigation", set: 0 },
    { type: "flag", key: "scandals", add: 1 },
    { type: "expose", id: target.id },
    { type: "relation", character: bossId, delta: target.threads * I.scandalBossRelationPerThread },
    { type: "log", text: `Exposto pela imprensa: ${target.label}` },
  ];
  for (const group of Object.keys(state.groups)) {
    effects.push({ type: "opinion", group, delta: target.threads * I.scandalOpinionPerThread, label: `Escândalo: ${target.label}` });
  }
  return effects;
}
