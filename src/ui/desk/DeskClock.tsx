import gsap from "gsap";
import { useLayoutEffect, useRef } from "react";
import { DESK_ART } from "../assets";
import { audio } from "../audio/audio";

/**
 * A twin-bell alarm clock on the desk. Idle: the second hand ticks, the minute hand creeps.
 * When the week turns, the hands race round: a week passing in two seconds.
 *
 * Two layers per hand: an outer wrapper GSAP spins on week change, and an
 * inner hand that CSS animates forever. They never fight over the same element.
 */
export function DeskClock({ turn }: { turn: number }) {
  const minute = useRef<HTMLDivElement>(null);
  const hour = useRef<HTMLDivElement>(null);
  const first = useRef(true);

  useLayoutEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    // Reduced motion: no racing hands, just the tick of a new week.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return void audio.sfx("clock_tick", { volume: 0.5 });
    const tl = gsap.timeline();
    tl.to(minute.current, { rotation: "+=1440", duration: 1.8, ease: "power2.inOut" }, 0).to(
      hour.current,
      { rotation: "+=120", duration: 1.8, ease: "power2.inOut" },
      0,
    );
    // A run of ticks that speeds up and slows down with the hands.
    const ticks = [0.15, 0.4, 0.6, 0.75, 0.88, 1.0, 1.12, 1.25, 1.42, 1.65];
    ticks.forEach((t) => tl.call(() => audio.sfx("clock_tick", { volume: 0.5, pitchJitter: 0.1 }), undefined, t));
    return () => {
      tl.kill();
    };
  }, [turn]);

  return (
    <div className="desk-clock" aria-hidden>
      <img src={DESK_ART.desk_clock} alt="" />
      <div className="clock-face">
        <div className="hand-wrap" ref={hour}>
          <div className="hand hand-hour" />
        </div>
        <div className="hand-wrap" ref={minute}>
          <div className="hand hand-minute" />
        </div>
        <div className="hand-wrap">
          <div className="hand hand-second" />
        </div>
        <span className="clock-pin" />
      </div>
    </div>
  );
}
