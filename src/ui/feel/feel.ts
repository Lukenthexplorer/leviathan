import gsap from "gsap";
import { audio } from "../audio/audio";

/**
 * Reusable "juice" recipes. Each one pairs motion with its sound hook, so every
 * desk interaction gets both by calling a single function.
 */

const reducedMotion = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * Paper slides onto the desk and settles exactly where it lies. Its resting
 * tilt is the element's own CSS `rotate` (deterministic, from the paper's id);
 * this only animates `transform`, so the two never fight.
 */
export function slideOnto(el: Element, delay = 0) {
  if (reducedMotion()) {
    audio.sfx("paper_slide", { volume: 0.5 });
    return gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.3, delay, clearProps: "transform" });
  }
  return gsap.fromTo(
    el,
    { x: -window.innerWidth * 0.45, y: 60, rotation: -12, opacity: 0 },
    { x: 0, y: 0, rotation: 0, opacity: 1, duration: 0.6, delay, ease: "power3.out", clearProps: "transform", onStart: () => audio.sfx("paper_slide") },
  );
}

/** Paper gets tossed off the desk. */
export function tossAway(el: Element) {
  audio.sfx("paper_pickup");
  return gsap.to(el, {
    x: window.innerWidth * 0.7,
    y: -120,
    rotation: gsap.utils.random(20, 40),
    opacity: 0,
    duration: 0.5,
    ease: "power2.in",
  });
}

/** Screen shake; `strength` in pixels. */
export function shake(el: Element, strength = 8) {
  return gsap.fromTo(
    el,
    { x: 0, y: 0 },
    {
      keyframes: [
        { x: -strength, y: strength * 0.5 },
        { x: strength * 0.8, y: -strength * 0.4 },
        { x: -strength * 0.5, y: strength * 0.2 },
        { x: strength * 0.2, y: 0 },
        { x: 0, y: 0 },
      ],
      duration: 0.3,
      ease: "none",
    },
  );
}

/**
 * Stamp drops onto `paper`: anticipation (lift), slam, thud + shake, then the
 * ink mark (`ink`) spreads in. `onImpact` fires at the moment of contact.
 */
export function stampDown(stamp: Element, ink: Element, screen: Element, onImpact?: () => void) {
  const tl = gsap.timeline();
  tl.set(ink, { opacity: 0, scale: 0.6 })
    .fromTo(stamp, { y: -260, scale: 1.25, opacity: 0 }, { y: -320, opacity: 1, duration: 0.2, ease: "power1.out" })
    .to(stamp, { y: 0, scale: 1, duration: 0.12, ease: "power4.in" })
    .add(() => {
      audio.sfx("stamp_thud", { pitchJitter: 0.1 });
      shake(screen, 10);
      onImpact?.();
    })
    .to(ink, { opacity: 0.85, scale: 1, duration: 0.18, ease: "back.out(3)" }, "<")
    .to(stamp, { y: -300, opacity: 0, duration: 0.35, ease: "power2.in" }, "+=0.1");
  return tl;
}

/** Subtle lift on hover, used for anything clickable on the desk. */
export function hoverLift(el: Element, on: boolean) {
  if (on) audio.sfx("ui_hover", { volume: 0.5 });
  return gsap.to(el, { y: on ? -6 : 0, scale: on ? 1.02 : 1, duration: 0.2, ease: "power2.out" });
}
