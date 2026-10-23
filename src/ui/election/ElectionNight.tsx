import gsap from "gsap";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { buildBroadcast, type Frame } from "../../chapters/councilman/broadcast";
import { PLAYER } from "../../chapters/councilman/election";
import { ELECTION_LINES } from "../../content/councilman/election_lines";
import { PARTIES, type PartyId } from "../../content/councilman/parties";
import { DESK_ART, portrait } from "../assets";
import { audio } from "../audio/audio";
import { DeskButton } from "../desk/DeskButton";
import { useGame } from "../store";
import { BarsPanel, CHART_COLORS, LineChart, MiniMap } from "./Broadcast";
import { StaticNoise } from "./StaticNoise";

type Phase = "night" | "tv" | "broadcast" | "final";

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * Election night. The result was decided by the simulation; this only replays
 * it: the desk goes dark, the old TV turns on, the camera pushes in, and the
 * urns are counted batch by batch on "PLANTÃO ELEITORAL".
 */
export function ElectionNight() {
  const state = useGame((s) => s.state)!;
  const goto = useGame((s) => s.goto);
  const result = state.election!;
  const broadcast = useMemo(() => buildBroadcast(state, result), [state, result]);

  const [phase, setPhase] = useState<Phase>("night");
  const [roundIdx, setRoundIdx] = useState(0);
  const [frameIdx, setFrameIdx] = useState(-1);
  const [interstitial, setInterstitial] = useState<string | null>(null);
  const [speed, setSpeed] = useState(1);
  const [paused, setPaused] = useState(false);

  const root = useRef<HTMLDivElement>(null);
  const tv = useRef<HTMLDivElement>(null);
  const screen = useRef<HTMLDivElement>(null);
  const virada = useRef<HTMLDivElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);

  const round = broadcast.rounds[roundIdx]!;
  const frame: Frame | undefined = round.frames[frameIdx];
  const colors = useMemo(
    (): Record<string, string> =>
      Object.fromEntries(result.candidates.map((c, i) => [c.id, (c.id === PLAYER ? CHART_COLORS[0] : CHART_COLORS[(i % (CHART_COLORS.length - 1)) + 1])!])),
    [result],
  );
  const names = useMemo(() => Object.fromEntries(result.candidates.map((c) => [c.id, c.name])), [result]);

  // 1-2. Night falls on the desk, the TV powers on, the camera pushes into the screen.
  useLayoutEffect(() => {
    const fast = reducedMotion();
    audio.setCityFocus(true);
    const intro = gsap.timeline({ onComplete: () => setPhase("broadcast") });
    intro
      .fromTo(".night-dark", { opacity: 0 }, { opacity: 0.88, duration: fast ? 0.1 : 1.4, ease: "power1.in" })
      .fromTo(tv.current, { scale: 0.42, opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: fast ? 0.1 : 0.6 }, "-=0.4")
      .add(() => {
        setPhase("tv");
        audio.sfx("tv_power_on");
      })
      .fromTo(screen.current, { scaleY: 0.01, filter: "brightness(3)" }, { scaleY: 1, filter: "brightness(1)", duration: fast ? 0.1 : 0.5, ease: "power2.out" })
      .add(() => audio.sfx("plantao_jingle"), "+=0.2")
      // Push in until the picture nearly fills the room: a sliver of the wooden cabinet stays as a frame.
      .to(tv.current, { scale: 0.92, duration: fast ? 0.1 : 1.3, ease: "power3.inOut" }, "+=0.6");
    return () => {
      intro.kill();
    };
  }, []);

  // 3-5. The broadcast: one master timeline, one label per batch.
  useEffect(() => {
    if (phase !== "broadcast") return;
    const t = gsap.timeline({ onComplete: () => finish() });
    broadcast.rounds.forEach((r, ri) => {
      t.call(() => {
        setRoundIdx(ri);
        setFrameIdx(-1);
        setInterstitial(r.intro);
        audio.sfx("tv_static", { volume: 0.5 });
      });
      t.to({}, { duration: ri === 0 ? 3 : 4 });
      t.call(() => setInterstitial(null));
      r.frames.forEach((f, fi) => {
        t.addLabel(`r${ri}b${fi}`);
        t.call(() => setFrameIdx(fi));
        t.to({}, { duration: f.duration });
      });
      t.to({}, { duration: 1.5 });
    });
    if (reducedMotion()) t.timeScale(8);
    tl.current = t;
    return () => {
      t.kill();
    };
  }, [phase]);

  useEffect(() => {
    tl.current?.timeScale(reducedMotion() ? 8 : speed);
  }, [speed]);
  useEffect(() => {
    if (paused) tl.current?.pause();
    else tl.current?.resume();
  }, [paused]);

  // Each new batch: a tick, and on a lead change the VIRADA sting. Close races raise the music's tension.
  useEffect(() => {
    if (!frame) return;
    audio.sfx("clock_tick", { volume: 0.6 });
    audio.setTension(frame.close ? 0.9 : frame.leader === PLAYER ? 0.2 : 0.55);
    if (frame.leadChange && virada.current && !reducedMotion()) {
      audio.sfx("virada_sting");
      gsap.fromTo(virada.current, { scale: 2.4, opacity: 0, rotation: -8 }, { scale: 1, opacity: 1, rotation: -4, duration: 0.35, ease: "back.out(2)" });
      gsap.to(virada.current, { opacity: 0, duration: 0.4, delay: 1.3 });
    }
    // The crowd outside: louder where the player just won a neighbourhood.
    if (frame.unitDone) audio.sfx(frame.unitWinner === PLAYER ? "crowd_cheer" : "crowd_murmur", { volume: 0.5 });
  }, [frame]);

  function finish() {
    tl.current?.kill();
    const last = broadcast.rounds.length - 1;
    setRoundIdx(last);
    setFrameIdx(broadcast.rounds[last]!.frames.length - 1);
    setInterstitial(null);
    setPhase("final");
    audio.sfx(broadcast.playerWon ? "crowd_cheer" : "crowd_murmur", { volume: broadcast.playerWon ? 1 : 0.6 });
    audio.setTension(broadcast.playerWon ? 0 : 1);
  }

  function toNewspaper() {
    audio.sfx("tv_power_on", { volume: 0.4 });
    audio.setCityFocus(false);
    gsap.to(screen.current, { scaleY: 0.01, scaleX: 0.02, duration: 0.35, ease: "power2.in", onComplete: () => goto("ending") });
  }

  const party = PARTIES[state.party as PartyId];
  const totalPct = frame?.pct ?? 0;

  return (
    <div className={`night ${reducedMotion() ? "reduced" : ""}`} ref={root} style={{ backgroundImage: `url(${DESK_ART.desk_bg})` }}>
      <div className="night-dark" />
      <div className="tv" ref={tv}>
        <div className="tv-cabinet">
          <div className="tv-screen" ref={screen}>
            {phase !== "night" && (
              <div className="crt">
                <header className="bc-top">
                  <div className="bc-brand">
                    <span className="bc-flag">PLANTÃO ELEITORAL</span>
                    <span className="bc-channel">{ELECTION_LINES.channel}</span>
                  </div>
                  <div className="bc-progress">
                    <div className="bc-progress-label">
                      {broadcast.rounds.length > 1 ? `${round.title.toUpperCase()} · ` : ""}APURAÇÃO · {totalPct.toFixed(0)}% DAS URNAS
                    </div>
                    <div className="bc-progress-track">
                      <div className="bc-progress-fill" style={{ width: `${totalPct}%` }} />
                    </div>
                  </div>
                </header>

                <main className="bc-main">
                  <LineChart frames={round.frames} upTo={frameIdx} candidates={round.candidates} colors={colors} />
                  <aside className="bc-side">
                    <BarsPanel frame={frame} candidates={round.candidates} colors={colors} names={names} result={result} partyShort={party.short} />
                    <MiniMap path={result.path} frames={round.frames} upTo={frameIdx} colors={colors} />
                  </aside>
                </main>

                <footer className="bc-ticker">
                  <div className="bc-anchor">
                    <img src={portrait("anchor_cid")} alt="" />
                    <span>{ELECTION_LINES.anchor}</span>
                  </div>
                  <div className="bc-line" key={`${roundIdx}-${frameIdx}-${phase}`}>
                    {phase === "final" ? broadcast.finalLine : (frame?.line ?? interstitial ?? round.intro)}
                  </div>
                </footer>

                {interstitial && (
                  <div className="bc-interstitial">
                    <StaticNoise />
                    <div className="bc-interstitial-text">{interstitial}</div>
                  </div>
                )}
                <div className="bc-virada" ref={virada}>
                  VIRADA!
                </div>
                <div className="crt-scanlines" />
                <div className="crt-vignette" />
              </div>
            )}
          </div>
          <div className="tv-knobs">
            <span />
            <span />
            <i />
          </div>
        </div>
      </div>

      {phase === "broadcast" && (
        <div className="night-controls">
          <DeskButton variant="ghost" onClick={() => setPaused((p) => !p)}>
            {paused ? "▶ Continuar" : "❚❚ Pausar"}
          </DeskButton>
          <DeskButton variant="ghost" onClick={() => setSpeed((v) => (v === 1 ? 2 : 1))}>
            {speed === 1 ? "2× mais rápido" : "Velocidade normal"}
          </DeskButton>
          <DeskButton variant="ghost" onClick={finish}>
            Pular para o resultado
          </DeskButton>
        </div>
      )}
      {phase === "final" && (
        <div className="night-controls">
          <DeskButton variant="primary" onClick={toNewspaper}>
            Ler o jornal de amanhã →
          </DeskButton>
        </div>
      )}
    </div>
  );
}
