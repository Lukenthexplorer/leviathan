import { lawAvailable, lawVoteScore } from "../../../chapters/councilman/actions";
import { BALANCE } from "../../../content/balance";
import { LAWS, LAW_IDS } from "../../../content/councilman/laws";
import type { LawDef } from "../../../content/types";
import type { GameState } from "../../../core/types";
import { lockReason } from "../../text";
import { Sheet } from "../Sheet";
import { ActionRow } from "./ActionRow";

const STATUS_LABEL = { proposed: "In the plenary", passed: "Passed", rejected: "Voted down" } as const;

/** The bills folder, with a whip count: you know the votes before you commit. */
export function BillsPanel({ state, onClose }: { state: GameState; onClose: () => void }) {
  return (
    <Sheet title="Bills folder" onClose={onClose} wide>
      <p className="panel-intro">Propose a bill and the Câmara votes at the end of the week. Count your votes first.</p>
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
            cta="Propose"
            disabled={!available}
            disabledReason={status !== "draft" ? STATUS_LABEL[status] : lockReason(law.requires)}
            aside={
              status === "draft" && available ? (
                <div className={`whip ${score >= needed ? "yes" : "no"}`}>
                  <div className="whip-num">
                    {score}/{needed}
                  </div>
                  <div className="whip-label">{score >= needed ? "Likely to pass" : "Short of votes"}</div>
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
