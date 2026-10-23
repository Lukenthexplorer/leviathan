import { lawAvailable, lawVoteScore } from "../../../chapters/councilman/actions";
import { BALANCE } from "../../../content/balance";
import { LAWS, LAW_IDS } from "../../../content/councilman/laws";
import type { LawDef } from "../../../content/types";
import type { GameState } from "../../../core/types";
import { lockReason } from "../../text";
import { Sheet } from "../Sheet";
import { ActionRow } from "./ActionRow";

const STATUS_LABEL = { proposed: "Em votação", passed: "Aprovado", rejected: "Rejeitado" } as const;

/** The bills folder, with a whip count: you know the votes before you commit. */
export function BillsPanel({ state, onClose }: { state: GameState; onClose: () => void }) {
  return (
    <Sheet title="Projetos de lei" onClose={onClose} wide>
      <p className="panel-intro">Proponha um projeto e a Câmara vota no fim da semana. Conte os votos antes.</p>
      {LAW_IDS.map((id) => {
        const law: LawDef = LAWS[id];
        const status = state.laws[id] ?? "draft";
        const available = lawAvailable(state, id);
        const { score } = lawVoteScore(state, id);
        const needed = BALANCE.laws.passThreshold;
        return (
          <ActionRow
            key={id}
            title={law.title}
            decision={{ kind: "proposeLaw", law: id }}
            cta="Propor"
            disabled={!available}
            disabledReason={status !== "draft" ? STATUS_LABEL[status] : lockReason(law.requires)}
            aside={
              status === "draft" && available ? (
                <div className={`whip ${score >= needed ? "yes" : "no"}`}>
                  <div className="whip-num">
                    {score}/{needed}
                  </div>
                  <div className="whip-label">{score >= needed ? "Deve passar" : "Faltam votos"}</div>
                </div>
              ) : null
            }
          >
            {law.summary}
          </ActionRow>
        );
      })}
    </Sheet>
  );
}
