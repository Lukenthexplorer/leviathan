import { BOOKS, BOOK_IDS } from "../../../content/councilman/books";
import type { GameState } from "../../../core/types";
import { Sheet } from "../Sheet";
import { ActionRow } from "./ActionRow";

/** The bookshelf. Reading takes weeks, and changes what you can do. */
export function LibraryPanel({ state, onClose }: { state: GameState; onClose: () => void }) {
  const reading = state.books.reading;
  return (
    <Sheet title="The bookshelf" onClose={onClose} wide>
      <p className="panel-intro">One book at a time. Starting a new one puts the current one back on the shelf.</p>
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
            cta="Start reading"
            disabled={finished || isReading}
            disabledReason={finished ? "Read" : isReading ? `Reading: ${reading!.progress} of ${b.weeksToRead} weeks read` : ""}
            aside={<div className="book-weeks">{b.weeksToRead} weeks</div>}
          >
            {b.unlocksText}
          </ActionRow>
        );
      })}
    </Sheet>
  );
}
