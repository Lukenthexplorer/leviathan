import { mediaChannel } from "../../../chapters/councilman/actions";
import { GROUPS, GROUP_IDS } from "../../../content/councilman/groups";
import { yearOf } from "../../../core/calendar";
import type { GameState } from "../../../core/types";
import { Sheet } from "../Sheet";
import { ActionRow } from "./ActionRow";

/**
 * Reaching the public, through the media of the era: radio and sound trucks in
 * 1989, TV later, then the internet, then social media.
 */
export function MediaPanel({ state, onClose }: { state: GameState; onClose: () => void }) {
  const calm = mediaChannel(state, "informative");
  const loud = mediaChannel(state, "populist");
  return (
    <Sheet title={`Imprensa · ${yearOf(state.turn)}`} onClose={onClose} wide>
      <p className="panel-intro">
        Uma aparição por semana. Explicar com calma conquista confiança devagar. Promessas no grito conquistam aplausos... e as pessoas
        lembram de promessas.
      </p>
      {GROUP_IDS.map((g) => {
        const fill = (t: string) => t.replace("{topic}", GROUPS[g].concerns[0]!).replace("{group}", GROUPS[g].name.toLowerCase());
        return (
          <div key={g} className="social-group">
            <div className="social-group-name">
              {GROUPS[g].name} <span className="social-concerns">se importam com {GROUPS[g].concerns.join(", ")}</span>
            </div>
            <ActionRow title={calm.name} decision={{ kind: "media", style: "informative", group: g }} cta="Agendar">
              {fill(calm.description)}
            </ActionRow>
            <ActionRow title={loud.name} decision={{ kind: "media", style: "populist", group: g }} cta="Agendar">
              {fill(loud.description)}
            </ActionRow>
          </div>
        );
      })}
    </Sheet>
  );
}
