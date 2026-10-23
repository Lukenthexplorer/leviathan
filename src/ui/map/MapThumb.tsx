import { forwardRef } from "react";
import type { GameState } from "../../core/types";
import { DESK_ART } from "../assets";
import { useHoverLift } from "../feel/useHoverLift";
import { mapModel } from "./model";

/**
 * The folded city map lying on the desk. It's an illustration, so it can't
 * recolour itself like the big map: instead it pulses red and shows a pin
 * count when neighbourhoods are in crisis. Click it to zoom into the living map.
 */
export const MapThumb = forwardRef<HTMLButtonElement, { state: GameState; onOpen: () => void }>(function MapThumb({ state, onOpen }, outer) {
  const [ref, hover] = useHoverLift<HTMLButtonElement>();
  const crises = mapModel(state).districts.filter((d) => d.markers.includes("protest") || d.mood <= -40).length;
  return (
    <button
      ref={(el) => {
        ref.current = el;
        if (typeof outer === "function") outer(el);
        else if (outer) outer.current = el;
      }}
      {...hover}
      className={`map-thumb ${crises ? "unrest" : ""}`}
      onClick={onOpen}
      aria-label="Abrir o mapa da cidade"
      title="Mapa da cidade"
    >
      <img src={DESK_ART.city_map_folded} alt="" />
      {crises > 0 && (
        <span className="map-thumb-alert" aria-label={`${crises} bairros em crise`}>
          {crises}
        </span>
      )}
    </button>
  );
});
