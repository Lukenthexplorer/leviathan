import gsap from "gsap";
import { useLayoutEffect, useRef } from "react";
import { GROUPS, GROUP_IDS, type GroupId } from "../../content/councilman/groups";
import type { GameState } from "../../core/types";
import { allOpinions } from "../../core/groups";
import { DESK_ART } from "../assets";
import { audio } from "../audio/audio";
import { useGame } from "../store";

/**
 * The opinion poll, as a newspaper clipping taped to the desk: what each of the
 * six groups thinks of you, in big printed numbers, with a small ▲▼ for the
 * change since last week. When a week resolves, each number ticks from its old
 * value to the new one, one after another, with a rising or falling tone.
 */
export function PollClipping({ state }: { state: GameState }) {
  const ops = allOpinions(state);
  const lastWeek = useGame((s) => s.lastWeek);
  return (
    <section className="poll-clipping" style={{ backgroundImage: `url(${DESK_ART.poll_clipping})` }} aria-label="Pesquisa de opinião">
      <span className="poll-tape" aria-hidden />
      <header className="poll-head">
        <strong>PESQUISA DE OPINIÃO</strong>
        <span>O que cada grupo pensa de você · de −100 a +100</span>
      </header>
      <div className="poll-groups">
        {GROUP_IDS.map((g, i) => (
          <PollFigure key={g} id={g} value={ops[g] ?? 0} before={lastWeek?.opinions[g]} order={i} />
        ))}
      </div>
    </section>
  );
}

function PollFigure({ id, value, before, order }: { id: GroupId; value: number; before?: number; order: number }) {
  const root = useRef<HTMLDivElement>(null);
  const num = useRef<HTMLSpanElement>(null);
  const shown = useRef(value);
  const change = before === undefined ? 0 : Math.round(value) - Math.round(before);

  const paint = (v: number) => {
    const r = Math.round(v);
    if (num.current) {
      num.current.textContent = `${r > 0 ? "+" : ""}${r}`;
      num.current.className = `poll-num ${r > 0 ? "pos" : r < 0 ? "neg" : ""}`;
    }
  };

  useLayoutEffect(() => {
    const from = shown.current;
    shown.current = value;
    if (Math.round(from) === Math.round(value)) {
      paint(value);
      return;
    }
    const up = value > from;
    const counter = { v: from };
    const tween = gsap.to(counter, {
      v: value,
      duration: 1.1,
      delay: 0.5 + order * 0.18,
      ease: "power2.out",
      onStart: () => {
        audio.sfx(up ? "opinion_up" : "opinion_down", { volume: 0.4 });
        gsap.fromTo(root.current, { backgroundColor: up ? "#7aa65f55" : "#c0533f55" }, { backgroundColor: "#00000000", duration: 1.4 });
      },
      onUpdate: () => paint(counter.v),
    });
    return () => {
      tween.kill();
    };
  }, [value, order]);

  const label = change > 0 ? `subiu ${change}` : change < 0 ? `caiu ${-change}` : "sem mudança";
  return (
    <div className="poll-figure" ref={root} title={GROUPS[id].description} aria-label={`${GROUPS[id].name}: ${Math.round(value)}, ${label} desde a semana passada`}>
      <span className="poll-name">{GROUPS[id].name}</span>
      <span className="poll-num" ref={num} />
      <span className={`poll-change ${change > 0 ? "up" : change < 0 ? "down" : ""}`} aria-hidden>
        {change > 0 ? `▲ ${change}` : change < 0 ? `▼ ${-change}` : "—"}
      </span>
    </div>
  );
}
