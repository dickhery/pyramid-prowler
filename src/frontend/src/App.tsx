import { useGameStore } from "@/game/store";
import { GameScreen } from "@/pages/GameScreen";
import { MainMenu } from "@/pages/MainMenu";
import { SettingsScreen } from "@/pages/SettingsScreen";

/** The app shell: state-based routing between menu, game, and settings. */
export default function App() {
  const screen = useGameStore((s) => s.screen);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {screen === "menu" && <MainMenu />}
      {screen === "game" && <GameScreen />}
      {screen === "settings" && <SettingsScreen />}
    </div>
  );
}
