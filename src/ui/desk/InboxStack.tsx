import { useLayoutEffect } from "react";
import { CHARACTERS, type CharacterId } from "../../content/councilman/characters";
import type { DeskItem, GameState } from "../../core/types";
import { portrait } from "../assets";
import { slideIn } from "../feel/feel";
import { useHoverLift } from "../feel/useHoverLift";
import { answerFor, useGame } from "../store";
import { characterName, KIND_LABEL } from "../text";

/** The papers on the desk. New ones slide in one after another. */
export function InboxStack({ state, onOpen }: { state: GameState; onOpen: (item: DeskItem) => void }) {
  const pending = useGame((s) => s.pending);
  if (state.inbox.length === 0) {
    return <div className="inbox-empty">A mesa está limpa. Por enquanto.</div>;
  }
  return (
    <div className="inbox">
      {state.inbox.map((item, i) => (
        <PaperCard key={item.id} item={item} state={state} order={i} answered={!!answerFor(pending, item.id)} onOpen={() => onOpen(item)} />
      ))}
    </div>
  );
}

function PaperCard(props: { item: DeskItem; state: GameState; order: number; answered: boolean; onOpen: () => void }) {
  const { item, state } = props;
  const [ref, hover] = useHoverLift<HTMLButtonElement>();

  useLayoutEffect(() => {
    if (ref.current) slideIn(ref.current, 0.15 + props.order * 0.15);
    // Only on mount: a paper slides in once, when it first lands on the desk.
  }, []);

  const who = item.from as CharacterId | undefined;
  return (
    <button
      ref={ref}
      {...hover}
      className={`paper-card kind-${item.kind} ${props.answered ? "answered" : ""} ${item.kind === "phone" && !props.answered ? "ringing" : ""}`}
      onClick={props.onOpen}
    >
      <div className="paper-card-kind">{KIND_LABEL[item.kind] ?? item.kind}</div>
      {item.kind === "newspaper" && <div className="paper-card-masthead">Correio de Porto Ferro</div>}
      {who && CHARACTERS[who] && <img className="paper-card-portrait" src={portrait(CHARACTERS[who].portrait, item.expression)} alt="" />}
      <div className="paper-card-title">{item.title}</div>
      {who && <div className="paper-card-from">{characterName(state, who)}</div>}
      {props.answered && <div className="paper-card-ink">{item.scheme ? "EM ANDAMENTO" : item.choices?.length ? "RESPONDIDO" : "ARQUIVADO"}</div>}
    </button>
  );
}
