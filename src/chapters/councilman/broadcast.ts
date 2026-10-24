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

/** Which radio line election night should try on a frame (the narrator may still drop it if busy). */
export type FrameNarration = "lead_change" | "outraged" | "close_race" | "landslide" | "ballots";

/** When a frame has several reasons to talk, the most important wins (same order as the narrator's priorities). */
const FRAME_NARRATION_ORDER: FrameNarration[] = ["lead_change", "outraged", "close_race", "landslide", "ballots"];

const N = BALANCE.election.narration;

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
  /** The radio line to try here, if any. */
  narration?: FrameNarration;
  /** The last batch of the deciding count: "última urna!" first, then this many seconds of silence before it shows. */
  lastBallotPause?: number;
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

/**
 * How much the narrator talks: a council race little ("urnas chegando" every 6
 * batches, no landslide), a deputy race more, a mayor race the most. Any race
 * whose margin gets tight talks like a mayor race from then on.
 */
function narrationPace(path: ElectionResult["path"], intense: boolean) {
  const like = intense ? "mayor" : path;
  return { ballotsEvery: N.ballotsEvery[like], landslide: like !== "council" };
}

function frames(state: GameState, result: ElectionResult, batches: ElectionResult["batches"], ids: string[], deciding: boolean): Frame[] {
  const name = (id: string) => (id === PLAYER ? state.player.name : (result.candidates.find((c) => c.id === id)?.name ?? id));
  const totals: Record<string, number> = Object.fromEntries(ids.map((id) => [id, 0]));
  const unitTotals: Record<string, Record<string, number>> = {};
  const toldUnits = new Set<string>();
  let leader = "";
  let lastGap = 0;
  // The narrator's memory across batches.
  let wasClose = false;
  let intense = false;
  let landslideTold = false;
  let sinceBallots = 0;
  const out: Frame[] = [];

  batches.forEach((b, i) => {
    const playerBefore = PLAYER in totals ? totals[PLAYER]! / (Object.values(totals).reduce((a, c) => a + c, 0) || 1) : 0;
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

    // The radio. Every reason this batch has to talk; the most important one is tried.
    if (close) intense = true;
    const pace = narrationPace(result.path, intense);
    const batchValid = ids.reduce((s, id) => s + (b.votes[id] ?? 0), 0) || 1;
    const playerHere = PLAYER in totals ? (b.votes[PLAYER] ?? 0) / batchValid : 0;
    // A batch that slashes the leader's margin without flipping it, or one that goes badly wrong for the player.
    const swing = !leadChange && i > 0 && lastGap - gap > N.outragedSwing;
    const playerHit = i > 0 && PLAYER in totals && (playerBefore - playerHere) * 100 > N.outragedPlayerDrop;
    const reasons: Record<FrameNarration, boolean> = {
      lead_change: leadChange,
      outraged: swing || playerHit,
      // Entering a close race: the first time, and again if it opens up and tightens once more.
      close_race: close && !wasClose,
      landslide: pace.landslide && !landslideTold && b.cumulativePct > N.landslideAfterPct && gap > N.landslideMargin,
      ballots: sinceBallots + 1 >= pace.ballotsEvery,
    };
    const narration = FRAME_NARRATION_ORDER.find((n) => reasons[n]);
    if (narration === "landslide") landslideTold = true;
    sinceBallots = narration === "ballots" ? 0 : sinceBallots + 1;
    wasClose = close;
    lastGap = gap;
    const lastOfDeciding = deciding && i === batches.length - 1;

    // The anchor speaks: a lead change beats everything, then a unit's first urns (with a cause), then the mood of the race.
    let line: string;
    if (leadChange) line = L.leadChange.replace("{name}", name(top));
    else if (!toldUnits.has(b.unitId)) {
      toldUnits.add(b.unitId);
      const cause = result.causes.find((c) => c.unitId === b.unitId);
      line = cause ? L.unitReported.replace("{unit}", unitName(b.unitId)).replace("{cause}", cause.text) : L.unitReportedQuiet.replace("{unit}", unitName(b.unitId));
    } else if (close) line = L.close.replace("{gap}", String(Math.max(1, Math.ceil(gap))));
    else if (gap > N.landslideMargin && b.cumulativePct > 40) line = L.landslide.replace("{name}", name(top));
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
      ...(narration ? { narration } : {}),
      ...(lastOfDeciding ? { lastBallotPause: N.lastBallotPause } : {}),
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
      frames: frames(state, result, result.batches, ids, !result.runoff),
      intro: result.path === "deputy" ? L.openingDeputy : L.opening,
    },
  ];
  if (result.runoff) {
    const [a, b] = result.runoff.candidates;
    rounds.push({
      title: "2º turno",
      candidates: [a, b],
      frames: frames(state, result, result.runoff.batches, [a, b], true),
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

/** Something the radio narrator tries to say, and when. */
export interface NarrationCue {
  situation: "opening" | FrameNarration | "last_ballot" | "final";
  round: number;
  /** The frame it belongs to (-1: before the round's first frame, for the opening). */
  frame: number;
}

/**
 * The whole night's narration, in order, as election night will try it: the
 * opening, each frame's line, "última urna!" right before the deciding batch,
 * and the call at 100%. Pure: what actually plays also depends on the narrator
 * being free (more important lines interrupt, the rest are dropped).
 */
export function narrationCues(broadcast: Broadcast): NarrationCue[] {
  const cues: NarrationCue[] = [{ situation: "opening", round: 0, frame: -1 }];
  broadcast.rounds.forEach((r, ri) =>
    r.frames.forEach((f, fi) => {
      if (f.lastBallotPause !== undefined) cues.push({ situation: "last_ballot", round: ri, frame: fi });
      if (f.narration) cues.push({ situation: f.narration, round: ri, frame: fi });
    }),
  );
  const last = broadcast.rounds.length - 1;
  cues.push({ situation: "final", round: last, frame: broadcast.rounds[last]!.frames.length - 1 });
  return cues;
}
