import { useRef } from "react";
import { PLAYER } from "../../chapters/councilman/election";
import { CANDIDATES, type CandidateId } from "../../content/councilman/candidates";
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

  const newPapers = state.inbox.filter((i) => i.turn >= report.fromTurn).length;

  return (
    <Sheet title={`Resumo de segunda · ${weekDate(report.toTurn)}`} onClose={onClose} closeRef={closeRef} sound="paper_slide">
      <div className="briefing">
        {report.exposed.map((d) => (
          <div key={d.id} className="briefing-scandal">
            Veio à tona: {d.label}
          </div>
        ))}
        {report.consequences.length === 0 && report.exposed.length === 0 && <p className="briefing-quiet">Uma semana tranquila em Porto Ferro.</p>}
        <ul className="briefing-list">
          {report.consequences.map((c, i) => (
            <li key={i}>
              <div className="briefing-what">{c.label}</div>
              <div className="briefing-why">
                Origem: {c.cause.label} (semana {c.cause.turn})
              </div>
            </li>
          ))}
        </ul>
        <Poll state={state} />
        {newPapers > 0 && (
          <p className="briefing-new">
            {newPapers} {newPapers > 1 ? "papéis novos" : "papel novo"} na sua mesa.
          </p>
        )}
        <DeskButton variant="primary" onClick={() => closeRef.current?.()}>
          Ao trabalho
        </DeskButton>
      </div>
    </Sheet>
  );
}

/**
 * The weekly poll: the vote model as it stood a week ago, city-wide, rounded.
 * Deterministic, but always one week behind, so there's still suspense.
 */
function Poll({ state }: { state: GameState }) {
  const poll = state.campaign?.polls.at(-1);
  if (!poll) return null;
  const rows = Object.entries(poll.shares).sort((a, b) => b[1] - a[1]);
  const name = (id: string) => (id === PLAYER ? state.player.name : CANDIDATES[id as CandidateId].name);
  return (
    <div className="poll">
      <div className="poll-title">Pesquisa IPOF · Instituto Porto-Ferrense de Opinião</div>
      {rows.map(([id, pct]) => (
        <div key={id} className={`poll-row ${id === PLAYER ? "me" : ""}`}>
          <span>{name(id)}</span>
          <span className="poll-bar" style={{ width: `${pct * 2}%` }} />
          <strong>{pct}%</strong>
        </div>
      ))}
      <div className="poll-note">Margem de erro de 3 pontos. Pesquisa feita na semana passada.</div>
    </div>
  );
}
