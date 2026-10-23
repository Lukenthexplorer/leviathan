import { BALANCE } from "../../content/balance";
import { ELECTION_LINES as L } from "../../content/councilman/election_lines";
import { NEIGHBOURHOODS, type NeighbourhoodId } from "../../content/councilman/neighbourhoods";
import { REGIONS, type RegionId } from "../../content/councilman/regions";
import { fillTemplate } from "../../core/text";
import type { ElectionResult, GameState } from "../../core/types";
import { PLAYER } from "./election";

/**
 * Turns an ElectionResult into a broadcast script for election night: one
 * frame per batch of urns, with running totals, leader, lead changes, pacing
 * and the anchor's line. Pure: the TV (React + GSAP) only plays this back.
 */

export interface Frame {
  label: string;
  unitId: string;
  /** % of ballots counted after this batch. */
  pct: number;
  totals: Record<string, number>;
  /** % of valid votes counted so far. */
  shares: Record<string, number>;
  leader: string;
  leadChange: boolean;
  close: boolean;
  /** This batch completes its unit: the mini map lights it in the local winner's colour. */
  unitDone: boolean;
  unitWinner?: string;
  line: string;
  /** Seconds this frame stays on screen (slower when it's tight or near the end). */
  duration: number;
}

export interface Round {
  title: string;
  candidates: string[];
  frames: Frame[];
  intro: string;
}

export interface Broadcast {
  rounds: Round[];
  finalLine: string;
  playerWon: boolean;
}

const BASE_SECONDS = 1.5;
const SLOW_SECONDS = 3;

const unitName = (u: string) => (u in REGIONS ? REGIONS[u as RegionId].name : NEIGHBOURHOODS[u as NeighbourhoodId].name);

function frames(state: GameState, result: ElectionResult, batches: ElectionResult["batches"], ids: string[]): Frame[] {
  const name = (id: string) => (id === PLAYER ? state.player.name : (result.candidates.find((c) => c.id === id)?.name ?? id));
  const totals: Record<string, number> = Object.fromEntries(ids.map((id) => [id, 0]));
  const unitTotals: Record<string, Record<string, number>> = {};
  const toldUnits = new Set<string>();
  let leader = "";
  const out: Frame[] = [];

  batches.forEach((b, i) => {
    for (const id of ids) totals[id]! += b.votes[id] ?? 0;
    const ut = (unitTotals[b.unitId] ??= Object.fromEntries(ids.map((id) => [id, 0])));
    for (const id of ids) ut[id]! += b.votes[id] ?? 0;
    const valid = Object.values(totals).reduce((a, c) => a + c, 0) || 1;
    const shares = Object.fromEntries(ids.map((id) => [id, Math.round((totals[id]! / valid) * 1000) / 10]));
    const ranked = [...ids].sort((a, c) => totals[c]! - totals[a]!);
    const top = ranked[0]!;
    const gap = shares[ranked[0]!]! - shares[ranked[1]!]!;
    const leadChange = leader !== "" && top !== leader;
    leader = top;
    const close = gap < BALANCE.election.closeRaceMargin;
    const unitDone = i === batches.length - 1 || batches[i + 1]!.unitId !== b.unitId;
    const unitWinner = unitDone ? Object.entries(ut).sort((a, c) => c[1] - a[1])[0]![0] : undefined;

    // The anchor speaks: a lead change beats everything, then a unit's first urns (with a cause), then the mood of the race.
    let line: string;
    if (leadChange) line = L.leadChange.replace("{name}", name(top));
    else if (!toldUnits.has(b.unitId)) {
      toldUnits.add(b.unitId);
      const cause = result.causes.find((c) => c.unitId === b.unitId);
      line = cause ? L.unitReported.replace("{unit}", unitName(b.unitId)).replace("{cause}", cause.text) : L.unitReportedQuiet.replace("{unit}", unitName(b.unitId));
    } else if (close) line = L.close.replace("{gap}", String(Math.max(1, Math.ceil(gap))));
    else if (gap > 15 && b.cumulativePct > 40) line = L.landslide.replace("{name}", name(top));
    else line = L.unitReportedQuiet.replace("{unit}", unitName(b.unitId));

    out.push({
      label: b.label,
      unitId: b.unitId,
      pct: b.cumulativePct,
      totals: { ...totals },
      shares,
      leader: top,
      leadChange,
      close,
      unitDone,
      ...(unitWinner ? { unitWinner } : {}),
      line: fillTemplate(state, line),
      duration: close || b.cumulativePct >= 80 ? SLOW_SECONDS : BASE_SECONDS,
    });
  });
  return out;
}

export function buildBroadcast(state: GameState, result: ElectionResult): Broadcast {
  const name = (id: string) => (id === PLAYER ? state.player.name : (result.candidates.find((c) => c.id === id)?.name ?? id));
  const ids = result.candidates.map((c) => c.id);
  const rounds: Round[] = [
    {
      title: result.runoff ? "1º turno" : "Apuração",
      candidates: ids,
      frames: frames(state, result, result.batches, ids),
      intro: result.path === "deputy" ? L.openingDeputy : L.opening,
    },
  ];
  if (result.runoff) {
    const [a, b] = result.runoff.candidates;
    rounds.push({
      title: "2º turno",
      candidates: [a, b],
      frames: frames(state, result, result.runoff.batches, [a, b]),
      intro: `${L.runoffIntro.replace("{a}", name(a)).replace("{b}", name(b))} ${L.runoffOpening}`,
    });
  }

  const playerWon = result.elected.includes(PLAYER);
  const others = result.elected.filter((id) => id !== PLAYER);
  const finalLine =
    result.path === "council"
      ? playerWon
        ? L.finalCouncilWin
        : L.finalCouncilLoss.replace("{a}", name(others[0] ?? "")).replace("{b}", name(others[1] ?? ""))
      : result.path === "deputy"
        ? playerWon
          ? L.finalDeputyWin
          : L.finalDeputyLoss
        : (playerWon ? L.finalWin : L.finalLoss).replace("{name}", name(result.winner));

  return { rounds, finalLine: fillTemplate(state, finalLine), playerWon };
}
