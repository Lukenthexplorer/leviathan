import gsap from "gsap";
import { useLayoutEffect, useRef, useState } from "react";
import { schemeThreads, type SchemePicks } from "../../chapters/councilman/actions";
import { SCHEMES, type SchemeId } from "../../content/councilman/schemes";
import type { SchemeDef } from "../../content/types";
import { evaluate } from "../../core/conditions";
import type { DeskItem, GameState } from "../../core/types";
import { audio } from "../audio/audio";
import { shake, tossAway } from "../feel/feel";
import { answerFor, useGame } from "../store";
import { DeskButton } from "./DeskButton";
import { Sheet } from "./Sheet";

/** Risk in words. The numbers stay hidden; the feeling doesn't. */
function riskWord(threads: number): { word: string; level: number } {
  if (threads <= 2) return { word: "Cuidadoso", level: 0 };
  if (threads <= 4) return { word: "Arriscado", level: 1 };
  if (threads <= 6) return { word: "Desleixado", level: 2 };
  return { word: "Imprudente", level: 3 };
}

/**
 * The conspiracy planning board: a corkboard with one column per question
 * (who carries it, how it travels, who knows). Picked cards get a red pin and
 * a red string ties the plan together. Every weak link is spelled out.
 */
export function SchemeBoard({ item, state, onClose }: { item: DeskItem; state: GameState; onClose: () => void }) {
  const def: SchemeDef = SCHEMES[item.scheme as SchemeId];
  const pending = useGame((s) => s.pending);
  const queue = useGame((s) => s.queue);
  const unqueue = useGame((s) => s.unqueue);
  const existing = answerFor(pending, item.id);

  const [picks, setPicks] = useState<SchemePicks>(() => (existing && "picks" in existing ? (existing.picks as SchemePicks | null) : null) ?? {});
  const [busy, setBusy] = useState(false);
  const closeRef = useRef<(() => void) | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const board = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const confidential = useRef<HTMLDivElement>(null);

  const complete = def.slots.every((s) => picks[s.id]);
  const threads = schemeThreads(def, picks);
  const risk = riskWord(threads);

  // Redraw the red string whenever the plan changes. It "draws itself" with a stroke animation.
  useLayoutEffect(() => {
    const b = board.current;
    const path = svg.current?.querySelector("path");
    if (!b || !path) return;
    const origin = b.getBoundingClientRect();
    const points = def.slots
      .map((s) => b.querySelector<HTMLElement>(`[data-pin="${s.id}:${picks[s.id]}"]`))
      .filter((el): el is HTMLElement => !!el)
      .map((el) => {
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2 - origin.left, y: r.top + 10 - origin.top };
      });
    if (points.length < 2) {
      path.setAttribute("d", "");
      return;
    }
    // Strings sag a little between pins.
    const d = points.reduce((acc, p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      const prev = points[i - 1]!;
      return `${acc} Q ${(prev.x + p.x) / 2} ${Math.max(prev.y, p.y) + 40} ${p.x} ${p.y}`;
    }, "");
    path.setAttribute("d", d);
    const len = path.getTotalLength();
    gsap.fromTo(path, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 0.5, ease: "power2.out" });
  }, [picks, def.slots]);

  function pick(slotId: string, optionId: string) {
    if (busy) return;
    audio.sfx("paper_pickup", { volume: 0.5 });
    window.setTimeout(() => audio.sfx("ui_click", { volume: 0.6 }), 90); // the pin goes in
    setPicks((p) => ({ ...p, [slotId]: optionId }));
  }

  function commit() {
    if (!complete || busy) return;
    if (!queue({ kind: "scheme", itemId: item.id, scheme: item.scheme!, picks })) return;
    setBusy(true);
    audio.sfx("stamp_thud", { pitchJitter: 0.05 });
    if (sheetRef.current) shake(sheetRef.current, 12);
    gsap
      .timeline()
      .fromTo(confidential.current, { scale: 2.2, opacity: 0, rotation: -25 }, { scale: 1, opacity: 0.9, rotation: -12, duration: 0.18, ease: "power4.in" })
      .add(() => closeRef.current?.(), "+=0.9");
  }

  function walkAway() {
    if (busy || !queue({ kind: "scheme", itemId: item.id, scheme: item.scheme!, picks: null })) return;
    setBusy(true);
    if (sheetRef.current) tossAway(sheetRef.current).then(onClose);
  }

  return (
    <Sheet onClose={onClose} closeRef={closeRef} sheetRef={sheetRef} className="sheet-scheme" wide sound="drawer_open">
      <div className="scheme-head">
        <div className="scheme-label">CONFIDENCIAL · DESTRUIR APÓS A LEITURA</div>
        <h2 className="scheme-title">{def.title}</h2>
        <p className="scheme-briefing">{def.briefing}</p>
      </div>

      <div className="scheme-board" ref={board}>
        <svg className="scheme-string" ref={svg}>
          <path fill="none" stroke="#b3241b" strokeWidth="3" strokeLinecap="round" />
        </svg>
        {def.slots.map((slot) => (
          <div key={slot.id} className="scheme-col">
            <div className="scheme-question">{slot.question}</div>
            {slot.options.map((o, i) => {
              const locked = !!o.requires && !evaluate(state, o.requires);
              const chosen = picks[slot.id] === o.id;
              const dimmed = !!picks[slot.id] && !chosen;
              return (
                <button
                  key={o.id}
                  data-pin={`${slot.id}:${o.id}`}
                  className={`scheme-card ${chosen ? "chosen" : ""} ${dimmed ? "dimmed" : ""}`}
                  style={{ rotate: `${((i * 37) % 7) - 3}deg` }}
                  disabled={locked || busy}
                  onMouseEnter={() => !locked && audio.sfx("ui_hover", { volume: 0.25 })}
                  onClick={() => pick(slot.id, o.id)}
                >
                  <span className="scheme-pin" />
                  <span className="scheme-card-label">{o.label}</span>
                  <span className="scheme-card-desc">{locked ? "Não é uma opção para você agora." : o.description}</span>
                  {chosen && <span className="scheme-card-weak">⚠ {o.weakness}</span>}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="scheme-foot">
        <div className={`scheme-risk level-${risk.level}`}>
          <span>Pontas soltas:</span>
          <strong>{complete ? risk.word : "…"}</strong>
          <span className="scheme-threads" aria-hidden>
            {Array.from({ length: complete ? threads : 0 }, (_, i) => (
              <i key={i} />
            ))}
          </span>
        </div>
        <div className="scheme-actions">
          {existing && !busy ? (
            <DeskButton variant="ghost" onClick={() => unqueue(existing)}>
              Repensar o plano
            </DeskButton>
          ) : (
            <DeskButton variant="ghost" onClick={walkAway} disabled={busy}>
              {def.abort.label}
            </DeskButton>
          )}
          <DeskButton variant="danger" onClick={commit} disabled={!complete || busy || !!existing}>
            {existing ? "Plano em andamento" : "Pôr em andamento"}
          </DeskButton>
        </div>
      </div>

      <div className="scheme-confidential" ref={confidential}>
        CONFIDENCIAL
      </div>
    </Sheet>
  );
}
