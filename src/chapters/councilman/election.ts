import { BALANCE } from "../../content/balance";
import { CANDIDATES, OPPONENTS, type CandidateId } from "../../content/councilman/candidates";
import { ENDORSERS, type EndorserId } from "../../content/councilman/endorsers";
import { LAWS, LAW_IDS } from "../../content/councilman/laws";
import { NEIGHBOURHOODS, type NeighbourhoodId } from "../../content/councilman/neighbourhoods";
import { PARTIES, type PartyId } from "../../content/councilman/parties";
import { REGIONS, type RegionId } from "../../content/councilman/regions";
import type { CandidateDef, EndorserDef } from "../../content/types";
import { readRef } from "../../core/conditions";
import { opinionOf } from "../../core/groups";
import type { Cause, ElectionResult, GameState, PathId } from "../../core/types";
import { lawHelpedUnits } from "./campaign";

/**
 * The vote model. Pure and deterministic: the same state always gives the
 * same result, so the election is decided by the player's choices and only
 * the *reveal* is staged (by the reporting order on election night).
 */

const E = BALANCE.election;
export const PLAYER = "player";

/** 1989: paper ballots counted by hand in a gymnasium, so far-away urns arrive last. */
export const CITY_ORDER: NeighbourhoodId[] = ["centro", "jardim_atlantico", "sao_bento", "cidade_universitaria", "vila_operaria", "morro_esperanca"];
export const REGION_ORDER: RegionId[] = ["porto_novo", "vale_do_ipe", "serra_alta", "campo_seco"];

export function electionUnits(path: PathId): string[] {
  return path === "deputy" ? [...CITY_ORDER, ...REGION_ORDER] : [...CITY_ORDER];
}

const isRegion = (unit: string): unit is RegionId => unit in REGIONS;
const residentsOf = (unit: string): Record<string, number> =>
  isRegion(unit) ? REGIONS[unit].residents : NEIGHBOURHOODS[unit as NeighbourhoodId].residents;
const unitName = (unit: string) => (isRegion(unit) ? REGIONS[unit].name : NEIGHBOURHOODS[unit as NeighbourhoodId].name);

/** Ballots cast in a unit, in thousands... times 1000. */
function ballots(unit: string): number {
  if (isRegion(unit)) return REGIONS[unit].voters * 1000 * 0.75;
  const nb = NEIGHBOURHOODS[unit as NeighbourhoodId];
  return nb.voters * 1000 * nb.turnout;
}

/** Resident-weighted opinion of the player in a unit (-100..100). */
function localOpinion(state: GameState, unit: string): number {
  return Object.entries(residentsOf(unit)).reduce((sum, [g, share]) => sum + opinionOf(state, g) * share, 0);
}

interface Component {
  text: string;
  value: number;
  cause: Cause;
}

/** The player's strength in a unit, as named parts: they become the narrator's causes. */
function playerComponents(state: GameState, unit: string): Component[] {
  const c = state.campaign;
  const sys = (id: string, label: string): Cause => ({ kind: "system", id, turn: state.turn, label });
  const parts: Component[] = [];
  const name = unitName(unit);

  if (isRegion(unit)) {
    const party = PARTIES[state.party as PartyId];
    const standing = Object.entries(REGIONS[unit].residents).reduce(
      (s, [g, share]) => s + ((party.startingOpinions as Record<string, number>)[g] ?? 0) * share,
      0,
    );
    parts.push({ text: `Em ${name}, pouca gente conhece {{player}}`, value: E.regionBase, cause: sys("region", name) });
    parts.push({ text: `Em ${name}, a força do ${party.short} pesou`, value: standing * E.partyRegionWeight, cause: sys("party", party.short) });
    const mentor = state.characters.mentor?.relation ?? 0;
    parts.push({ text: "Os amigos de Otávio no interior fizeram campanha", value: mentor * E.mentorRegionWeight, cause: sys("mentor", "Otávio Brandão") });
  } else {
    parts.push({ text: "O mandato já dava algum nome", value: E.playerBase, cause: sys("mandate", "mandato") });
    parts.push({ text: `Em ${name}, a opinião dos moradores pesou`, value: localOpinion(state, unit) * E.opinionWeight, cause: sys("opinion", name) });
    const base = state.neighbourhoods[unit]?.base ?? 0;
    if (base > 0) parts.push({ text: `As raízes de {{player}} em ${name} fizeram diferença`, value: base * E.baseWeight, cause: sys("roots", name) });
    // Laws that helped this neighbourhood show up as their own reason.
    for (const law of LAW_IDS.filter((l) => state.laws[l] === "passed" && lawHelpedUnits(l).includes(unit as NeighbourhoodId))) {
      parts.push({ text: `Em ${name}, ${LAWS[law].title} pesou a favor de {{player}}`, value: 3, cause: { kind: "law", id: law, turn: state.turn, label: LAWS[law].title } });
    }
  }

  const presence = c?.presence[unit] ?? 0;
  if (presence > 0) parts.push({ text: `A campanha de {{player}} esteve em todo canto de ${name}`, value: presence * E.presenceWeight, cause: sys("presence", name) });

  for (const who of c?.endorsements ?? []) {
    const e = (ENDORSERS as Record<string, EndorserDef>)[who as EndorserId];
    if (!e) continue;
    const share = residentsOf(unit)[e.group] ?? 0;
    const here = e.units.includes(unit) ? 1 : share;
    if (here > 0) parts.push({ text: `O apoio de ${e.name} trouxe votos`, value: E.endorsementBonus * here, cause: sys(`endorse_${who}`, e.name) });
  }

  const exposed = readRef(state, "exposedThreads");
  if (exposed > 0) parts.push({ text: "Os escândalos cobraram seu preço", value: -exposed * E.scandalPerThread, cause: sys("scandal", "escândalos") });
  const broken = Math.max(0, state.hidden.expectations - BALANCE.expectations.tolerance);
  if (broken > 0) parts.push({ text: "Promessas não cumpridas viraram votos perdidos", value: -broken * E.brokenPromisePerPoint, cause: sys("promises", "promessas") });

  return parts;
}

function opponentScore(state: GameState, path: PathId, id: CandidateId, unit: string): number {
  const def: CandidateDef = CANDIDATES[id];
  let score = ((def.profile as Record<string, number>)[unit] ?? E.opponentDefault) + E.opponentBonus[path];
  if (def.reacts?.onBrokenPromises) score += Math.max(0, state.hidden.expectations - BALANCE.expectations.tolerance) * E.opponentBrokenPromiseWeight;
  if (def.reacts?.dislikedBy) {
    const share = residentsOf(unit)[def.reacts.dislikedBy] ?? 0;
    score += Math.max(0, -opinionOf(state, def.reacts.dislikedBy)) * share * E.opponentDislikeWeight * 2;
  }
  score -= state.campaign?.opponentDamage[id] ?? 0;
  return score;
}

/** Share of the vote in one unit, per candidate (sums to 1). */
export function unitShares(state: GameState, path: PathId, unit: string, ids: string[] = [PLAYER, ...OPPONENTS[path]]): Record<string, number> {
  const scores: Record<string, number> = {};
  for (const id of ids) {
    scores[id] = id === PLAYER ? playerComponents(state, unit).reduce((s, p) => s + p.value, 0) : opponentScore(state, path, id as CandidateId, unit);
  }
  const powered = Object.fromEntries(Object.entries(scores).map(([k, v]) => [k, Math.max(E.minScore, v) ** E.shareExponent]));
  const total = Object.values(powered).reduce((a, b) => a + b, 0);
  return Object.fromEntries(Object.entries(powered).map(([k, v]) => [k, v / total]));
}

function nullShare(state: GameState, unit: string): number {
  const mood = isRegion(unit) ? 0 : (state.neighbourhoods[unit]?.mood ?? 0);
  return Math.min(E.nullMax, E.nullBase + Math.max(0, -mood) * E.nullVotesPerMoodPoint);
}

/** The two most decisive reasons in a unit (one for, one against), for the narrator. */
function unitCauses(state: GameState, unit: string): { unitId: string; text: string; cause: Cause }[] {
  const parts = playerComponents(state, unit).filter((p) => p.cause.id !== "mandate" && p.cause.id !== "region");
  const best = [...parts].sort((a, b) => b.value - a.value)[0];
  const worst = [...parts].sort((a, b) => a.value - b.value)[0];
  return [best, worst].filter((p): p is Component => !!p && Math.abs(p.value) >= 3).map((p) => ({ unitId: unit, text: p.text, cause: p.cause }));
}

/** Count every unit in reporting order, batch by batch, for the given candidates. */
function count(state: GameState, path: PathId, ids: string[]) {
  const units = electionUnits(path);
  const batches: ElectionResult["batches"] = [];
  const final: Record<string, number> = Object.fromEntries(ids.map((id) => [id, 0]));
  let finalNulls = 0;
  const totalBallots = units.reduce((s, u) => s + Math.round(ballots(u)), 0);
  let counted = 0;

  for (const unit of units) {
    const cast = Math.round(ballots(unit));
    const nulls = Math.round(cast * nullShare(state, unit));
    const shares = unitShares(state, path, unit, ids);
    // Whole-unit votes first; batches split them, the last batch taking the remainder, so batches always add up.
    const unitVotes = Object.fromEntries(ids.map((id) => [id, Math.round((cast - nulls) * shares[id]!)]));
    const fractions = E.batchFractions;
    const given: Record<string, number> = Object.fromEntries(ids.map((id) => [id, 0]));
    let givenNulls = 0;
    let givenCast = 0;
    fractions.forEach((f, i) => {
      const last = i === fractions.length - 1;
      const votes = Object.fromEntries(ids.map((id) => [id, last ? unitVotes[id]! - given[id]! : Math.round(unitVotes[id]! * f)]));
      const batchNulls = last ? nulls - givenNulls : Math.round(nulls * f);
      for (const id of ids) given[id]! += votes[id]!;
      givenNulls += batchNulls;
      const batchCast = last ? cast - givenCast : Math.round(cast * f);
      givenCast += batchCast;
      counted += batchCast;
      batches.push({
        unitId: unit,
        label: `Urnas de ${unitName(unit)}${fractions.length > 1 ? ` (${i + 1}/${fractions.length})` : ""}`,
        votes,
        nulls: batchNulls,
        cumulativePct: Math.round((counted / totalBallots) * 1000) / 10,
      });
    });
    for (const id of ids) final[id]! += unitVotes[id]!;
    finalNulls += nulls;
  }
  const ranking = [...ids].sort((a, b) => final[b]! - final[a]! || a.localeCompare(b));
  return { batches, final, finalNulls, ranking };
}

export function computeElection(state: GameState, path: PathId): ElectionResult {
  const ids = [PLAYER, ...OPPONENTS[path]];
  const party = PARTIES[state.party as PartyId];
  const first = count(state, path, ids);
  const valid = Object.values(first.final).reduce((a, b) => a + b, 0);
  const seats = path === "mayor" ? 1 : path === "council" ? E.councilSeats : E.deputySeats;

  // Mayor: no majority, so the top two face each other in a second round. Same people, same scores, two names.
  let runoff: ElectionResult["runoff"];
  if (path === "mayor" && first.final[first.ranking[0]!]! / valid < E.runoffBelow) {
    const pair = [first.ranking[0]!, first.ranking[1]!] as [string, string];
    const second = count(state, path, pair);
    runoff = { candidates: pair, batches: second.batches, final: second.final, finalNulls: second.finalNulls, winner: second.ranking[0]! };
  }

  return {
    path,
    candidates: ids.map((id) =>
      id === PLAYER
        ? { id, name: state.player.name, party: party.short, portrait: "player" }
        : { id, name: CANDIDATES[id as CandidateId].name, party: CANDIDATES[id as CandidateId].party, portrait: CANDIDATES[id as CandidateId].portrait },
    ),
    batches: first.batches,
    final: first.final,
    finalNulls: first.finalNulls,
    winner: runoff?.winner ?? first.ranking[0]!,
    elected: runoff ? [runoff.winner] : first.ranking.slice(0, seats),
    causes: electionUnits(path).flatMap((u) => unitCauses(state, u)),
    ...(runoff ? { runoff } : {}),
  };
}

/** City- or state-wide shares (rounded %), as a poll shows them. */
export function pollShares(state: GameState, path: PathId): Record<string, number> {
  const r = computeElection(state, path);
  const valid = Object.values(r.final).reduce((a, b) => a + b, 0);
  return Object.fromEntries(Object.entries(r.final).map(([id, v]) => [id, Math.round((v / valid) * 100)]));
}
