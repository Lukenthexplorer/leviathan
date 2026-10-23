import { BOOKS, BOOK_IDS } from "../../../content/councilman/books";
import type { GameState } from "../../../core/types";
import { Sheet } from "../Sheet";
import { ActionRow } from "./ActionRow";

/** The bookshelf. Reading takes weeks, and changes what you can do. */
export function LibraryPanel({ state, onClose }: { state: GameState; onClose: () => void }) {
  const reading = state.books.reading;
  return (
    <Sheet title="A estante" onClose={onClose} wide>
      <p className="panel-intro">Um livro por vez. Começar outro devolve o atual para a estante.</p>
      {BOOK_IDS.map((id) => {
        const b = BOOKS[id];
        const finished = state.books.finished.includes(id);
        const isReading = reading?.id === id;
        return (
          <ActionRow
            key={id}
            title={
              <span>
                {b.title} <small className="book-author">{b.author}, {b.year}</small>
              </span>
            }
            decision={{ kind: "read", book: id }}
            cta="Começar a ler"
            disabled={finished || isReading}
            disabledReason={finished ? "Lido" : isReading ? `Lendo: ${reading!.progress} de ${b.weeksToRead} semanas` : ""}
            aside={<div className="book-weeks">{b.weeksToRead} semanas</div>}
          >
            {b.unlocksText}
          </ActionRow>
        );
      })}
    </Sheet>
  );
}
