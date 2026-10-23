import type { ReactNode } from "react";
import type { Decision } from "../../../core/types";
import { audio } from "../../audio/audio";
import { useGame } from "../../store";
import { DeskButton } from "../DeskButton";

/**
 * One option inside a drawer panel: a description and a button that types the
 * action onto the agenda. Shows whether it's already queued.
 */
export function ActionRow(props: {
  title: ReactNode;
  children?: ReactNode;
  decision: Decision;
  cta: string;
  disabled?: boolean;
  disabledReason?: string;
  aside?: ReactNode;
}) {
  const pending = useGame((s) => s.pending);
  const queue = useGame((s) => s.queue);
  const unqueue = useGame((s) => s.unqueue);
  const queued = pending.find((p) => JSON.stringify(p) === JSON.stringify(props.decision));

  return (
    <div className={`action-row ${queued ? "queued" : ""} ${props.disabled ? "disabled" : ""}`}>
      <div className="action-main">
        <div className="action-title">{props.title}</div>
        {props.children && <div className="action-desc">{props.children}</div>}
        {props.disabled && props.disabledReason && <div className="action-locked">{props.disabledReason}</div>}
      </div>
      {props.aside && <div className="action-aside">{props.aside}</div>}
      <div className="action-cta">
        {queued ? (
          <DeskButton variant="ghost" onClick={() => (audio.sfx("paper_pickup", { volume: 0.6 }), unqueue(queued))}>
            Na agenda ✓
          </DeskButton>
        ) : (
          <DeskButton disabled={props.disabled} onClick={() => queue(props.decision)}>
            {props.cta}
          </DeskButton>
        )}
      </div>
    </div>
  );
}
