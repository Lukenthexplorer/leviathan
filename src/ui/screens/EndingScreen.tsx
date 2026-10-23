import { weekDate } from "../../core/calendar";
import { DeskButton } from "../desk/DeskButton";
import { useGame } from "../store";

// Placeholder: the proper newspaper-style legacy page comes in step 8.
const HEADLINES: Record<string, [masc: string, fem: string]> = {
  arrested: ["VEREADOR DEIXA A CÂMARA ALGEMADO", "VEREADORA DEIXA A CÂMARA ALGEMADA"],
  expelled: ["PARTIDO EXPULSA VEREADOR REBELDE", "PARTIDO EXPULSA VEREADORA REBELDE"],
  lost_support: ["UMA CARREIRA TERMINA EM SILÊNCIO: NINGUÉM ESCUTA MAIS", "UMA CARREIRA TERMINA EM SILÊNCIO: NINGUÉM ESCUTA MAIS"],
  candidacy: ["CANDIDATURA A PREFEITO ANUNCIADA", "CANDIDATURA A PREFEITA ANUNCIADA"],
};

export function EndingScreen() {
  const state = useGame((s) => s.state);
  const goto = useGame((s) => s.goto);
  if (!state) return null;
  const headline = HEADLINES[state.ending ?? ""]?.[state.player.form === "f" ? 1 : 0] ?? state.ending;
  return (
    <div className="ending-screen">
      <div className="newspaper">
        <div className="newspaper-masthead">CORREIO DE PORTO FERRO</div>
        <div className="newspaper-date">{weekDate(state.turn)}</div>
        <h1 className="newspaper-headline">{headline}</h1>
        <p>
          A carreira de {state.player.name} na Câmara Municipal termina depois de {state.turn - 1} semanas.
        </p>
      </div>
      <DeskButton variant="primary" onClick={() => goto("party")}>
        Começar uma nova carreira
      </DeskButton>
    </div>
  );
}
