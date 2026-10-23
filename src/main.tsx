import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./ui/App";
import { useGame } from "./ui/store";
import "./ui/styles.css";

// Dev only: poke the game from the browser console, e.g.
//   __game.getState().state.hidden          (peek at hidden variables)
//   __game.setState(s => ({ state: { ...s.state, turn: 20 } }))
if (import.meta.env.DEV) Object.assign(window, { __game: useGame });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
