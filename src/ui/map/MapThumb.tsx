import { forwardRef } from "react";
import type { GameState } from "../../core/types";
import { DESK_ART } from "../assets";
import { DeskObject } from "../desk/DeskObject";
import { mapModel } from "./model";

/**
 * The folded city map lying on the desk: the "Ruas" object. It's an
 * illustration, so it can't recolour itself like the big map: instead it
 * pulses red and shows a pin count when neighbourhoods are in crisis.
 * Clicking it opens the neighbourhoods; from there the map unfolds into the living city.
 */
export const MapThumb = forwardRef<HTMLButtonElement, { state: GameState; onOpen: () => void }>(function MapThumb({ state, onOpen }, ref) {
  const crises = mapModel(state).districts.filter((d) => d.markers.includes("protest") || d.mood <= -40).length;
  return (
    <DeskObject
      ref={ref}
      place="at-map"
      className={`map-thumb ${crises ? "unrest" : ""}`}
      label="Ruas"
      hint={crises ? `Construir uma base · ${crises} ${crises > 1 ? "bairros em crise" : "bairro em crise"}` : "Construir uma base"}
      img={DESK_ART.city_map_folded}
      onClick={onOpen}
    >
      {crises > 0 && (
        <span className="map-thumb-alert" aria-hidden>
          {crises}
        </span>
      )}
    </DeskObject>
  );
});
