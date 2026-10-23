import { useRef } from "react";
import { hoverLift } from "./feel";

/**
 * Gives any element the desk's hover feel (lift + soft tick).
 * Usage: const [ref, hover] = useHoverLift<HTMLButtonElement>(); <button ref={ref} {...hover}>
 */
export function useHoverLift<T extends HTMLElement>(enabled = true) {
  const ref = useRef<T>(null);
  const handlers = {
    onMouseEnter: () => enabled && ref.current && hoverLift(ref.current, true),
    onMouseLeave: () => ref.current && hoverLift(ref.current, false),
  };
  return [ref, handlers] as const;
}
