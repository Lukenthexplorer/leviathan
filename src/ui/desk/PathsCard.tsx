import { PATH_LABEL, pathStatus, supportingGroups } from "../../chapters/councilman/campaign";
import { BALANCE } from "../../content/balance";
import { CANDIDATES, OPPONENTS } from "../../content/councilman/candidates";
import { GROUPS } from "../../content/councilman/groups";
import type { GameState } from "../../core/types";

const K = BALANCE.campaign;

/**
 * A note pinned to the desk. Before the decision: the three paths and which
 * look open, in words. During the campaign: the race, the clock, the opponents.
 */
export function PathsCard({ state }: { state: GameState }) {
  const c = state.campaign;
  if (c) {
    const left = K.endWeek - state.turn + 1;
    const open = c.attacks.filter((a) => a.status !== "answered").length;
    return (
      <div className="goals campaign-card">
        <div className="goals-title">Campanha · {PATH_LABEL[c.path]}</div>
        <ul>
          <li className="met">
            <span className="goals-check">⚑</span>
            <span>
              <strong>Contra</strong>
              <small>{OPPONENTS[c.path].map((id) => CANDIDATES[id].name).join(", ")}</small>
            </span>
          </li>
          <li className={c.endorsements.length ? "met" : ""}>
            <span className="goals-check">{c.endorsements.length ? "✓" : "○"}</span>
            <span>
              <strong>Apoios</strong>
              <small>{c.endorsements.length ? `${c.endorsements.length} declarados` : "Nenhum ainda"}</small>
            </span>
          </li>
          {open > 0 && (
            <li className="danger">
              <span className="goals-check">!</span>
              <span>
                <strong>Ataques sem resposta</strong>
                <small>{open} ainda custando votos</small>
              </span>
            </li>
          )}
        </ul>
        <div className={`goals-clock ${left <= 2 ? "urgent" : ""}`}>
          Eleição no fim da semana {K.endWeek} · {left > 1 ? `faltam ${left} semanas` : "é esta semana"}
        </div>
      </div>
    );
  }

  const paths = pathStatus(state);
  const groups = supportingGroups(state);
  const left = K.decisionWeek - state.turn;
  return (
    <div className={`goals ${state.turn === 1 ? "intro" : ""}`}>
      {state.turn === 1 && <div className="goals-intro-note">Seu objetivo. Na semana {K.decisionWeek}, você escolhe a eleição.</div>}
      <div className="goals-title">Caminhos</div>
      <ul>
        {paths.map((p) => (
          <li key={p.path} className={p.open ? "met" : ""}>
            <span className="goals-check">{p.open ? "✓" : "○"}</span>
            <span>
              <strong>{PATH_LABEL[p.path]}</strong>
              <small>{p.why}</small>
            </span>
          </li>
        ))}
      </ul>
      <div className="goals-note">
        A seu favor: {groups.length ? groups.map((g) => GROUPS[g].name).join(", ") : "nenhum grupo ainda"}
      </div>
      <div className={`goals-clock ${left <= 4 ? "urgent" : ""}`}>
        Decisão na semana {K.decisionWeek} · {left > 1 ? `faltam ${left} semanas` : left === 1 ? "é na semana que vem" : "é agora"}
      </div>
    </div>
  );
}
