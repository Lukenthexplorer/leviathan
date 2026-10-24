import gsap from "gsap";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { buildBroadcast, type Frame } from "../../chapters/councilman/broadcast";
import { PLAYER } from "../../chapters/councilman/election";
import { ELECTION_LINES } from "../../content/councilman/election_lines";
import { PARTIES, type PartyId } from "../../content/councilman/parties";
import { DESK_ART, TV_SCREEN, portrait } from "../assets";
import { audio } from "../audio/audio";
import { electionTension } from "../audio/tension";
import { DeskButton } from "../desk/DeskButton";
import { DeskLighting } from "../desk/DeskLighting";
import { useGame } from "../store";
import { BarsPanel, CHART_COLORS, LineChart, MiniMap } from "./Broadcast";
import { StaticNoise } from "./StaticNoise";

type Phase = "night" | "tv" | "broadcast" | "final";

/** The measured screen hole of tv_set.webp, handed to the CSS (see .tv in styles.css). */
const TV_VARS = {
  "--hole-l": TV_SCREEN.left,
  "--hole-t": TV_SCREEN.top,
  "--hole-w": TV_SCREEN.width,
  "--hole-h": TV_SCREEN.height,
  "--tv-aspect": TV_SCREEN.aspect,
  "--hole-aspect": (TV_SCREEN.width * TV_SCREEN.aspect) / TV_SCREEN.height,
} as React.CSSProperties;

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
  /** When the plantão jingle ends (ms timestamp): the radio waits for it. */
  const jingleEnds = useRef(0);
  const timers = useRef<number[]>([]);
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));

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
      // Night falls: the blue-lit desk fades in over the day one (same framing, so nothing jumps).
      .fromTo(".night-wood", { opacity: 0 }, { opacity: 1, duration: fast ? 0.1 : 1.6, ease: "power1.inOut" })
      .fromTo(".night-dark", { opacity: 0 }, { opacity: 0.88, duration: fast ? 0.1 : 1.4, ease: "power1.in" }, "<0.6")
      .fromTo(tv.current, { scale: 0.38, opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: fast ? 0.1 : 0.6 }, "-=0.4")
      .add(() => {
        setPhase("tv");
        audio.sfx("tv_power_on");
      })
      .add(() => audio.sfx("tv_static", { volume: 0.5 }), "+=0.5")
      .fromTo(screen.current, { scaleY: 0.01, filter: "brightness(3)" }, { scaleY: 1, filter: "brightness(1)", duration: fast ? 0.1 : 0.5, ease: "power2.out" })
      .add(() => {
        // Duration is 0 until the file has loaded; then it's a fair guess at the recording's length.
        const seconds = audio.sfx("plantao_jingle", { pitchJitter: 0 }) || 6.7;
        jingleEnds.current = performance.now() + seconds * 1000;
      }, "+=0.6")
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
        if (ri === 0) {
          // Once the jingle is over, the counting music comes in and the radio opens.
          later(() => {
            audio.setMusic({ kind: "election" });
            audio.narrate("opening");
          }, Math.max(0, jingleEnds.current - performance.now()));
        } else audio.sfx("tv_static", { volume: 0.5 });
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

  // Each new batch: a vote tick; on a lead change the sting and the VIRADA graphic; and the radio
  // line the broadcast script chose (the narrator drops it if something more important is playing).
  useEffect(() => {
    if (!frame || phase !== "broadcast") return;
    audio.sfx("vote_tick", { volume: 0.7, pitchJitter: 0.02 });
    audio.setTension(electionTension(frame), 1200);
    if (frame.leadChange) {
      audio.sfx("lead_change");
      if (virada.current && !reducedMotion()) {
        gsap.fromTo(virada.current, { scale: 2.4, opacity: 0, rotation: -8 }, { scale: 1, opacity: 1, rotation: -4, duration: 0.35, ease: "back.out(2)" });
        gsap.to(virada.current, { opacity: 0, duration: 0.4, delay: 1.3 });
      }
    }
    if (frame.narration) audio.narrate(frame.narration);
  }, [frame, phase]);

  // Leaving the screen silences the radio and cancels anything still scheduled.
  useEffect(
    () => () => {
      audio.stopNarration();
      timers.current.forEach(clearTimeout);
    },
    [],
  );

  function finish() {
    tl.current?.kill();
    const last = broadcast.rounds.length - 1;
    setRoundIdx(last);
    setFrameIdx(broadcast.rounds[last]!.frames.length - 1);
    setInterstitial(null);
    setPhase("final");
    // 100%: the counting music stops on the sting, then the crowd outside, then the radio calls it.
    audio.stopNarration();
    audio.setMusic({ kind: "silent" });
    audio.sfx(broadcast.playerWon ? "victory_sting" : "defeat_sting", { volume: 0.9, pitchJitter: 0 });
    later(() => {
      audio.sfx("fireworks", { volume: broadcast.playerWon ? 0.9 : 0.4, pitchJitter: 0 });
      audio.sfx(broadcast.playerWon ? "crowd_cheer" : "crowd_groan", { volume: 0.8, pitchJitter: 0 });
    }, 1200);
    later(() => audio.narrate("final"), 2500);
  }

  function toNewspaper() {
    audio.stopNarration();
    audio.sfx("tv_power_on", { volume: 0.4 });
    audio.setCityFocus(false);
    gsap.to(screen.current, { scaleY: 0.01, scaleX: 0.02, duration: 0.35, ease: "power2.in", onComplete: () => goto("ending") });
  }

  const party = PARTIES[state.party as PartyId];
  const totalPct = frame?.pct ?? 0;

  return (
    <div className={`night ${reducedMotion() ? "reduced" : ""}`} ref={root}>
      <DeskLighting variant="night" />
      <div className="night-dark" />
      <div className="tv" ref={tv} style={TV_VARS}>
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
                    {/* Cid lights up on a lead change and when he calls the result. */}
                    <img src={portrait("anchor_cid", phase === "final" || frame?.leadChange ? "pleased" : "neutral")} alt="" />
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
        {/* The real set on top: its screen is a hole, so the broadcast shows through. */}
        <img className="tv-frame" src={DESK_ART.tv_set} alt="" />
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
