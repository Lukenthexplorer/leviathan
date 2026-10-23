import { useRef } from "react";
import { weekDate } from "../../core/calendar";
import type { DeskItem } from "../../core/types";
import { answerFor, useGame } from "../store";
import { DeskButton } from "./DeskButton";
import { Sheet } from "./Sheet";

/**
 * The Correio de Porto Ferro. Newspapers are how the game explains itself:
 * every story links what happened to something the player did.
 */
export function NewspaperView({ item, onClose }: { item: DeskItem; onClose: () => void }) {
  const pending = useGame((s) => s.pending);
  const queue = useGame((s) => s.queue);
  const closeRef = useRef<(() => void) | null>(null);
  const filed = !!answerFor(pending, item.id);
  const scandal = item.title.startsWith("EXCLUSIVE");

  function file() {
    if (filed || queue({ kind: "dismiss", itemId: item.id })) closeRef.current?.();
  }

  return (
    <Sheet onClose={onClose} closeRef={closeRef} entrance="spin" sound="newspaper_spin" className="sheet-newspaper" wide>
      <div className={`newspaper ${scandal ? "scandal" : ""}`}>
        <div className="newspaper-masthead">CORREIO DE PORTO FERRO</div>
        <div className="newspaper-meta">
          <span>Fundado em 1921</span>
          <span>{weekDate(item.turn)}</span>
          <span>Cr$ 150</span>
        </div>
        <h1 className="newspaper-headline">{item.title}</h1>
        <p className="newspaper-body">{item.body}</p>
        <div className="newspaper-filler" aria-hidden>
          <span />
          <span />
          <span />
        </div>
      </div>
      <div className="newspaper-actions">
        <DeskButton onClick={file}>{filed ? "Deixar de lado" : "Arquivar o recorte"}</DeskButton>
      </div>
    </Sheet>
  );
}
