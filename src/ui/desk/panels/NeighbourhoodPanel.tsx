import { GROUPS, type GroupId } from "../../../content/councilman/groups";
import { NEIGHBOURHOODS, NEIGHBOURHOOD_IDS } from "../../../content/councilman/neighbourhoods";
import type { GameState } from "../../../core/types";
import { moodWord } from "../../text";
import { Sheet } from "../Sheet";
import { ActionRow } from "./ActionRow";

/** Street work: build roots in a neighbourhood. Roots compound. */
export function NeighbourhoodPanel({ state, onClose }: { state: GameState; onClose: () => void }) {
  return (
    <Sheet title="Os bairros" onClose={onClose} wide>
      <p className="panel-intro">Bata de porta em porta, apareça na padaria, escute. Quanto mais raízes você tem num lugar, mais cada visita conta.</p>
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
            cta="Percorrer as ruas"
            aside={
              <div className="nb-stats">
                <div>Clima: {moodWord(nb.mood)}</div>
                <div>Suas raízes: {nb.base}%</div>
              </div>
            }
          >
            {def.description} <em>Moram aqui: {residents}.</em>
          </ActionRow>
        );
      })}
    </Sheet>
  );
}
