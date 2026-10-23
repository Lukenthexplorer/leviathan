import gsap from "gsap";
import { useEffect, useLayoutEffect, useRef, type MutableRefObject, type ReactNode } from "react";
import { audio } from "../audio/audio";

/**
 * A modal sheet of paper that slides up over the desk. Used by every drawer
 * panel and by opened documents. Click outside or press Esc to put it down.
 */
export function Sheet(props: {
  title?: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
  sound?: "drawer_open" | "paper_slide";
  /** Lets a child close the sheet with the same animation (e.g. after stamping). */
  closeRef?: MutableRefObject<(() => void) | null>;
  /** The sheet element, for effects like screen shake on stamp. */
  sheetRef?: MutableRefObject<HTMLDivElement | null>;
}) {
  const backdrop = useRef<HTMLDivElement>(null);
  const sheet = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    audio.sfx(props.sound ?? "drawer_open");
    gsap.fromTo(backdrop.current, { opacity: 0 }, { opacity: 1, duration: 0.25 });
    gsap.fromTo(
      sheet.current,
      { y: 500, rotation: gsap.utils.random(-3, 3), opacity: 0 },
      { y: 0, rotation: gsap.utils.random(-0.8, 0.8), opacity: 1, duration: 0.45, ease: "power3.out" },
    );
  }, []);

  function close() {
    audio.sfx("paper_pickup");
    gsap.to(sheet.current, { y: 600, opacity: 0, duration: 0.3, ease: "power2.in" });
    gsap.to(backdrop.current, { opacity: 0, duration: 0.3, onComplete: props.onClose });
  }

  if (props.closeRef) props.closeRef.current = close;
  if (props.sheetRef) props.sheetRef.current = sheet.current;

  useEffect(() => {
    if (props.sheetRef) props.sheetRef.current = sheet.current;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="sheet-backdrop" ref={backdrop} onMouseDown={(e) => e.target === backdrop.current && close()}>
      <div className={`sheet ${props.wide ? "wide" : ""}`} ref={sheet}>
        {props.title && <h2 className="sheet-title">{props.title}</h2>}
        <button className="sheet-close" onClick={close} aria-label="Close">
          ×
        </button>
        {props.children}
      </div>
    </div>
  );
}
