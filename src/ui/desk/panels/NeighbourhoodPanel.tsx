import { fundraiseAmount, projectCooldown } from "../../../chapters/councilman/actions";
import { GROUPS, type GroupId } from "../../../content/councilman/groups";
import { NEIGHBOURHOODS, NEIGHBOURHOOD_IDS, type NeighbourhoodId } from "../../../content/councilman/neighbourhoods";
import { PROJECTS, PROJECT_IDS, type ProjectId } from "../../../content/councilman/projects";
import type { GameState } from "../../../core/types";
import { audio } from "../../audio/audio";
import { useGame } from "../../store";
import { moodWord } from "../../text";
import { DeskButton } from "../DeskButton";
import { Sheet } from "../Sheet";
import { ActionRow } from "./ActionRow";

/** Street work and "Ajuda do gabinete": build roots, or pay for a visible fix. */
export function NeighbourhoodPanel({ state, onClose }: { state: GameState; onClose: () => void }) {
  return (
    <Sheet title="Os bairros" onClose={onClose} wide>
      <p className="panel-intro">
        Bata de porta em porta, apareça na padaria, escute. Ou pague do caixa de campanha uma obra que o bairro veja. Você tem{" "}
        <strong>{state.player.funds} mil</strong>.
      </p>
      <ActionRow title="Vaquinha de campanha" decision={{ kind: "fundraise" }} cta="Arrecadar" aside={<div className="nb-stats">+{fundraiseAmount(state)} mil</div>}>
        Pequenas doações de quem te conhece. Dinheiro limpo e lento: rende mais quanto mais raízes você tem nos bairros.
      </ActionRow>
      {NEIGHBOURHOOD_IDS.map((id) => {
        const def = NEIGHBOURHOODS[id];
        const nb = state.neighbourhoods[id]!;
        const residents = Object.keys(def.residents)
          .map((g) => GROUPS[g as GroupId].name.toLowerCase())
          .join(", ");
        return (
          <div key={id} className="nb-block">
            <ActionRow
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
            <ProjectStrip state={state} nb={id} />
          </div>
        );
      })}
    </Sheet>
  );
}

/** "Ajuda do gabinete": the projects you could pay for in this neighbourhood. */
function ProjectStrip({ state, nb }: { state: GameState; nb: NeighbourhoodId }) {
  const pending = useGame((s) => s.pending);
  const queue = useGame((s) => s.queue);
  const unqueue = useGame((s) => s.unqueue);
  const queued = pending.find((d) => d.kind === "project" && d.nb === nb);
  const wait = projectCooldown(state, nb);

  return (
    <div className="project-strip">
      <span className="project-strip-label">Ajuda do gabinete:</span>
      {queued ? (
        <DeskButton variant="ghost" onClick={() => (audio.sfx("paper_pickup", { volume: 0.6 }), unqueue(queued))}>
          {PROJECTS[(queued as unknown as { project: ProjectId }).project].title} na agenda ✓ (desfazer)
        </DeskButton>
      ) : wait > 0 ? (
        <span className="project-wait">
          Obra recente. Próxima em {wait} semana{wait > 1 ? "s" : ""}.
        </span>
      ) : (
        PROJECT_IDS.map((p) => (
          <DeskButton
            key={p}
            variant="ghost"
            disabled={state.player.funds < PROJECTS[p].cost}
            title={PROJECTS[p].summary}
            onClick={() => queue({ kind: "project", project: p, nb })}
          >
            {PROJECTS[p].title} · {PROJECTS[p].cost} mil
          </DeskButton>
        ))
      )}
    </div>
  );
}
