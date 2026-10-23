import gsap from "gsap";
import { useLayoutEffect, useRef } from "react";

const START = Date.UTC(1989, 0, 2); // Monday 2 January 1989, the first session of the new Câmara
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function weekDate(turn: number): string {
  const d = new Date(START + (turn - 1) * 7 * 86_400_000);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** The desk calendar. When the week changes, the new page drops in from above. */
export function Calendar({ turn }: { turn: number }) {
  const page = useRef<HTMLDivElement>(null);
  const first = useRef(true);

  useLayoutEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    gsap.fromTo(
      page.current,
      { rotationX: -95, transformOrigin: "50% 0%", opacity: 0.4 },
      { rotationX: 0, opacity: 1, duration: 0.7, ease: "bounce.out" },
    );
  }, [turn]);

  return (
    <div className="calendar">
      <div className="calendar-rings" />
      <div className="calendar-page" ref={page}>
        <div className="calendar-week">WEEK {turn}</div>
        <div className="calendar-date">{weekDate(turn)}</div>
      </div>
    </div>
  );
}
