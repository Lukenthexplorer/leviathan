import gsap from "gsap";
import { useLayoutEffect, useMemo, useRef } from "react";
import type { Frame } from "../../chapters/councilman/broadcast";
import { PLAYER, electionUnits } from "../../chapters/councilman/election";
import { REGIONS, type RegionId } from "../../content/councilman/regions";
import type { ElectionResult, PathId } from "../../core/types";
import { portrait } from "../assets";
import { DISTRICTS, MAP_SIZE } from "../map/layout";

/** 80s election-coverage palette: the player is always the yellow line. */
export const CHART_COLORS = ["#ffd23f", "#4fc3f7", "#ef5350", "#66bb6a", "#ba68c8"];

const W = 600;
const H = 300;

/**
 * Hand-rolled SVG line chart (no chart library: it should look like 1989 TV
 * graphics). One line per candidate: % of valid votes against % counted. Each
 * new batch appends a point and the new segment draws itself.
 */
export function LineChart(props: { frames: Frame[]; upTo: number; candidates: string[]; colors: Record<string, string> }) {
  const max = useMemo(() => {
    const top = Math.max(10, ...props.frames.flatMap((f) => Object.values(f.shares)));
    return Math.min(100, Math.ceil((top + 8) / 10) * 10);
  }, [props.frames]);
  const x = (pct: number) => (pct / 100) * W;
  const y = (share: number) => H - (share / max) * H;

  return (
    <svg className="bc-chart" viewBox={`-40 -10 ${W + 60} ${H + 40}`} preserveAspectRatio="none">
      {Array.from({ length: max / 10 + 1 }, (_, i) => i * 10).map((v) => (
        <g key={v}>
          <line x1={0} x2={W} y1={y(v)} y2={y(v)} className="bc-grid" />
          <text x={-8} y={y(v) + 5} className="bc-axis" textAnchor="end">
            {v}%
          </text>
        </g>
      ))}
      {props.candidates.map((id) => (
        <ChartLine key={id} color={props.colors[id]!} player={id === PLAYER} points={props.frames.slice(0, props.upTo + 1).map((f) => [x(f.pct), y(f.shares[id] ?? 0)])} />
      ))}
    </svg>
  );
}

function ChartLine({ points, color, player }: { points: number[][]; color: string; player: boolean }) {
  const path = useRef<SVGPathElement>(null);
  const prevLen = useRef(0);
  const d = points.length ? `M ${points.map((p) => p.join(" ")).join(" L ")}` : "";

  // Draw only the new segment: dasharray = full length, offset from the new part's length to 0.
  useLayoutEffect(() => {
    const el = path.current;
    if (!el || !d) return;
    const len = el.getTotalLength();
    const grown = len - prevLen.current;
    prevLen.current = len;
    gsap.fromTo(el, { strokeDasharray: len, strokeDashoffset: grown }, { strokeDashoffset: 0, duration: 0.6, ease: "power1.out" });
  }, [d]);

  const last = points.at(-1);
  return (
    <g>
      <path ref={path} d={d} fill="none" stroke={color} strokeWidth={player ? 5 : 3} strokeLinejoin="round" strokeLinecap="round" />
      {last && <circle cx={last[0]} cy={last[1]} r={player ? 7 : 5} fill={color} />}
    </g>
  );
}

/** Totals by candidate, numbers ticking up, the leader's bar pulsing. */
export function BarsPanel(props: {
  frame: Frame | undefined;
  candidates: string[];
  colors: Record<string, string>;
  names: Record<string, string>;
  result: ElectionResult;
  partyShort: string;
}) {
  const order = [...props.candidates].sort((a, b) => (props.frame?.totals[b] ?? 0) - (props.frame?.totals[a] ?? 0));
  return (
    <div className="bc-bars">
      {order.map((id) => {
        const c = props.result.candidates.find((x) => x.id === id)!;
        return (
          <BarRow
            key={id}
            name={props.names[id]!}
            party={id === PLAYER ? props.partyShort : c.party}
            portrait={id === PLAYER ? null : portrait(c.portrait)}
            color={props.colors[id]!}
            votes={props.frame?.totals[id] ?? 0}
            share={props.frame?.shares[id] ?? 0}
            leading={props.frame?.leader === id}
          />
        );
      })}
    </div>
  );
}

function BarRow(p: { name: string; party: string; portrait: string | null; color: string; votes: number; share: number; leading: boolean }) {
  const num = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const shown = useRef({ v: 0 });

  // Tween a proxy object, snapped to whole votes: the counter ticks up like a 1989 TV graphic.
  useLayoutEffect(() => {
    const tween = gsap.to(shown.current, {
      v: p.votes,
      duration: 0.9,
      ease: "power1.out",
      snap: { v: 1 },
      onUpdate: () => {
        if (num.current) num.current.textContent = shown.current.v.toLocaleString("pt-BR");
      },
    });
    gsap.to(bar.current, { width: `${p.share}%`, duration: 0.9, ease: "power2.out" });
    return () => {
      tween.kill();
    };
  }, [p.votes, p.share]);

  return (
    <div className={`bc-bar-row ${p.leading ? "leading" : ""}`}>
      <div className="bc-face" style={{ borderColor: p.color }}>
        {p.portrait ? <img src={p.portrait} alt="" /> : <span>{p.name.slice(0, 1)}</span>}
      </div>
      <div className="bc-bar-body">
        <div className="bc-bar-name">
          {p.name} <small>{p.party}</small>
        </div>
        <div className="bc-bar-track">
          <div className="bc-bar-fill" ref={bar} style={{ background: p.color }} />
        </div>
      </div>
      <div className="bc-bar-nums">
        <strong>{p.share.toFixed(1)}%</strong>
        <span ref={num}>0</span>
      </div>
    </div>
  );
}

/** The city (and, for deputy, the state's regions): each counted unit lights up in its local winner's colour. */
export function MiniMap(props: { path: PathId; frames: Frame[]; upTo: number; colors: Record<string, string> }) {
  const winners: Record<string, string> = {};
  for (const f of props.frames.slice(0, props.upTo + 1)) if (f.unitDone && f.unitWinner) winners[f.unitId] = f.unitWinner;
  const regions = electionUnits(props.path).filter((u) => u in REGIONS) as RegionId[];
  return (
    <div className="bc-map">
      <svg viewBox={`0 0 ${MAP_SIZE.width} ${MAP_SIZE.height}`}>
        {Object.entries(DISTRICTS).map(([id, d]) => (
          <polygon
            key={id}
            points={d.polygon.map((p) => p.join(",")).join(" ")}
            fill={winners[id] ? props.colors[winners[id]!]! : "#22314f"}
            stroke="#9fb4e0"
            strokeWidth={6}
            className={winners[id] ? "lit" : ""}
          />
        ))}
      </svg>
      {regions.length > 0 && (
        <div className="bc-regions">
          {regions.map((r) => (
            <span key={r} style={{ background: winners[r] ? props.colors[winners[r]!] : "#22314f" }}>
              {REGIONS[r].name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
