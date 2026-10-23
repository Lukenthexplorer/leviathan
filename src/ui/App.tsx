import { DeskScreen } from "./screens/DeskScreen";
import { ElectionNight } from "./election/ElectionNight";
import { EndingScreen } from "./screens/EndingScreen";
import { PartyScreen } from "./screens/PartyScreen";
import { TitleScreen } from "./screens/TitleScreen";
import { useGame } from "./store";

export function App() {
  const screen = useGame((s) => s.screen);
  switch (screen) {
    case "title":
      return <TitleScreen />;
    case "party":
      return <PartyScreen />;
    case "desk":
      return <DeskScreen />;
    case "election":
      return <ElectionNight />;
    case "ending":
      return <EndingScreen />;
  }
}
