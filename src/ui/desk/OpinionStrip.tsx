import gsap from "gsap";
import { useLayoutEffect, useRef } from "react";
import { GROUPS, GROUP_IDS, type GroupId } from "../../content/councilman/groups";
import type { GameState } from "../../core/types";
import { allOpinions } from "../../core/groups";
import { audio } from "../audio/audio";

/**
 * The six social groups across the top of the desk. When a week resolves,
 * each meter ticks from its old value to the new one, one after another,
 * with a rising or falling tone: opinion shifts you can hear.
 */
export function OpinionStrip({ state }: { state: GameState }) {
  const ops = allOpinions(state);
  return (
    <div className="opinions">
      {GROUP_IDS.map((g, i) => (
        <OpinionMeter key={g} id={g} value={ops[g] ?? 0} order={i} />
      ))}
    </div>
  );
}

function OpinionMeter({ id, value, order }: { id: GroupId; value: number; order: number }) {
  const root = useRef<HTMLDivElement>(null);
  const num = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const shown = useRef(value);

  const paint = (v: number) => {
    const r = Math.round(v);
    if (num.current) num.current.textContent = `${r > 0 ? "+" : ""}${r}`;
    if (bar.current) {
      const w = (Math.abs(v) / 100) * 50;
      bar.current.style.width = `${w}%`;
      bar.current.style.left = v >= 0 ? "50%" : `${50 - w}%`;
      bar.current.className = `meter-fill ${v >= 0 ? "pos" : "neg"}`;
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
        gsap.fromTo(root.current, { backgroundColor: up ? "#3d5a3a" : "#6a2a24" }, { backgroundColor: "#00000000", duration: 1.4 });
      },
      onUpdate: () => paint(counter.v),
    });
    return () => {
      tween.kill();
    };
  }, [value, order]);

  return (
    <div className="meter" ref={root} title={GROUPS[id].description}>
      <div className="meter-head">
        <span className="meter-name">{GROUPS[id].name}</span>
        <span className="meter-num" ref={num} />
      </div>
      <div className="meter-track">
        <div className="meter-zero" />
        <div className="meter-fill" ref={bar} />
      </div>
    </div>
  );
}
