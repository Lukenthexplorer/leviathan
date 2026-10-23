import gsap from "gsap";
import { useLayoutEffect, useRef } from "react";
import { audio } from "../audio/audio";
import { DeskButton } from "../desk/DeskButton";
import { useGame } from "../store";

export function TitleScreen() {
  const goto = useGame((s) => s.goto);
  const root = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".title-word", { opacity: 0, y: 30, letterSpacing: "0.6em", duration: 1.6, ease: "power3.out" });
      gsap.from(".title-quote", { opacity: 0, duration: 1.2, delay: 0.8 });
      gsap.from(".title-actions", { opacity: 0, y: 20, duration: 0.8, delay: 1.4 });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <div className="title-screen" ref={root}>
      <h1 className="title-word">LEVIATHAN</h1>
      <p className="title-quote">
        “For by Art is created that great LEVIATHAN called a COMMON-WEALTH, or STATE.”
        <br />
        <span>Thomas Hobbes, 1651</span>
      </p>
      <div className="title-actions">
        <DeskButton
          variant="primary"
          onClick={() => {
            audio.unlock();
            goto("party");
          }}
        >
          Begin your career
        </DeskButton>
      </div>
    </div>
  );
}
