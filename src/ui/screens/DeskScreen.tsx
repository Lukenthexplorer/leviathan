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
import { agendaOf, useGame } from "../store";

type Panel = "bills" | "social" | "streets" | "rolodex" | "library";

const TOOLS: { id: Panel; label: string; hint: string }[] = [
  { id: "bills", label: "Bills", hint: "Propose a law" },
  { id: "rolodex", label: "Rolodex", hint: "Request a meeting" },
  { id: "streets", label: "Streets", hint: "Build a base" },
  { id: "social", label: "Phone", hint: "Post on social media" },
  { id: "library", label: "Bookshelf", hint: "Read and learn" },
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

  // The music follows how things are going, including things you can't see.
  useEffect(() => audio.setTension(musicTension(state, report)), [state, report]);

  const party = PARTIES[state.party as PartyId];
  const agendaCount = agendaOf(pending).length;
  const waiting = state.inbox.filter((i) => i.choices?.length && !pending.some((p) => p.itemId === i.id)).length;

  function onNextWeek() {
    if (advancing) return;
    setAdvancing(true);
    if (curtainText.current) curtainText.current.textContent = `Week ${state.turn + 1}`;
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
            <div className="badge-role">City Councillor, Porto Ferro</div>
          </div>
        </div>
        <Calendar turn={state.turn} />
        <OpinionStrip state={state} />
        <div className="chest" title="Campaign money, in thousands">
          <div className="chest-label">Campaign chest</div>
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
          {agendaCount === 0 && "Nothing on the agenda yet. "}
          {waiting > 0 && `${waiting} paper${waiting > 1 ? "s" : ""} waiting for an answer.`}
        </div>
        <DeskButton variant="primary" onClick={onNextWeek} disabled={advancing}>
          Next week →
        </DeskButton>
      </footer>

      {PanelComponent && <PanelComponent state={state} onClose={() => setPanel(null)} />}
      {openItem && <PaperView item={openItem} state={state} onClose={() => setOpenItem(null)} />}
      {report && !advancing && <WeekReport report={report} state={state} onClose={clearReport} />}

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
