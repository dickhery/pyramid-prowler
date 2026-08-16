import { arcadeAudio } from "@/game/audio";
import { useGameStore } from "@/game/store";
import { GameScreen } from "@/pages/GameScreen";
import { HowToPlay } from "@/pages/HowToPlay";
import { LeaderboardScreen } from "@/pages/LeaderboardScreen";
import { MainMenu } from "@/pages/MainMenu";
import { SettingsScreen } from "@/pages/SettingsScreen";
import { useEffect } from "react";

/** The app shell: state-based routing between menu, game, and settings. */
export default function App() {
  const screen = useGameStore((s) => s.screen);

  useEffect(() => {
    const unlock = () => arcadeAudio.unlock();
    window.addEventListener("pointerdown", unlock);
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);

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
