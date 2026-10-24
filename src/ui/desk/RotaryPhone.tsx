import gsap from "gsap";
import { forwardRef, useImperativeHandle, useRef } from "react";
import type { DeskItem } from "../../core/types";
import { DESK_ART } from "../assets";
import { audio } from "../audio/audio";
import { DeskObject } from "./DeskObject";

export interface PhoneHandle {
  /** One ring: the bell sounds and the phone rattles on the desk. */
  ring(): void;
}

const reducedMotion = () => !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * The rotary phone. When a call is waiting on the desk (a "phone" paper not yet
 * answered), clicking it picks up that call. The desk makes it ring when calls
 * arrive with the new week.
 */
export const RotaryPhone = forwardRef<PhoneHandle, { call: DeskItem | null; onAnswer: (item: DeskItem) => void }>(function RotaryPhone({ call, onAnswer }, handle) {
  const el = useRef<HTMLButtonElement>(null);

  useImperativeHandle(handle, () => ({
    ring() {
      audio.sfx("phone_ring", { volume: 0.7 });
      if (!el.current || reducedMotion()) return;
      // A light rattle for as long as the bell rings (~1.2 s), then still.
      gsap.fromTo(el.current, { x: 0, rotation: 0 }, { x: 2, rotation: 1.2, duration: 0.05, repeat: 21, yoyo: true, ease: "none", onComplete: () => void gsap.set(el.current, { x: 0, rotation: 0 }) });
    },
  }));

  return (
    <DeskObject
      ref={el}
      place="deco-phone"
      className={call ? "has-call" : ""}
      label="Telefone"
      hint={call ? `Atender: ${call.title}` : "Ninguém ligou"}
      img={DESK_ART.rotary_phone}
      onClick={() => {
        if (call) onAnswer(call);
        else audio.sfx("ui_click", { volume: 0.5 });
      }}
    />
  );
});
