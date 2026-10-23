import { useRef, useState } from "react";
import { CHARACTERS, type CharacterId } from "../../content/councilman/characters";
import { evaluate } from "../../core/conditions";
import type { DeskChoice, DeskItem, GameState } from "../../core/types";
import { portrait } from "../assets";
import { audio } from "../audio/audio";
import { stampDown, tossAway } from "../feel/feel";
import { answerFor, useGame } from "../store";
import { characterName, characterRole, lockReason } from "../text";
import { DeskButton } from "./DeskButton";
import { NewspaperView } from "./NewspaperView";
import { SchemeBoard } from "./SchemeBoard";
import { Sheet } from "./Sheet";

/**
 * An opened document. Answering it brings the stamp down: thud, shake, ink.
 * Answers are queued for the week, so the player can still change their mind
 * until they press Next week.
 */
export function PaperView(props: { item: DeskItem; state: GameState; onClose: () => void }) {
  if (props.item.kind === "newspaper") return <NewspaperView item={props.item} onClose={props.onClose} />;
  if (props.item.scheme) return <SchemeBoard {...props} />;
  return <Document {...props} />;
}

function Document({ item, state, onClose }: { item: DeskItem; state: GameState; onClose: () => void }) {
  const pending = useGame((s) => s.pending);
  const queue = useGame((s) => s.queue);
  const unqueue = useGame((s) => s.unqueue);
  const answer = answerFor(pending, item.id);

  const closeRef = useRef<(() => void) | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const stamp = useRef<HTMLDivElement>(null);
  const ink = useRef<HTMLDivElement>(null);
  const [inkText, setInkText] = useState("");
  const [busy, setBusy] = useState(false);

  function choose(c: DeskChoice) {
    if (busy || !queue({ kind: "choose", itemId: item.id, choiceId: c.id })) return;
    setBusy(true);
    setInkText(c.label);
    audio.sfx("pen_sign", { volume: 0.6 });
    requestAnimationFrame(() => {
      if (!stamp.current || !ink.current || !sheetRef.current) return;
      stampDown(stamp.current, ink.current, sheetRef.current).then(() => setTimeout(() => closeRef.current?.(), 350));
    });
  }

  function file() {
    if (busy || !queue({ kind: "dismiss", itemId: item.id })) return;
    setBusy(true);
    if (sheetRef.current) tossAway(sheetRef.current).then(onClose);
  }

  const who = item.from as CharacterId | undefined;
  const answeredChoice = answer?.kind === "choose" ? item.choices?.find((c) => c.id === answer.choiceId) : undefined;

  return (
    <Sheet onClose={onClose} closeRef={closeRef} sheetRef={sheetRef} sound="paper_slide">
      <div className={`document kind-${item.kind}`}>
        {who && CHARACTERS[who] && (
          <div className="doc-from">
            <img src={portrait(CHARACTERS[who].portrait, item.expression)} alt="" />
            <div>
              <div className="doc-from-name">{characterName(state, who)}</div>
              <div className="doc-from-role">{characterRole(state, who)}</div>
            </div>
          </div>
        )}
        <h2 className="doc-title">{item.title}</h2>
        <div className="doc-body">{item.body}</div>

        {item.choices?.length ? (
          <div className="doc-choices">
            {item.choices.map((c) => {
              const locked = !!c.requires && !evaluate(state, c.requires);
              // Show locked options only when a book unlocks them (it teaches "read to learn").
              // Other secrets stay secret until the player has earned them.
              if (locked && !(c.requires && "bookFinished" in c.requires)) return null;
              return (
                <button
                  key={c.id}
                  className={`doc-choice ${locked ? "locked" : ""} ${answeredChoice?.id === c.id ? "chosen" : ""}`}
                  disabled={locked || busy}
                  onMouseEnter={() => !locked && audio.sfx("ui_hover", { volume: 0.3 })}
                  onClick={() => choose(c)}
                >
                  <span>{c.label}</span>
                  {locked && <em className="doc-lock">{lockReason(c.requires)}</em>}
                </button>
              );
            })}
            {answer && !busy && (
              <DeskButton variant="ghost" onClick={() => unqueue(answer)}>
                Withdraw my answer
              </DeskButton>
            )}
          </div>
        ) : (
          <div className="doc-choices">
            <DeskButton onClick={file} disabled={busy || !!answer}>
              {answer ? "Filed" : "File it away"}
            </DeskButton>
          </div>
        )}

        <div className="doc-ink" ref={ink}>
          {inkText}
        </div>
        <div className="doc-stamp" ref={stamp} />
      </div>
    </Sheet>
  );
}
