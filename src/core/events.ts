import type { EventDef } from "./chapter";
import { evaluate } from "./conditions";
import { applyEffects } from "./effects";
import { fillItem, pickVariant } from "./text";
import type { DeskItem, GameState } from "./types";

/**
 * Fire every event whose trigger now holds and that hasn't fired before.
 * Events are checked one by one in priority order, so an event's onFire can
 * enable (or block) a later one in the same week. Mutates the draft state.
 */
export function fireEvents(state: GameState, events: readonly EventDef[]): DeskItem[] {
  const fired: DeskItem[] = [];
  const ordered = [...events].sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
  for (const ev of ordered) {
    if (state.firedEvents.includes(ev.id) || !evaluate(state, ev.trigger)) continue;
    state.firedEvents.push(ev.id);
    applyEffects(state, ev.onFire ?? [], { kind: "event", id: ev.id, turn: state.turn, label: ev.item.title });
    const item: DeskItem = fillItem(state, pickVariant(state, { ...ev.item, turn: state.turn }, ev.variants));
    state.inbox.push(item);
    fired.push(item);
  }
  return fired;
}
