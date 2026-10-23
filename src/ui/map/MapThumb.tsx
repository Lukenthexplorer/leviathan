import { forwardRef } from "react";
import type { GameState } from "../../core/types";
import { useHoverLift } from "../feel/useHoverLift";
import { DISTRICTS, MAP_SIZE, SEA } from "./layout";
import { mapModel } from "./model";

const hex = (n: number) => `#${n.toString(16).padStart(6, "0")}`;
const pts = (p: [number, number][]) => p.map(([x, y]) => `${x},${y}`).join(" ");

/** The folded city plan lying on the desk: a live miniature (SVG) of the Pixi map. */
export const MapThumb = forwardRef<HTMLButtonElement, { state: GameState; onOpen: () => void }>(function MapThumb({ state, onOpen }, outer) {
  const [ref, hover] = useHoverLift<HTMLButtonElement>();
  const model = mapModel(state);
  const unrest = model.districts.some((d) => d.markers.includes("protest"));
  return (
    <button
      ref={(el) => {
        ref.current = el;
        if (typeof outer === "function") outer(el);
        else if (outer) outer.current = el;
      }}
      {...hover}
      className={`map-thumb ${unrest ? "unrest" : ""}`}
      onClick={onOpen}
      aria-label="Abrir o mapa da cidade"
    >
      <svg viewBox={`0 0 ${MAP_SIZE.width} ${MAP_SIZE.height}`} preserveAspectRatio="xMidYMid slice">
        <rect width={MAP_SIZE.width} height={MAP_SIZE.height} fill="#e3d6b6" />
        <polygon points={pts(SEA)} fill="#8fa6a8" />
        {model.districts.map((d) => (
          <polygon key={d.id} points={pts(DISTRICTS[d.id]!.polygon)} fill={hex(d.tint)} stroke="#2a1d14" strokeWidth={4} strokeOpacity={0.5} />
        ))}
      </svg>
      <span className="map-thumb-label">Planta de Porto Ferro</span>
    </button>
  );
});
