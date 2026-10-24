import {
  cabosCost,
  endorserAvailable,
  lawHelpedUnits,
  rallyCost,
  voteBuyingAvailable,
} from "../../../chapters/councilman/campaign";
import { BALANCE } from "../../../content/balance";
import { ENDORSERS, ENDORSER_IDS } from "../../../content/councilman/endorsers";
import { LAWS, LAW_IDS } from "../../../content/councilman/laws";
import { NEIGHBOURHOODS, NEIGHBOURHOOD_IDS, type NeighbourhoodId } from "../../../content/councilman/neighbourhoods";
import { REGIONS, REGION_IDS } from "../../../content/councilman/regions";
import type { Decision, GameState } from "../../../core/types";
import { audio } from "../../audio/audio";
import { useGame } from "../../store";
import { DeskButton } from "../DeskButton";
import { Sheet } from "../Sheet";
import { ActionRow } from "./ActionRow";

const K = BALANCE.campaign;

/** Presence is felt, not measured. */
export function presenceWord(v: number): string {
  if (v < 5) return "Ninguém te conhece";
  if (v < 15) return "Alguns cartazes";
  if (v < 30) return "Seu nome circula";
  if (v < 50) return "Você está em todo lugar";
  return "A campanha domina";
}

/** The campaign folder: streets, endorsements, the record, and (deputy) the interior. */
export function CampaignPanel({ state, onClose }: { state: GameState; onClose: () => void }) {
  const c = state.campaign!;
  const passed = LAW_IDS.filter((l) => state.laws[l] === "passed");
  return (
    <Sheet title="Campanha" onClose={onClose} wide>
      <p className="panel-intro">
        A Câmara está em recesso. Até a eleição, é rua, palanque e voto. Você tem <strong>{state.player.funds} mil</strong> e{" "}
        <strong>{state.player.capital} de capital</strong>.
      </p>

      <h3 className="panel-section">Nas ruas</h3>
      {NEIGHBOURHOOD_IDS.map((nb) => (
        <StreetRow key={nb} state={state} nb={nb} />
      ))}

      <h3 className="panel-section">Apoios</h3>
      {ENDORSER_IDS.map((who) => {
        const e = ENDORSERS[who];
        const done = c.endorsements.includes(who);
        return (
          <ActionRow
            key={who}
            title={e.name}
            decision={{ kind: "endorsement", who }}
            cta={`Pedir apoio · ${K.endorsementCapital} de capital`}
            disabled={done || !endorserAvailable(state, who)}
            disabledReason={done ? "Já declarou apoio" : e.lockedText}
          >
            {e.promise}
          </ActionRow>
        );
      })}

      {passed.length > 0 && (
        <>
          <h3 className="panel-section">Prestação de contas</h3>
          {passed.map((law) => (
            <ActionRow
              key={law}
              title={`Propaganda: ${LAWS[law].title}`}
              decision={{ kind: "recordAd", law }}
              cta={`Veicular · ${K.paidMediaCost} mil`}
              disabled={!!state.flags[`record_ad_${law}`]}
              disabledReason="Já foi tema de propaganda"
            >
              Mostrar o que essa lei fez. Pesa onde ela ajudou:{" "}
              {lawHelpedUnits(law)
                .map((u) => NEIGHBOURHOODS[u].name)
                .join(", ") || "em nenhum bairro em especial"}
              .
            </ActionRow>
          ))}
        </>
      )}

      {c.path === "deputy" && (
        <>
          <h3 className="panel-section">Interior do estado</h3>
          {REGION_IDS.map((r) => (
            <ActionRow
              key={r}
              title={REGIONS[r].name}
              decision={{ kind: "interiorTrip", region: r }}
              cta={`Viajar · ${K.interiorTripCost} mil`}
              aside={<div className="nb-stats">{presenceWord(c.presence[r] ?? 0)}</div>}
            >
              {REGIONS[r].description} <em>Uma semana fora de Porto Ferro.</em>
            </ActionRow>
          ))}
        </>
      )}
    </Sheet>
  );
}

/** Planning a street action already sounds like it: the truck passes, the crowd roars. */
function actionSound(d: Decision) {
  if (d.kind === "soundTruck") audio.sfx("sound_truck", { volume: 0.6, pitchJitter: 0, fadeOutAfterMs: 3500 });
  if (d.kind === "rally") audio.sfx("rally_crowd", { volume: 0.6, pitchJitter: 0.03 });
}

function StreetRow({ state, nb }: { state: GameState; nb: NeighbourhoodId }) {
  const pending = useGame((s) => s.pending);
  const queue = useGame((s) => s.queue);
  const unqueue = useGame((s) => s.unqueue);
  const c = state.campaign!;
  const here = pending.filter((d) => "nb" in d && d.nb === nb && ["rally", "soundTruck", "cabos", "buyVotes"].includes(d.kind));
  const button = (d: Decision, label: string, cost: number) => {
    const queued = here.find((p) => JSON.stringify(p) === JSON.stringify(d));
    return queued ? (
      <DeskButton key={label} variant="ghost" onClick={() => unqueue(queued)}>
        {label} ✓
      </DeskButton>
    ) : (
      <DeskButton key={label} variant="ghost" disabled={state.player.funds < cost} onClick={() => (actionSound(d), queue(d))}>
        {label} · {cost} mil
      </DeskButton>
    );
  };
  return (
    <div className="street-row">
      <div className="street-name">
        <strong>{NEIGHBOURHOODS[nb].name}</strong>
        <small>
          {presenceWord(c.presence[nb] ?? 0)}
          {c.cabos[nb] ? ` · ${c.cabos[nb]} cabo${c.cabos[nb]! > 1 ? "s" : ""} trabalhando` : ""}
        </small>
      </div>
      <div className="street-actions">
        {button({ kind: "rally", nb }, "Comício", rallyCost(state, nb))}
        {button({ kind: "soundTruck", nb }, "Carro de som", K.soundTruckCost)}
        {button({ kind: "cabos", nb }, "Cabos eleitorais", cabosCost(false))}
        {button({ kind: "cabos", nb, cash: true }, "Cabos (em dinheiro, sem recibo)", cabosCost(true))}
        {voteBuyingAvailable(state) && button({ kind: "buyVotes", nb }, "Resolver do jeito antigo", K.voteBuyingCost)}
      </div>
    </div>
  );
}
