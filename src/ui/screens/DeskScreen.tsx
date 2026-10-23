import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { DESK_ART } from "../assets";
import { audio } from "../audio/audio";
import { hoverLift, slideIn, stampDown, tossAway } from "../feel/feel";

/**
 * Step 0 desk: proves the feel pipeline (art manifest + GSAP + Howler).
 * One paper slides in; stamping it gives thud + shake + ink; toss it to get the next.
 * This screen gets replaced by the real desk in step 4.
 */
export function DeskScreen() {
  const screenRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const stampRef = useRef<HTMLImageElement>(null);
  const inkRef = useRef<HTMLDivElement>(null);
  const [paperNo, setPaperNo] = useState(1);
  const [stamped, setStamped] = useState(false);

  // useLayoutEffect runs before paint, so the paper never flashes in its final spot.
  useLayoutEffect(() => {
    if (paperRef.current) slideIn(paperRef.current, 0.2);
  }, [paperNo]);

  useEffect(() => {
    const unlock = () => audio.unlock();
    window.addEventListener("pointerdown", unlock, { once: true });
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);

  function onStamp() {
    if (stamped || !stampRef.current || !inkRef.current || !screenRef.current) return;
    setStamped(true);
    stampDown(stampRef.current, inkRef.current, screenRef.current);
  }

  async function onToss() {
    if (!paperRef.current) return;
    await tossAway(paperRef.current);
    setStamped(false);
    setPaperNo((n) => n + 1);
  }

  return (
    <div className="desk" ref={screenRef} style={{ backgroundImage: `url(${DESK_ART.desk_bg})` }}>
      <div className="coffee">
        <img src={DESK_ART.coffee_cup} alt="" />
        <span className="steam" />
        <span className="steam s2" />
      </div>

      <div className="paper" ref={paperRef} key={paperNo}>
        <h2>Câmara Municipal de Porto Ferro</h2>
        <p className="mono">Memo #{paperNo.toString().padStart(3, "0")}</p>
        <p>
          Councilman, welcome to your office. The desk works: papers slide in, stamps land with weight,
          and every click makes a sound.
        </p>
        <div className="ink" ref={inkRef}>
          APPROVED
        </div>
        <img className="stamp" ref={stampRef} src={DESK_ART.stamp_approved} alt="" />
      </div>

      <div className="actions">
        <DeskButton label="Stamp" onClick={onStamp} disabled={stamped} />
        <DeskButton label="Toss away" onClick={onToss} disabled={!stamped} />
        <DeskButton label="Tension ↑" onClick={() => audio.setTension(1)} />
        <DeskButton label="Tension ↓" onClick={() => audio.setTension(0)} />
      </div>
    </div>
  );
}

function DeskButton(props: { label: string; onClick: () => void; disabled?: boolean }) {
  const ref = useRef<HTMLButtonElement>(null);
  return (
    <button
      ref={ref}
      className="desk-btn"
      disabled={props.disabled}
      onMouseEnter={() => ref.current && !props.disabled && hoverLift(ref.current, true)}
      onMouseLeave={() => ref.current && hoverLift(ref.current, false)}
      onClick={() => {
        audio.sfx("ui_click");
        props.onClick();
      }}
    >
      {props.label}
    </button>
  );
}
