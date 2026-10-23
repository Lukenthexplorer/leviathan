import { DeskButton } from "../desk/DeskButton";
import { weekDate } from "../desk/Calendar";
import { useGame } from "../store";

// Placeholder: the proper newspaper-style legacy page comes in step 8.
const HEADLINES: Record<string, string> = {
  arrested: "COUNCILLOR LEAVES CÂMARA IN HANDCUFFS",
  expelled: "PARTY EXPELS REBEL COUNCILLOR",
  lost_support: "A CAREER ENDS IN SILENCE: NOBODY IS LISTENING ANY MORE",
  candidacy: "MAYORAL CANDIDACY ANNOUNCED",
};

export function EndingScreen() {
  const state = useGame((s) => s.state);
  const goto = useGame((s) => s.goto);
  if (!state) return null;
  return (
    <div className="ending-screen">
      <div className="newspaper">
        <div className="newspaper-masthead">CORREIO DE PORTO FERRO</div>
        <div className="newspaper-date">{weekDate(state.turn)}</div>
        <h1 className="newspaper-headline">{HEADLINES[state.ending ?? ""] ?? state.ending}</h1>
        <p>{state.player.name}'s career in the City Council is over after {state.turn - 1} weeks.</p>
      </div>
      <DeskButton variant="primary" onClick={() => goto("party")}>
        Start a new career
      </DeskButton>
    </div>
  );
}
