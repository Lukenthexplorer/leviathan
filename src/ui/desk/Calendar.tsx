import gsap from "gsap";
import { useLayoutEffect, useRef } from "react";
import { weekDate } from "../../core/calendar";

export { weekDate };

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
        <div className="calendar-week">SEMANA {turn}</div>
        <div className="calendar-date">{weekDate(turn)}</div>
      </div>
    </div>
  );
}
