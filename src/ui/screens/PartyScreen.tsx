import gsap from "gsap";
import { useLayoutEffect, useRef, useState } from "react";
import { GROUPS, GROUP_IDS } from "../../content/councilman/groups";
import { PARTIES, PARTY_IDS, type PartyId } from "../../content/councilman/parties";
import { audio } from "../audio/audio";
import { stampDown } from "../feel/feel";
import { useHoverLift } from "../feel/useHoverLift";
import { DeskButton } from "../desk/DeskButton";
import { useGame } from "../store";

/** Four party folders on the desk. Pick one, sign your name, get stamped in. */
export function PartyScreen() {
  const newGame = useGame((s) => s.newGame);
  const [chosen, setChosen] = useState<PartyId | null>(null);
  const [name, setName] = useState("Rafael Moreira");
  const [form, setForm] = useState<"m" | "f">("m");
  const [signing, setSigning] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const stamp = useRef<HTMLDivElement>(null);
  const ink = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    audio.unlock();
    const ctx = gsap.context(() => {
      gsap.from(".party-folder", {
        x: -600,
        rotation: -20,
        opacity: 0,
        stagger: 0.12,
        duration: 0.6,
        ease: "power3.out",
        onStart: () => audio.sfx("paper_slide"),
      });
    }, root);
    return () => ctx.revert();
  }, []);

  function sign() {
    if (!chosen || signing || !stamp.current || !ink.current || !root.current) return;
    setSigning(true);
    audio.sfx("pen_sign");
    gsap.delayedCall(0.5, () => {
      stampDown(stamp.current!, ink.current!, root.current!).then(() => gsap.delayedCall(0.4, () => newGame(chosen, name.trim() || (form === "f" ? "Vereadora" : "Vereador"), form)));
    });
  }

  return (
    <div className="party-screen" ref={root}>
      <h1 className="screen-heading">Porto Ferro, janeiro de 1989</h1>
      <p className="screen-sub">Você conquistou a última vaga na Câmara Municipal. Toda carreira precisa de um partido. Escolha o seu.</p>
      <div className="party-folders">
        {PARTY_IDS.map((id) => (
          <PartyFolder key={id} id={id} selected={chosen === id} onPick={() => (audio.sfx("paper_pickup"), setChosen(id))} />
        ))}
      </div>
      <div className="party-sign">
        <div className="form-pick" role="radiogroup" aria-label="Forma de tratamento">
          <span>Como quer ser chamad{form === "f" ? "a" : "o"}?</span>
          <div>
            {(["m", "f"] as const).map((f) => (
              <button
                key={f}
                role="radio"
                aria-checked={form === f}
                className={`form-option ${form === f ? "on" : ""}`}
                onClick={() => (audio.sfx("ui_click"), setForm(f))}
              >
                {f === "f" ? "Vereadora" : "Vereador"}
              </button>
            ))}
          </div>
        </div>
        <label>
          Seu nome
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={32} onKeyDown={() => audio.sfx("typewriter_key", { volume: 0.4 })} />
        </label>
        <DeskButton variant="primary" disabled={!chosen || signing} onClick={sign}>
          {chosen ? `Assinar a ficha de filiação do ${PARTIES[chosen].short}` : "Escolha um partido"}
        </DeskButton>
        <div className="party-stamp-area">
          <div className="doc-ink party-ink" ref={ink}>
            {chosen ? PARTIES[chosen].short : ""} · {form === "f" ? "FILIADA" : "FILIADO"}
          </div>
          <div className="doc-stamp" ref={stamp} />
        </div>
      </div>
    </div>
  );
}

function PartyFolder({ id, selected, onPick }: { id: PartyId; selected: boolean; onPick: () => void }) {
  const p = PARTIES[id];
  const [ref, hover] = useHoverLift<HTMLButtonElement>();
  const friends = GROUP_IDS.filter((g) => p.startingOpinions[g] >= 15).map((g) => GROUPS[g].name);
  const foes = GROUP_IDS.filter((g) => p.startingOpinions[g] <= -15).map((g) => GROUPS[g].name);
  return (
    <button ref={ref} {...hover} className={`party-folder party-${id} ${selected ? "selected" : ""}`} onClick={onPick}>
      <div className="folder-tab">{p.short}</div>
      <div className="folder-name">{p.name}</div>
      <div className="folder-ideology">{p.ideology}</div>
      <p className="folder-desc">{p.description}</p>
      <div className="folder-boss">
        Chefia: <strong>{p.boss.name}</strong>
        <br />
        <em>{p.boss.bio}</em>
      </div>
      {friends.length > 0 && <div className="folder-friends">Têm confiança: {friends.join(", ")}</div>}
      {foes.length > 0 && <div className="folder-foes">Desconfiam: {foes.join(", ")}</div>}
    </button>
  );
}
