import gsap from "gsap";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { PARTIES, type PartyId } from "../../content/councilman/parties";
import { weekDate } from "../../core/calendar";
import { saveSummary } from "../../persistence/save";
import { audio } from "../audio/audio";
import { DeskButton } from "../desk/DeskButton";
import { useGame } from "../store";

export function TitleScreen() {
  const goto = useGame((s) => s.goto);
  const continueGame = useGame((s) => s.continueGame);
  const root = useRef<HTMLDivElement>(null);
  const save = useMemo(() => saveSummary(), []);
  // Starting over with a save on disk asks once, in the UI (no browser confirm dialogs).
  const [confirmNew, setConfirmNew] = useState(false);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".title-word", { opacity: 0, y: 30, letterSpacing: "0.6em", duration: 1.6, ease: "power3.out" });
      gsap.from(".title-quote", { opacity: 0, duration: 1.2, delay: 0.8 });
      gsap.from(".title-actions", { opacity: 0, y: 20, duration: 0.8, delay: 1.4 });
    }, root);
    return () => ctx.revert();
  }, []);

  function startNew() {
    if (save && !confirmNew) {
      setConfirmNew(true);
      return;
    }
    audio.unlock();
    goto("party");
  }

  return (
    <div className="title-screen" ref={root}>
      <h1 className="title-word">LEVIATHAN</h1>
      <p className="title-quote">
        “Pois é pela arte que é criado aquele grande LEVIATÃ a que se chama REPÚBLICA ou ESTADO.”
        <br />
        <span>Thomas Hobbes, 1651</span>
      </p>
      <div className="title-actions">
        {save && (
          <DeskButton
            variant="primary"
            onClick={() => {
              audio.unlock();
              continueGame();
            }}
          >
            Continuar · {save.playerName}, {PARTIES[save.party as PartyId]?.short} · {weekDate(save.turn)}
          </DeskButton>
        )}
        <DeskButton variant={save ? (confirmNew ? "danger" : "ghost") : "primary"} onClick={startNew}>
          {confirmNew ? "Apagar o jogo salvo e começar de novo?" : "Começar uma nova carreira"}
        </DeskButton>
      </div>
    </div>
  );
}
