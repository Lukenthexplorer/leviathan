import gsap from "gsap";
import { useLayoutEffect, useRef } from "react";
import { BALANCE } from "../../content/balance";
import type { Decision, GameState } from "../../core/types";
import { audio } from "../audio/audio";
import { agendaOf, useGame } from "../store";
import { describeDecision } from "../text";

/** The notepad where this week's actions are typed in. Three lines, three actions. */
export function AgendaPad({ state }: { state: GameState }) {
  const pending = useGame((s) => s.pending);
  const notice = useGame((s) => s.notice);
  const unqueue = useGame((s) => s.unqueue);
  const agenda = agendaOf(pending);
  const answers = pending.length - agenda.length;
  const empty = BALANCE.turn.agendaSlots - agenda.length;

  return (
    <div className="agenda">
      <div className="agenda-title">This week</div>
      <ol className="agenda-lines">
        {agenda.map((d) => (
          <AgendaLine key={JSON.stringify(d)} text={describeDecision(state, d)} onRemove={() => removeLine(d)} />
        ))}
        {Array.from({ length: Math.max(0, empty) }, (_, i) => (
          <li key={`empty${i}`} className="agenda-empty">
            ________________
          </li>
        ))}
      </ol>
      {answers > 0 && <div className="agenda-answers">{answers} paper{answers > 1 ? "s" : ""} answered</div>}
      {notice && <div className="agenda-notice">{notice}</div>}
    </div>
  );

  function removeLine(d: Decision) {
    audio.sfx("paper_pickup", { volume: 0.6 });
    unqueue(d);
  }
}

/** Typed in letter by letter, with a key sound every few characters. */
function AgendaLine({ text, onRemove }: { text: string; onRemove: () => void }) {
  const span = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const el = span.current;
    if (!el) return;
    const state = { n: 0 };
    const tween = gsap.to(state, {
      n: text.length,
      duration: Math.min(0.9, text.length * 0.025),
      ease: "none",
      onUpdate: () => {
        const n = Math.round(state.n);
        if (n !== el.textContent?.length && n % 3 === 0) audio.sfx("typewriter_key", { volume: 0.35, pitchJitter: 0.15 });
        el.textContent = text.slice(0, n);
      },
    });
    return () => {
      tween.kill();
    };
  }, [text]);

  return (
    <li className="agenda-line">
      <span ref={span} />
      <button className="agenda-x" onClick={onRemove} aria-label="Remove">
        ×
      </button>
    </li>
  );
}
