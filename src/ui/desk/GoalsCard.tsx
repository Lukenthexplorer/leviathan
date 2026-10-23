import { councilmanGoals, goalsMet } from "../../chapters/councilman/goals";
import { BALANCE } from "../../content/balance";
import type { GameState } from "../../core/types";
import { audio } from "../audio/audio";
import { useGame } from "../store";
import { DeskButton } from "./DeskButton";

const C = BALANCE.councilman;

/** A note pinned to the desk: the three things you need to run for mayor, and the clock. */
export function GoalsCard({ state }: { state: GameState }) {
  const goals = councilmanGoals(state);
  const left = C.conventionWeek - state.turn;
  const canAsk = goalsMet(state) && state.turn >= C.nominationOpensWeek;
  const pending = useGame((s) => s.pending);
  const queue = useGame((s) => s.queue);
  const unqueue = useGame((s) => s.unqueue);
  const asked = pending.find((d) => d.kind === "seekNomination");

  return (
    <div className="goals">
      <div className="goals-title">Rumo à prefeitura</div>
      <ul>
        {goals.map((g) => (
          <li key={g.id} className={g.met ? "met" : ""}>
            <span className="goals-check">{g.met ? "✓" : "○"}</span>
            <span>
              <strong>{g.label}</strong>
              <small>{g.progress}</small>
            </span>
          </li>
        ))}
      </ul>
      <div className={`goals-clock ${left <= C.conventionWarningWeeks ? "urgent" : ""}`}>
        Convenção na semana {C.conventionWeek} · {left > 1 ? `faltam ${left} semanas` : left === 1 ? "é na semana que vem" : "é agora"}
      </div>
      {canAsk ? (
        <div className="goals-ask">
          {asked ? (
            <DeskButton variant="ghost" onClick={() => (audio.sfx("paper_pickup"), unqueue(asked))}>
              Indicação pedida ✓ (desfazer)
            </DeskButton>
          ) : (
            <DeskButton variant="primary" onClick={() => queue({ kind: "seekNomination" })}>
              Pedir a indicação
            </DeskButton>
          )}
        </div>
      ) : state.turn < C.nominationOpensWeek ? (
        <div className="goals-note">Pré-candidaturas a partir da semana {C.nominationOpensWeek}</div>
      ) : null}
    </div>
  );
}
