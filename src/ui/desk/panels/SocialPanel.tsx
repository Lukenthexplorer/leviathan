import { GROUPS, GROUP_IDS } from "../../../content/councilman/groups";
import type { GameState } from "../../../core/types";
import { Sheet } from "../Sheet";
import { ActionRow } from "./ActionRow";

/** The phone: one post a week. Explain something, or promise everything. */
export function SocialPanel({ onClose }: { state: GameState; onClose: () => void }) {
  return (
    <Sheet title="Redes sociais" onClose={onClose} wide>
      <p className="panel-intro">Um post por semana. Explicações ganham confiança devagar. Promessas inflamadas viralizam... e as pessoas lembram de promessas.</p>
      {GROUP_IDS.map((g) => (
        <div key={g} className="social-group">
          <div className="social-group-name">
            {GROUPS[g].name} <span className="social-concerns">se importam com {GROUPS[g].concerns.join(", ")}</span>
          </div>
          <ActionRow title="Explicar os fatos" decision={{ kind: "post", style: "informative", group: g }} cta="Postar">
            Uma thread cuidadosa sobre {GROUPS[g].concerns[0]}.
          </ActionRow>
          <ActionRow title="Prometer tudo" decision={{ kind: "post", style: "populist", group: g }} cta="Postar">
            Um vídeo inflamado. Promessas grandes, aplausos maiores.
          </ActionRow>
        </div>
      ))}
    </Sheet>
  );
}
