import gsap from "gsap";
import { useLayoutEffect, useMemo, useRef } from "react";
import { writeLegacy } from "../../chapters/councilman/legacy";
import { audio } from "../audio/audio";
import { DeskButton } from "../desk/DeskButton";
import { useGame } from "../store";

/**
 * The end of the chapter: the front page spins in, then the history book
 * slides up underneath with what the public never knew.
 */
export function EndingScreen() {
  const state = useGame((s) => s.state);
  const goto = useGame((s) => s.goto);
  const root = useRef<HTMLDivElement>(null);
  const legacy = useMemo(() => (state ? writeLegacy(state) : null), [state]);

  useLayoutEffect(() => {
    if (!legacy) return;
    audio.setMusic({ kind: "office" });
    audio.setTension(legacy.tone === "defeat" ? 1 : 0);
    audio.sfx("newspaper_spin");
    const ctx = gsap.context(() => {
      gsap
        .timeline()
        .fromTo(".legacy-front", { scale: 0.05, rotation: -720, opacity: 0 }, { scale: 1, rotation: -1.5, opacity: 1, duration: 1, ease: "power2.out" })
        .add(() => audio.sfx(legacy.tone === "defeat" ? "scandal_sting" : "stamp_thud"))
        .from(".legacy-book", { y: 120, opacity: 0, duration: 0.8, ease: "power3.out" }, "+=0.6")
        .from(".legacy-section", { opacity: 0, y: 16, stagger: 0.35, duration: 0.5, onStart: () => audio.sfx("page_flip", { volume: 0.5 }) }, "-=0.2")
        .from(".legacy-verdict", { opacity: 0, scale: 0.96, duration: 0.8 }, "+=0.3")
        .from(".legacy-next", { opacity: 0, y: 24, rotation: 3, duration: 0.6, ease: "back.out(1.6)", onStart: () => audio.sfx("paper_slide", { volume: 0.6 }) }, "+=0.2")
        .from(".legacy-actions", { opacity: 0, duration: 0.5 });
    }, root);
    return () => ctx.revert();
  }, [legacy]);

  if (!state || !legacy) return null;
  return (
    <div className={`ending-screen tone-${legacy.tone}`} ref={root}>
      <article className="legacy-front">
        <div className="newspaper-masthead">CORREIO DE PORTO FERRO</div>
        <div className="newspaper-meta">
          <span>{legacy.kicker}</span>
          <span>{legacy.date}</span>
          <span>Edição extra</span>
        </div>
        <h1 className="newspaper-headline">{legacy.headline}</h1>
        <p className="newspaper-body">{legacy.lede}</p>
      </article>

      <article className="legacy-book">
        <div className="legacy-book-head">Porto Ferro: uma história política (1985–2010) · cap. 7</div>
        {legacy.sections.map((s) => (
          <section key={s.title} className={`legacy-section ${s.title === "O que ninguém soube" ? "secret" : ""}`}>
            <h2>{s.title}</h2>
            {s.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </section>
        ))}
        <section className="legacy-verdict">
          <h2>{legacy.verdict.title}</h2>
          <p>{legacy.verdict.paragraphs[0]}</p>
        </section>
      </article>

      {legacy.next && (
        <aside className="legacy-next">
          <div className="legacy-next-kicker">Capítulo 2 · em breve</div>
          <p>{legacy.next}</p>
        </aside>
      )}

      <div className="legacy-actions">
        <DeskButton variant="primary" onClick={() => goto("party")}>
          Começar uma nova carreira
        </DeskButton>
      </div>
    </div>
  );
}
