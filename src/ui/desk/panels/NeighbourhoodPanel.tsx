import { GROUPS, type GroupId } from "../../../content/councilman/groups";
import { NEIGHBOURHOODS, NEIGHBOURHOOD_IDS } from "../../../content/councilman/neighbourhoods";
import type { GameState } from "../../../core/types";
import { moodWord } from "../../text";
import { Sheet } from "../Sheet";
import { ActionRow } from "./ActionRow";

/** Street work: build roots in a neighbourhood. Roots compound. */
export function NeighbourhoodPanel({ state, onClose }: { state: GameState; onClose: () => void }) {
  return (
    <Sheet title="The neighbourhoods" onClose={onClose} wide>
      <p className="panel-intro">Knock on doors, show up at the bakery, listen. The more roots you have somewhere, the more each visit counts.</p>
      {NEIGHBOURHOOD_IDS.map((id) => {
        const def = NEIGHBOURHOODS[id];
        const nb = state.neighbourhoods[id]!;
        const residents = Object.keys(def.residents)
          .map((g) => GROUPS[g as GroupId].name.toLowerCase())
          .join(", ");
        return (
          <ActionRow
            key={id}
            title={def.name}
            decision={{ kind: "neighbourhood", id }}
            cta="Walk the streets"
            aside={
              <div className="nb-stats">
                <div>Mood: {moodWord(nb.mood)}</div>
                <div>Your roots: {nb.base}%</div>
              </div>
            }
          >
            {def.description} <em>Home to {residents}.</em>
          </ActionRow>
        );
      })}
    </Sheet>
  );
}
