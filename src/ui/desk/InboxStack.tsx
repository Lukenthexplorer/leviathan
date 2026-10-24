import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { CHARACTERS, type CharacterId } from "../../content/councilman/characters";
import type { DeskItem, GameState } from "../../core/types";
import { audio } from "../audio/audio";
import { slideOnto } from "../feel/feel";
import { useHoverLift } from "../feel/useHoverLift";
import { answerFor, useGame } from "../store";
import { characterName, characterPortrait, KIND_LABEL } from "../text";

/**
 * The papers on the desk, as one stack in the lamp's light. The top paper is
 * readable; the ones underneath show only their edges, each with a little tab
 * (Carta, Jornal, Telefone...) that pulls it to the top.
 *
 * Every paper's tilt and offset come from its id (a hash), never from a random
 * draw: a paper keeps its exact place on the desk from one render to the next.
 */
export function InboxStack({ state, onOpen }: { state: GameState; onOpen: (item: DeskItem) => void }) {
  const pending = useGame((s) => s.pending);
  const [pulled, setPulled] = useState<string | null>(null);

  // Unanswered first, newest first; answered papers sink to the bottom. A pulled paper goes on top.
  const order = useMemo(() => {
    const ranked = state.inbox
      .map((item, i) => ({ item, i, answered: !!answerFor(pending, item.id) }))
      .sort((a, b) => Number(a.answered) - Number(b.answered) || b.item.turn - a.item.turn || b.i - a.i);
    const top = ranked.findIndex((r) => r.item.id === pulled);
    if (top > 0) ranked.unshift(...ranked.splice(top, 1));
    return ranked;
  }, [state.inbox, pending, pulled]);

  if (order.length === 0) return <div className="inbox-empty">A mesa está limpa. Por enquanto.</div>;

  const below = order.slice(1);
  return (
    <div className="inbox" style={{ ["--papers" as string]: order.length }}>
      {/* Bottom of the stack first, so the DOM order is the painting order. */}
      {[...below].reverse().map(({ item, answered }) => (
        <StackedPaper key={item.id} item={item} answered={answered} delay={0.05 * below.findIndex((b) => b.item.id === item.id)} />
      ))}
      <TopPaper key={order[0]!.item.id} item={order[0]!.item} state={state} answered={order[0]!.answered} onOpen={() => onOpen(order[0]!.item)} />
      {/* The tabs live in their own layer on the stack's right edge, so the top paper never covers them. */}
      {below.length > 0 && (
        <div className="paper-tabs">
          {below.map(({ item, answered }) => (
            <button
              key={item.id}
              className={`paper-tab kind-${item.kind} ${answered ? "answered" : ""}`}
              onClick={() => {
                audio.sfx("paper_pickup", { volume: 0.7 });
                setPulled(item.id);
              }}
              aria-label={`Puxar para cima: ${KIND_LABEL[item.kind] ?? item.kind}, ${item.title}`}
              title={item.title}
            >
              {KIND_LABEL[item.kind] ?? item.kind}
              {!answered && item.choices?.length ? <i className="paper-tab-dot" aria-hidden /> : null}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** A stable pseudo-random number in [-1, 1] from a string (FNV-1a hash), one per `salt`. */
export function jitter(id: string, salt: number): number {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return ((h >>> 0) / 0xffffffff) * 2 - 1;
}

/** Where a paper lies: a slight tilt and offset, the same every render. */
const placement = (id: string) =>
  ({
    rotate: `${(jitter(id, 1) * 3.5).toFixed(2)}deg`,
    // As variables, so the phone's ringing shake can move around this spot (see .ringing in styles.css).
    "--tx": `calc(var(--cm) * ${(jitter(id, 2) * 1.2).toFixed(2)})`,
    "--ty": `calc(var(--cm) * ${(jitter(id, 3) * 0.8).toFixed(2)})`,
  }) as React.CSSProperties;

function useArrival<T extends HTMLElement>(ref: React.RefObject<T | null>, delay: number) {
  useLayoutEffect(() => {
    if (ref.current) slideOnto(ref.current, delay);
    // Only on mount: a paper slides in once, when it first lands on the desk.
  }, []);
}

function TopPaper(props: { item: DeskItem; state: GameState; answered: boolean; onOpen: () => void }) {
  const { item, state } = props;
  const [ref, hover] = useHoverLift<HTMLButtonElement>();
  useArrival(ref, 0.15);
  const who = item.from as CharacterId | undefined;
  return (
    <button
      ref={ref}
      {...hover}
      className={`paper-card paper-top kind-${item.kind} ${props.answered ? "answered" : ""} ${item.kind === "phone" && !props.answered ? "ringing" : ""}`}
      style={placement(item.id)}
      onClick={props.onOpen}
      aria-label={`Ler: ${item.title}`}
    >
      <div className="paper-card-kind">{KIND_LABEL[item.kind] ?? item.kind}</div>
      {item.kind === "newspaper" && <div className="paper-card-masthead">Correio de Porto Ferro</div>}
      {who && CHARACTERS[who] && <img className="paper-card-portrait" src={characterPortrait(state, who, item.expression)} alt="" />}
      <div className="paper-card-title">{item.title}</div>
      {who && <div className="paper-card-from">{characterName(state, who)}</div>}
      {item.body && <div className="paper-card-body">{item.body}</div>}
      <div className="paper-card-more">{item.choices?.length && !props.answered ? "Ler e responder →" : "Ler →"}</div>
      {props.answered && <div className="paper-card-ink">{item.scheme ? "EM ANDAMENTO" : item.choices?.length ? "RESPONDIDO" : "ARQUIVADO"}</div>}
    </button>
  );
}

/** A paper under the top one: only its edges show. */
function StackedPaper(props: { item: DeskItem; answered: boolean; delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useArrival(ref, props.delay);
  return <div ref={ref} className={`paper-card paper-under kind-${props.item.kind} ${props.answered ? "answered" : ""}`} style={placement(props.item.id)} aria-hidden />;
}
