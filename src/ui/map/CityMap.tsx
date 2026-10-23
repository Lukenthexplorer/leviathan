import { useEffect, useRef } from "react";
import { CityMapRenderer } from "./CityMapRenderer";
import type { MapModel } from "./model";

/**
 * React wrapper around the Pixi renderer. React owns WHEN (mount, update,
 * unmount); the renderer owns HOW. Pixi's init is async, so we guard against
 * React unmounting (or StrictMode double-mounting) before it finishes.
 */
export function CityMap(props: { model: MapModel; selected: string | null; onHover(id: string | null): void; onSelect(id: string): void }) {
  const host = useRef<HTMLDivElement>(null);
  const renderer = useRef<CityMapRenderer | null>(null);
  const callbacks = useRef(props);
  callbacks.current = props;

  useEffect(() => {
    let disposed = false;
    let ready = false;
    const r = new CityMapRenderer({
      onHover: (id) => callbacks.current.onHover(id),
      onSelect: (id) => callbacks.current.onSelect(id),
    });
    r.update(callbacks.current.model, false);
    r.mount(host.current!).then(() => {
      ready = true;
      if (disposed) r.destroy();
      else renderer.current = r;
    });
    return () => {
      disposed = true;
      renderer.current = null;
      if (ready) r.destroy();
    };
  }, []);

  useEffect(() => renderer.current?.update(props.model), [props.model]);
  useEffect(() => renderer.current?.select(props.selected), [props.selected]);

  return <div className="city-map" ref={host} />;
}
