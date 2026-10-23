import { useRef } from "react";
import type { GameState, TurnReport } from "../../core/types";
import { weekDate } from "./Calendar";
import { DeskButton } from "./DeskButton";
import { Sheet } from "./Sheet";

/**
 * The Monday briefing: what happened over the week and, crucially, WHY.
 * Every consequence is traced back to the decision that caused it.
 */
export function WeekReport({ report, state, onClose }: { report: TurnReport; state: GameState; onClose: () => void }) {
  const closeRef = useRef<(() => void) | null>(null);
  const exposed = state.history.filter((h) => h.turn === state.turn && h.text.startsWith("Exposed"));
  const newPapers = state.inbox.filter((i) => i.turn >= report.fromTurn).length;

  return (
    <Sheet title={`Monday briefing · ${weekDate(report.toTurn)}`} onClose={onClose} closeRef={closeRef} sound="paper_slide">
      <div className="briefing">
        {exposed.map((h) => (
          <div key={h.text} className="briefing-scandal">
            {h.text}
          </div>
        ))}
        {report.consequences.length === 0 && exposed.length === 0 && <p className="briefing-quiet">A quiet week in Porto Ferro.</p>}
        <ul className="briefing-list">
          {report.consequences.map((c, i) => (
            <li key={i}>
              <div className="briefing-what">{c.label}</div>
              <div className="briefing-why">
                Traced back to: {c.cause.label} (week {c.cause.turn})
              </div>
            </li>
          ))}
        </ul>
        {newPapers > 0 && (
          <p className="briefing-new">
            {newPapers} new paper{newPapers > 1 ? "s" : ""} on your desk.
          </p>
        )}
        <DeskButton variant="primary" onClick={() => closeRef.current?.()}>
          Back to work
        </DeskButton>
      </div>
    </Sheet>
  );
}
