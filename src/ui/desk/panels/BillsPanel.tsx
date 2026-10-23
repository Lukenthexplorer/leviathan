import { lawAvailable, lawCost, lawVoteScore } from "../../../chapters/councilman/actions";
import { BALANCE } from "../../../content/balance";
import { LAWS, LAW_IDS, type LawId } from "../../../content/councilman/laws";
import type { LawDef } from "../../../content/types";
import type { GameState } from "../../../core/types";
import { audio } from "../../audio/audio";
import { useGame } from "../../store";
import { lockReason } from "../../text";
import { DeskButton } from "../DeskButton";
import { Sheet } from "../Sheet";

const L = BALANCE.laws;
const STATUS_LABEL = { proposed: "Em votação", passed: "Aprovado", rejected: "Rejeitado" } as const;
const LOBBY_LABEL = ["Propor", "Articular", "Articular forte"];

/**
 * The bills folder. Every bill costs political capital; spending more
 * ("articular") buys votes in the corridors. You see the whip count first.
 */
export function BillsPanel({ state, onClose }: { state: GameState; onClose: () => void }) {
  return (
    <Sheet title="Projetos de lei" onClose={onClose} wide>
      <p className="panel-intro">
        Propor custa capital político; articular nos corredores custa mais e compra votos. Precisa de {L.passThreshold} votos.
        Você tem <strong>{state.player.capital}</strong> de capital.
      </p>
      {LAW_IDS.map((id) => (
        <LawRow key={id} id={id} state={state} />
      ))}
    </Sheet>
  );
}

function LawRow({ id, state }: { id: LawId; state: GameState }) {
  const pending = useGame((s) => s.pending);
  const queue = useGame((s) => s.queue);
  const unqueue = useGame((s) => s.unqueue);
  const law: LawDef = LAWS[id];
  const status = state.laws[id] ?? "draft";
  const available = lawAvailable(state, id);
  const queued = pending.find((d) => d.kind === "proposeLaw" && d.law === id);
  const base = lawVoteScore(state, id).score;

  return (
    <div className={`action-row law-row ${queued ? "queued" : ""} ${available ? "" : "disabled"}`}>
      <div className="action-main">
        <div className="action-title">
          {law.title} <span className="law-cost">custa {law.cost} de capital</span>
        </div>
        <div className="action-desc">{law.summary}</div>
        {!available && <div className="action-locked">{status !== "draft" ? STATUS_LABEL[status] : lockReason(law.requires)}</div>}
      </div>
      {available && (
        <div className={`whip ${base >= L.passThreshold ? "yes" : "no"}`}>
          <div className="whip-num">
            {base}/{L.passThreshold}
          </div>
          <div className="whip-label">{base >= L.passThreshold ? "Deve passar" : "Faltam votos"}</div>
        </div>
      )}
      {available && (
        <div className="law-actions">
          {queued ? (
            <DeskButton variant="ghost" onClick={() => (audio.sfx("paper_pickup", { volume: 0.6 }), unqueue(queued))}>
              Na agenda ✓ (desfazer)
            </DeskButton>
          ) : (
            Array.from({ length: L.maxLobbyLevel + 1 }, (_, lobby) => {
              const cost = lawCost(id, lobby);
              const { score, passes } = lawVoteScore(state, id, lobby);
              // Don't offer lobbying a bill that already passes without it.
              if (lobby > 0 && base >= L.passThreshold) return null;
              return (
                <DeskButton
                  key={lobby}
                  variant={lobby === 0 ? "default" : "ghost"}
                  disabled={state.player.capital < cost}
                  title={`${score} votos · ${passes ? "deve passar" : "ainda falta"}`}
                  onClick={() => queue({ kind: "proposeLaw", law: id, ...(lobby ? { lobby } : {}) })}
                >
                  {LOBBY_LABEL[lobby]} · {cost} de capital{lobby > 0 ? ` → ${score} votos` : ""}
                </DeskButton>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
