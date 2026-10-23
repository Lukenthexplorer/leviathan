import { CHARACTERS, type CharacterId } from "../../../content/councilman/characters";
import type { GameState } from "../../../core/types";
import { portrait } from "../../assets";
import { characterName, characterRole, relationWord } from "../../text";
import { Sheet } from "../Sheet";
import { ActionRow } from "./ActionRow";

const PEOPLE: CharacterId[] = ["party_boss", "mentor", "rival", "donor", "community_leader"];

/** The rolodex. Ask for a meeting; their answer lands on your desk. */
export function MeetingsPanel({ state, onClose }: { state: GameState; onClose: () => void }) {
  return (
    <Sheet title="Agenda de contatos" onClose={onClose} wide>
      <p className="panel-intro">Peça uma reunião e ela chega à sua mesa como um papel para responder.</p>
      {PEOPLE.map((id) => {
        const waiting = state.inbox.some((i) => i.from === id && i.choices?.length);
        return (
          <ActionRow
            key={id}
            title={
              <span className="person">
                <img src={portrait(CHARACTERS[id].portrait)} alt="" />
                <span>
                  {characterName(state, id)}
                  <small>{characterRole(state, id)}</small>
                </span>
              </span>
            }
            decision={{ kind: "meeting", with: id }}
            cta="Pedir reunião"
            disabled={waiting}
            disabledReason="O último papel dessa pessoa ainda está esperando na sua mesa"
            aside={<div className="relation">{relationWord(state.characters[id]?.relation ?? 0)}</div>}
          >
            {id === "party_boss" ? "Decide quem recebe a indicação do partido para prefeito." : CHARACTERS[id].bio}
          </ActionRow>
        );
      })}
    </Sheet>
  );
}
