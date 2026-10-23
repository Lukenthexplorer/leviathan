import { GROUPS, GROUP_IDS } from "../../../content/councilman/groups";
import type { GameState } from "../../../core/types";
import { Sheet } from "../Sheet";
import { ActionRow } from "./ActionRow";

/** The phone: one post a week. Explain something, or promise everything. */
export function SocialPanel({ onClose }: { state: GameState; onClose: () => void }) {
  return (
    <Sheet title="Social media" onClose={onClose} wide>
      <p className="panel-intro">One post a week. Explainers win trust slowly. Fiery promises go viral... and people remember promises.</p>
      {GROUP_IDS.map((g) => (
        <div key={g} className="social-group">
          <div className="social-group-name">
            {GROUPS[g].name} <span className="social-concerns">cares about {GROUPS[g].concerns.join(", ")}</span>
          </div>
          <ActionRow title="Explain the facts" decision={{ kind: "post", style: "informative", group: g }} cta="Post">
            A careful thread on {GROUPS[g].concerns[0]}.
          </ActionRow>
          <ActionRow title="Promise them everything" decision={{ kind: "post", style: "populist", group: g }} cta="Post">
            A fiery video. Big claims, bigger applause.
          </ActionRow>
        </div>
      ))}
    </Sheet>
  );
}
