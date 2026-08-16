import { useGameStore } from "@/game/store";
import { GameScreen } from "@/pages/GameScreen";
import { HowToPlay } from "@/pages/HowToPlay";
import { LeaderboardScreen } from "@/pages/LeaderboardScreen";
import { MainMenu } from "@/pages/MainMenu";
import { SettingsScreen } from "@/pages/SettingsScreen";

/** The app shell: state-based routing between menu, game, and settings. */
export default function App() {
  const screen = useGameStore((s) => s.screen);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      {screen === "menu" && <MainMenu />}
      {screen === "game" && <GameScreen />}
      {screen === "settings" && <SettingsScreen />}
      {screen === "howto" && <HowToPlay />}
      {screen === "leaderboard" && <LeaderboardScreen />}
    </div>
  );
}
