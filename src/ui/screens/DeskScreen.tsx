import gsap from "gsap";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PARTIES, type PartyId } from "../../content/councilman/parties";
import type { DeskItem, GameState } from "../../core/types";
import { BLOTTER, DESK_ART } from "../assets";
import { audio } from "../audio/audio";
import { musicTension } from "../audio/tension";
import { useHoverLift } from "../feel/useHoverLift";
import { AgendaPad } from "../desk/AgendaPad";
import { Calendar } from "../desk/Calendar";
import { DeskButton } from "../desk/DeskButton";
import { DeskClock } from "../desk/DeskClock";
import { PathsCard } from "../desk/PathsCard";
import { InboxStack } from "../desk/InboxStack";
import { OpinionStrip } from "../desk/OpinionStrip";
import { PaperView } from "../desk/PaperView";
import { WeekReport } from "../desk/WeekReport";
import { BillsPanel } from "../desk/panels/BillsPanel";
import { LibraryPanel } from "../desk/panels/LibraryPanel";
import { MeetingsPanel } from "../desk/panels/MeetingsPanel";
import { NeighbourhoodPanel } from "../desk/panels/NeighbourhoodPanel";
import { CampaignPanel } from "../desk/panels/CampaignPanel";
import { MediaPanel } from "../desk/panels/MediaPanel";
import { MapThumb } from "../map/MapThumb";
// The map pulls in PixiJS (~500 KB). Lazy-loading it means the desk opens
// without it; the browser fetches the map's code the first time it's opened.
const MapView = lazy(() => import("../map/MapView").then((m) => ({ default: m.MapView })));
import { agendaOf, answerFor, useGame } from "../store";
import { capitalIncome, lawCost } from "../../chapters/councilman/actions";
import { BALANCE } from "../../content/balance";
import type { LawId } from "../../content/councilman/laws";

type Panel = "bills" | "campaign" | "media" | "streets" | "rolodex" | "library";

/** Desk drawers, each illustrated with final art. */
const TOOLS: { id: Panel; label: string; hint: string; icon?: string }[] = [
  { id: "bills", label: "Projetos", hint: "Propor uma lei", icon: DESK_ART.bills_folder },
  { id: "rolodex", label: "Contatos", hint: "Pedir uma reunião", icon: DESK_ART.rolodex },
  { id: "streets", label: "Ruas", hint: "Construir uma base", icon: DESK_ART.city_skyline },
  { id: "media", label: "Imprensa", hint: "Rádio, jornal e rua", icon: DESK_ART.radio },
  { id: "library", label: "Estante", hint: "Ler e aprender", icon: DESK_ART.book_stack },
];

const CAMPAIGN_TOOL = { id: "campaign" as Panel, label: "Campanha", hint: "Ruas, apoios, palanque", icon: DESK_ART.campaign_folder };

const PANELS = { bills: BillsPanel, campaign: CampaignPanel, media: MediaPanel, streets: NeighbourhoodPanel, rolodex: MeetingsPanel, library: LibraryPanel };

/** The main screen: the councillor's desk. */
export function DeskScreen() {
  const state = useGame((s) => s.state)!;
  const report = useGame((s) => s.report);
  const pending = useGame((s) => s.pending);
  const nextWeek = useGame((s) => s.nextWeek);
  const clearReport = useGame((s) => s.clearReport);
  const savedAt = useGame((s) => s.savedAt);
  const savedMark = useRef<HTMLSpanElement>(null);

  // A small "salvo" note fades in and out after each autosave.
  useEffect(() => {
    if (!savedAt || !savedMark.current) return;
    gsap.fromTo(savedMark.current, { opacity: 0, y: 4 }, { opacity: 0.8, y: 0, duration: 0.4, yoyo: true, repeat: 1, repeatDelay: 1.6 });
  }, [savedAt]);

  const [panel, setPanel] = useState<Panel | null>(null);
  const [openItem, setOpenItem] = useState<DeskItem | null>(null);
  const [advancing, setAdvancing] = useState(false);
  const curtain = useRef<HTMLDivElement>(null);
  const curtainText = useRef<HTMLDivElement>(null);
  const flash = useRef<HTMLDivElement>(null);
  const desk = useRef<HTMLDivElement>(null);
  const mapThumb = useRef<HTMLButtonElement>(null);
  const [mapFrom, setMapFrom] = useState<DOMRect | null>(null);
  const [mapOpen, setMapOpen] = useState(false);

  /** Zoom out from the desk to the living city map. */
  function openMap() {
    setMapFrom(mapThumb.current?.getBoundingClientRect() ?? null);
    setMapOpen(true);
    gsap.to(desk.current, { scale: 1.06, filter: "blur(4px) brightness(0.6)", duration: 0.7, ease: "power3.inOut" });
  }
  function closeMap() {
    setMapOpen(false);
    gsap.to(desk.current, { scale: 1, filter: "blur(0px) brightness(1)", duration: 0.5, ease: "power2.out", clearProps: "filter,transform" });
  }

  // The music follows how things are going, including things you can't see.
  useEffect(() => audio.setTension(musicTension(state, report)), [state, report]);
  // Campaign weeks have their own track, alternating its two versions week by week.
  const campaignWeek = !!state.campaign && state.turn >= BALANCE.campaign.startWeek && state.turn <= BALANCE.campaign.endWeek;
  useEffect(() => audio.setMusic(campaignWeek ? { kind: "campaign", week: state.turn } : { kind: "office" }), [campaignWeek, state.turn]);
  /** Funds as of the last report: spending is heard when the week lands. */
  const fundsSeen = useRef(state.player.funds);

  // A new week has landed: scandals hit with a red flash, phones ring.
  useEffect(() => {
    if (!report || advancing) return;
    const scandal = report.exposed.length > 0;
    const calls = state.inbox.filter((i) => i.kind === "phone" && i.turn >= report.fromTurn).length;
    const timers: number[] = [];
    if (state.player.funds < fundsSeen.current) timers.push(window.setTimeout(() => audio.sfx("cash", { volume: 0.7 }), 300));
    fundsSeen.current = state.player.funds;
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
    <div
      className="desk-screen"
      ref={desk}
      style={{ backgroundImage: `url(${DESK_ART.desk_bg})`, ["--corruption" as string]: corruptionLevel(state) }}
    >
      {/* Visual layers, bottom to top: wood (background) > blotter > lamp light + vignette > UI. None take clicks. */}
      {BLOTTER && <div className="desk-blotter" style={{ backgroundImage: `url(${BLOTTER})` }} aria-hidden />}
      <div className="desk-light" aria-hidden />
      <div className="desk-chill" aria-hidden />

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
        <CapitalGauge state={state} />
        <div className="chest" title="Dinheiro de campanha, em milhares">
          <div className="chest-label">Caixa de campanha</div>
          <div className="chest-value">{state.player.funds}k</div>
        </div>
      </header>

      <main className="desk-middle">
        <div className="desk-left">
          <AgendaPad state={state} />
          <PathsCard state={state} />
          <MapThumb ref={mapThumb} state={state} onOpen={openMap} />
        </div>
        <InboxStack state={state} onOpen={setOpenItem} />
        <nav className="tools">
          {/* In the campaign the Câmara is in recess: the bills folder gives way to the campaign folder. */}
          {(state.campaign ? [CAMPAIGN_TOOL, ...TOOLS.filter((t) => t.id !== "bills")] : TOOLS).map((t) => (
            <Tool key={t.id} label={t.label} hint={t.hint} icon={t.icon} onClick={() => setPanel(t.id)} />
          ))}
        </nav>
      </main>

      <DeskClock turn={state.turn} />

      {/* Idle desk object: a real-size coffee cup resting on the wood. */}
      <div className="coffee">
        <img src={DESK_ART.coffee_cup} alt="" />
        <span className="steam" />
        <span className="steam s2" />
        <span className="steam s3" />
      </div>

      <footer className="desk-bottom">
        <span className="desk-saved" ref={savedMark}>
          ✓ jogo salvo
        </span>
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

      {/* A portal renders the map outside the desk element, so the desk's zoom-blur doesn't blur the map. */}
      {mapOpen &&
        createPortal(
          <Suspense fallback={<div className="map-loading">Desdobrando o mapa…</div>}>
            <MapView state={state} from={mapFrom} onClose={closeMap} />
          </Suspense>,
          document.body,
        )}

      <div className="curtain" ref={curtain}>
        <div className="curtain-text" ref={curtainText} />
      </div>
    </div>
  );
}

/**
 * 0 (clean) .. 1 (rotten): how much the office has gone cold. The art doc asks
 * the palette to shift from warm and hopeful to colder and darker as corruption
 * grows. The player never sees the integrity number; they feel the room change.
 */
function corruptionLevel(state: GameState): number {
  const start = BALANCE.hidden.integrityStart;
  return Math.round(Math.max(0, Math.min(1, (start - state.hidden.integrity) / start)) * 100) / 100;
}

/** Political capital: what you have, what this week's agenda will spend, and where the income comes from. */
function CapitalGauge({ state }: { state: GameState }) {
  const pending = useGame((s) => s.pending);
  const spending = pending.reduce((sum, d) => (d.kind === "proposeLaw" ? sum + lawCost(d.law as LawId, (d.lobby as number) ?? 0) : sum), 0);
  const income = capitalIncome(state);
  const why = [
    `+${BALANCE.capital.weeklyBase} pelo mandato`,
    income.supporters ? `+${Math.floor(income.supporters * BALANCE.capital.perSupportingGroup)} por ${income.supporters} grupo(s) a favor` : "",
    income.bossTrust ? `+${BALANCE.capital.bossTrustBonus} pela confiança da cúpula` : "",
  ]
    .filter(Boolean)
    .join(", ");
  return (
    <div className="chest capital" title={`Por semana: +${income.total} (${why}). Gasto para propor e articular leis.`}>
      <div className="chest-label">Capital político</div>
      <div className="chest-value">
        {state.player.capital}
        {spending > 0 && <small> −{spending}</small>}
      </div>
    </div>
  );
}

function Tool({ label, hint, icon, onClick }: { label: string; hint: string; icon?: string; onClick: () => void }) {
  const [ref, hover] = useHoverLift<HTMLButtonElement>();
  return (
    <button ref={ref} {...hover} className={`tool ${icon ? "with-icon" : ""}`} onClick={onClick}>
      {icon && <img className="tool-icon" src={icon} alt="" />}
      <span className="tool-label">{label}</span>
      <span className="tool-hint">{hint}</span>
    </button>
  );
}
