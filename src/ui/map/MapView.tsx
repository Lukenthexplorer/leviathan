import gsap from "gsap";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { GROUPS, type GroupId } from "../../content/councilman/groups";
import { NEIGHBOURHOODS, type NeighbourhoodId } from "../../content/councilman/neighbourhoods";
import type { GameState } from "../../core/types";
import { audio } from "../audio/audio";
import { DeskButton } from "../desk/DeskButton";
import { ActionRow } from "../desk/panels/ActionRow";
import { useGame } from "../store";
import { CityMap } from "./CityMap";
import { MARKER_LABEL, mapModel } from "./model";

/**
 * The living map, zoomed out of the desk. Opening uses FLIP: the overlay
 * starts exactly over the little map on the desk and grows to full screen.
 */
export function MapView({ state, from, onClose }: { state: GameState; from: DOMRect | null; onClose: () => void }) {
  const overlay = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const notice = useGame((s) => s.notice);
  const model = useMemo(() => mapModel(state), [state]);
  const shown = selected ?? hovered;
  const district = model.districts.find((d) => d.id === shown);

  // F.L.I.P.: First (thumbnail rect), Last (full screen), Invert, Play.
  const flipFrom = () =>
    from
      ? { x: from.left, y: from.top, scaleX: from.width / window.innerWidth, scaleY: from.height / window.innerHeight, opacity: 0.4 }
      : { scale: 0.9, opacity: 0 };

  useLayoutEffect(() => {
    audio.sfx("paper_slide");
    audio.setCityFocus(true);
    gsap.fromTo(overlay.current, { ...flipFrom(), transformOrigin: "0 0" }, { x: 0, y: 0, scaleX: 1, scaleY: 1, scale: 1, opacity: 1, duration: 0.7, ease: "power3.inOut" });
  }, []);

  function close() {
    audio.sfx("paper_pickup");
    audio.setCityFocus(false);
    gsap.to(overlay.current, { ...flipFrom(), duration: 0.55, ease: "power3.inOut", onComplete: onClose });
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && (selected ? setSelected(null) : close());
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="map-overlay" ref={overlay}>
      <header className="map-header">
        <DeskButton variant="ghost" onClick={close}>
          ← Voltar à mesa
        </DeskButton>
        <div className="map-legend">
          {Object.entries(MARKER_LABEL).map(([k, label]) => (
            <span key={k} className={`legend-item legend-${k}`}>
              <i /> {label}
            </span>
          ))}
          <span className="legend-item legend-flag">
            <i /> Suas raízes
          </span>
        </div>
      </header>

      <CityMap
        model={model}
        selected={selected}
        onHover={setHovered}
        onSelect={(id) => {
          audio.sfx("ui_click");
          setSelected((cur) => (cur === id ? null : id));
        }}
      />

      {district && (
        <aside className={`map-card ${selected ? "pinned" : ""}`}>
          <h2>{district.name}</h2>
          <p className="map-card-desc">{NEIGHBOURHOODS[district.id as NeighbourhoodId].description}</p>
          <dl>
            <dt>Clima</dt>
            <dd>{district.moodWord}</dd>
            <dt>Suas raízes</dt>
            <dd>{district.base}%</dd>
            <dt>Moradores</dt>
            <dd>
              {Object.keys(NEIGHBOURHOODS[district.id as NeighbourhoodId].residents)
                .map((g) => GROUPS[g as GroupId].name)
                .join(", ")}
            </dd>
            {district.markers.length > 0 && (
              <>
                <dt>Nas ruas</dt>
                <dd>{district.markers.map((m) => MARKER_LABEL[m]).join(", ")}</dd>
              </>
            )}
          </dl>
          {selected ? (
            <ActionRow title="Percorrer as ruas" decision={{ kind: "neighbourhood", id: district.id }} cta="Pôr na agenda" />
          ) : (
            <p className="map-card-hint">Clique para agir aqui</p>
          )}
          {selected && notice && <p className="map-card-notice">{notice}</p>}
        </aside>
      )}
    </div>
  );
}
