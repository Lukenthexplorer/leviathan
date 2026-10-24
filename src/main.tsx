import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./ui/App";
import { useGame } from "./ui/store";
import "./ui/styles.css";

// Dev only: poke the game from the browser console, e.g.
//   __game.getState().state.hidden          (peek at hidden variables)
//   __game.setState(s => ({ state: { ...s.state, turn: 20 } }))
if (import.meta.env.DEV) {
  Object.assign(window, { __game: useGame });
  // ?teste=eleicao etc.: jump straight to a scenario (autosave off). See ui/devScenarios.ts.
  const { loadDevScenario } = await import("./ui/devScenarios");
  const scenario = loadDevScenario();
  if (scenario) document.title = `Leviathan · teste: ${scenario}`;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
