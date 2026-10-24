import { capitalIncome, lawCost } from "../../chapters/councilman/actions";
import { BALANCE } from "../../content/balance";
import type { LawId } from "../../content/councilman/laws";
import type { GameState } from "../../core/types";
import { DESK_ART } from "../assets";
import { useGame } from "../store";

/**
 * A small account book open on the desk: political capital and campaign money,
 * written in by hand, with what this week's agenda will spend and the change
 * since last week.
 */
export function Ledger({ state }: { state: GameState }) {
  const pending = useGame((s) => s.pending);
  const lastWeek = useGame((s) => s.lastWeek);
  const spending = pending.reduce((sum, d) => (d.kind === "proposeLaw" ? sum + lawCost(d.law as LawId, (d.lobby as number) ?? 0) : sum), 0);
  const income = capitalIncome(state);
  const why = [
    `+${BALANCE.capital.weeklyBase} pelo mandato`,
    income.supporters ? `+${Math.floor(income.supporters * BALANCE.capital.perSupportingGroup)} por ${income.supporters} grupo(s) a favor` : "",
    income.bossTrust ? `+${BALANCE.capital.bossTrustBonus} pela confiança da cúpula` : "",
  ]
    .filter(Boolean)
    .join(", ");
  const delta = (now: number, before?: number) => {
    if (before === undefined || now === before) return null;
    return <span className={`ledger-change ${now > before ? "up" : "down"}`}>{now > before ? `▲ ${now - before}` : `▼ ${before - now}`}</span>;
  };
  return (
    <section className="ledger" style={{ backgroundImage: `url(${DESK_ART.ledger})` }} aria-label="Caderno de contas">
      <div className="ledger-line" title={`Por semana: +${income.total} (${why}). Gasto para propor e articular leis.`}>
        <span>Capital político</span>
        <strong>
          {state.player.capital}
          {spending > 0 && <small> −{spending}</small>}
        </strong>
        {delta(state.player.capital, lastWeek?.capital)}
      </div>
      <div className="ledger-line" title="Dinheiro de campanha, em milhares">
        <span>Caixa</span>
        <strong>{state.player.funds} mil</strong>
        {delta(state.player.funds, lastWeek?.funds)}
      </div>
    </section>
  );
}
