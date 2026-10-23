import gsap from "gsap";
import { useEffect, useRef, useState } from "react";
import { PARTIES, type PartyId } from "../../content/councilman/parties";
import type { DeskItem } from "../../core/types";
import { DESK_ART } from "../assets";
import { audio } from "../audio/audio";
import { musicTension } from "../audio/tension";
import { useHoverLift } from "../feel/useHoverLift";
import { AgendaPad } from "../desk/AgendaPad";
import { Calendar } from "../desk/Calendar";
import { DeskButton } from "../desk/DeskButton";
import { InboxStack } from "../desk/InboxStack";
import { OpinionStrip } from "../desk/OpinionStrip";
import { PaperView } from "../desk/PaperView";
import { WeekReport } from "../desk/WeekReport";
import { BillsPanel } from "../desk/panels/BillsPanel";
import { LibraryPanel } from "../desk/panels/LibraryPanel";
import { MeetingsPanel } from "../desk/panels/MeetingsPanel";
import { NeighbourhoodPanel } from "../desk/panels/NeighbourhoodPanel";
import { SocialPanel } from "../desk/panels/SocialPanel";
import { agendaOf, answerFor, useGame } from "../store";

type Panel = "bills" | "social" | "streets" | "rolodex" | "library";

const TOOLS: { id: Panel; label: string; hint: string }[] = [
  { id: "bills", label: "Projetos", hint: "Propor uma lei" },
  { id: "rolodex", label: "Contatos", hint: "Pedir uma reunião" },
  { id: "streets", label: "Ruas", hint: "Construir uma base" },
  { id: "social", label: "Celular", hint: "Postar nas redes" },
  { id: "library", label: "Estante", hint: "Ler e aprender" },
];

const PANELS = { bills: BillsPanel, social: SocialPanel, streets: NeighbourhoodPanel, rolodex: MeetingsPanel, library: LibraryPanel };

/** The main screen: the councillor's desk. */
export function DeskScreen() {
  const state = useGame((s) => s.state)!;
  const report = useGame((s) => s.report);
  const pending = useGame((s) => s.pending);
  const nextWeek = useGame((s) => s.nextWeek);
  const clearReport = useGame((s) => s.clearReport);

  const [panel, setPanel] = useState<Panel | null>(null);
  const [openItem, setOpenItem] = useState<DeskItem | null>(null);
  const [advancing, setAdvancing] = useState(false);
  const curtain = useRef<HTMLDivElement>(null);
  const curtainText = useRef<HTMLDivElement>(null);
  const flash = useRef<HTMLDivElement>(null);

  // The music follows how things are going, including things you can't see.
  useEffect(() => audio.setTension(musicTension(state, report)), [state, report]);

  // A new week has landed: scandals hit with a red flash, phones ring.
  useEffect(() => {
    if (!report || advancing) return;
    const scandal = report.exposed.length > 0;
    const calls = state.inbox.filter((i) => i.kind === "phone" && i.turn >= report.fromTurn).length;
    const timers: number[] = [];
    if (scandal) {
      audio.sfx("scandal_sting");
      gsap.fromTo(flash.current, { opacity: 0.75 }, { opacity: 0, duration: 0.4, repeat: 2, yoyo: true, ease: "power1.inOut" });
    }
    for (let i = 0; i < (scandal ? Math.max(calls, 2) : calls); i++) {
      timers.push(window.setTimeout(() => audio.sfx("phone_ring", { volume: 0.7 }), 700 + i * 1300));
    }
    return () => timers.forEach(clearTimeout);
    // Only when a new report arrives.
  }, [report, advancing]);

  /** After the briefing, the morning paper spins onto the desk by itself. */
  function closeReport() {
    const fresh = report && state.inbox.find((i) => i.kind === "newspaper" && i.turn >= report.fromTurn && !answerFor(pending, i.id));
    clearReport();
    if (fresh) window.setTimeout(() => setOpenItem(fresh), 250);
  }

  const party = PARTIES[state.party as PartyId];
  const agendaCount = agendaOf(pending).length;
  const waiting = state.inbox.filter((i) => (i.choices?.length || i.scheme) && !answerFor(pending, i.id)).length;

  function onNextWeek() {
    if (advancing) return;
    setAdvancing(true);
    if (curtainText.current) curtainText.current.textContent = `Semana ${state.turn + 1}`;
    audio.sfx("page_flip");
    gsap
      .timeline()
      .to(curtain.current, { opacity: 1, duration: 0.35, ease: "power1.in" })
      .fromTo(curtainText.current, { rotationX: -90, opacity: 0 }, { rotationX: 0, opacity: 1, duration: 0.5, ease: "back.out(2)" })
      .add(() => nextWeek(), "+=0.35")
      .to(curtain.current, { opacity: 0, duration: 0.5 }, "+=0.15")
      .add(() => setAdvancing(false));
  }

  const PanelComponent = panel ? PANELS[panel] : null;

  return (
    <div className="desk-screen" style={{ backgroundImage: `url(${DESK_ART.desk_bg})` }}>
      <header className="desk-top">
        <div className="badge">
          <div className={`badge-party party-${state.party}`}>{party.short}</div>
          <div>
            <div className="badge-name">{state.player.name}</div>
            <div className="badge-role">{state.player.form === "f" ? "Vereadora" : "Vereador"} de Porto Ferro</div>
          </div>
        </div>
        <Calendar turn={state.turn} />
        <OpinionStrip state={state} />
        <div className="chest" title="Dinheiro de campanha, em milhares">
          <div className="chest-label">Caixa de campanha</div>
          <div className="chest-value">{state.player.funds}k</div>
        </div>
      </header>

      <main className="desk-middle">
        <AgendaPad state={state} />
        <InboxStack state={state} onOpen={setOpenItem} />
        <nav className="tools">
          {TOOLS.map((t) => (
            <Tool key={t.id} label={t.label} hint={t.hint} onClick={() => setPanel(t.id)} />
          ))}
          <div className="coffee">
            <img src={DESK_ART.coffee_cup} alt="" />
            <span className="steam" />
            <span className="steam s2" />
          </div>
        </nav>
      </main>

      <footer className="desk-bottom">
        <div className="desk-status">
          {agendaCount === 0 && "Nada na agenda ainda. "}
          {waiting > 0 && `${waiting} ${waiting > 1 ? "papéis esperando" : "papel esperando"} resposta.`}
        </div>
        <DeskButton variant="primary" onClick={onNextWeek} disabled={advancing}>
          Próxima semana →
        </DeskButton>
      </footer>

      {PanelComponent && <PanelComponent state={state} onClose={() => setPanel(null)} />}
      {openItem && <PaperView item={openItem} state={state} onClose={() => setOpenItem(null)} />}
      {report && !advancing && <WeekReport report={report} state={state} onClose={closeReport} />}

      <div className="scandal-flash" ref={flash} />

      <div className="curtain" ref={curtain}>
        <div className="curtain-text" ref={curtainText} />
      </div>
    </div>
  );
}

function Tool({ label, hint, onClick }: { label: string; hint: string; onClick: () => void }) {
  const [ref, hover] = useHoverLift<HTMLButtonElement>();
  return (
    <button ref={ref} {...hover} className="tool" onClick={onClick}>
      <span className="tool-label">{label}</span>
      <span className="tool-hint">{hint}</span>
    </button>
  );
}
