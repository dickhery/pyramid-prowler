import { HUD } from "@/components/HUD";
import { Scene } from "@/components/three/Scene";
import { useGameStore } from "@/game/store";
import type { HopDirection } from "@/game/types";
import { ArrowLeft, Camera, Pause, Play, RotateCcw } from "lucide-react";
import { useEffect } from "react";
import { PillButton } from "./MainMenu";

/** Map keyboard input to the four diagonal hop directions. */
const KEY_DIRECTIONS: Record<string, HopDirection> = {
  ArrowUp: "north",
  KeyW: "north",
  ArrowDown: "south",
  KeyS: "south",
  ArrowRight: "east",
  KeyD: "east",
  ArrowLeft: "west",
  KeyA: "west",
};

/** The full-viewport game screen: 3D scene with HUD and controls overlaid. */
export function GameScreen() {
  const phase = useGameStore((s) => s.phase);
  const cameraMode = useGameStore((s) => s.cameraMode);
  const setCameraMode = useGameStore((s) => s.setCameraMode);
  const pauseGame = useGameStore((s) => s.pauseGame);
  const resumeGame = useGameStore((s) => s.resumeGame);
  const backToMenu = useGameStore((s) => s.backToMenu);
  const hop = useGameStore((s) => s.hop);
  const nextLevel = useGameStore((s) => s.nextLevel);
  const startGame = useGameStore((s) => s.startGame);

  const toggleCamera = () =>
    setCameraMode(cameraMode === "isometric" ? "orbit" : "isometric");

  // Wire keyboard controls for diagonal hopping.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const direction = KEY_DIRECTIONS[event.code];
      if (direction) {
        event.preventDefault();
        hop(direction);
        return;
      }
      if (event.code === "Escape") {
        if (phase === "paused") resumeGame();
        else pauseGame();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [hop, phase, pauseGame, resumeGame]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background">
      <Scene />

      <HUD />

      {/* Top-right control cluster */}
      <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
        <button
          type="button"
          data-ocid="game.camera_toggle"
          aria-label={`Switch to ${cameraMode === "isometric" ? "orbit" : "isometric"} camera`}
          onClick={toggleCamera}
          className="flex items-center gap-2 rounded-full bg-card/80 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-foreground shadow-plastic-sm backdrop-blur transition-colors hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Camera className="size-4" />
          {cameraMode}
        </button>
        <button
          type="button"
          data-ocid="game.pause_button"
          aria-label={phase === "paused" ? "Resume game" : "Pause game"}
          onClick={phase === "paused" ? resumeGame : pauseGame}
          className="flex items-center gap-2 rounded-full bg-card/80 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-foreground shadow-plastic-sm backdrop-blur transition-colors hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {phase === "paused" ? (
            <Play className="size-4 fill-current" />
          ) : (
            <Pause className="size-4" />
          )}
          {phase === "paused" ? "Resume" : "Pause"}
        </button>
        <button
          type="button"
          data-ocid="game.back_button"
          aria-label="Back to menu"
          onClick={backToMenu}
          className="flex items-center gap-2 rounded-full bg-card/80 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-foreground shadow-plastic-sm backdrop-blur transition-colors hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="size-4" />
          Menu
        </button>
      </div>

      {/* Pause overlay */}
      {phase === "paused" && (
        <div
          data-ocid="game.pause_overlay"
          className="absolute inset-0 z-30 flex items-center justify-center bg-background/70 backdrop-blur-sm"
        >
          <div className="flex flex-col items-center gap-6 rounded-3xl bg-card/90 p-10 shadow-plastic">
            <h2 className="font-display text-4xl font-black text-foreground">
              Paused
            </h2>
            <div className="flex flex-col items-center gap-3">
              <PillButton dataOcid="game.resume_button" onClick={resumeGame}>
                <Play className="size-5 fill-current" />
                Resume
              </PillButton>
              <PillButton
                dataOcid="game.pause_menu_button"
                onClick={backToMenu}
                variant="secondary"
              >
                <ArrowLeft className="size-5" />
                Back to Menu
              </PillButton>
            </div>
          </div>
        </div>
      )}

      {/* Level-clear overlay */}
      {phase === "levelclear" && (
        <div
          data-ocid="game.levelclear_overlay"
          className="absolute inset-0 z-30 flex items-center justify-center bg-background/70 backdrop-blur-sm"
        >
          <div className="flex flex-col items-center gap-6 rounded-3xl bg-card/90 p-10 text-center shadow-plastic">
            <span className="font-mono text-xs uppercase tracking-widest text-primary">
              Level {useGameStore.getState().levelNumber} complete
            </span>
            <h2 className="font-display text-5xl font-black text-foreground text-shadow-pop">
              Level Clear!
            </h2>
            <p className="max-w-sm text-muted-foreground">
              The pyramid glows with restored color. Onward to the next
              washed-out wonder!
            </p>
            <PillButton dataOcid="game.next_level_button" onClick={nextLevel}>
              <Play className="size-5 fill-current" />
              Next Level
            </PillButton>
          </div>
        </div>
      )}

      {/* Game-over overlay */}
      {phase === "gameover" && (
        <div
          data-ocid="game.gameover_overlay"
          className="absolute inset-0 z-30 flex items-center justify-center bg-background/70 backdrop-blur-sm"
        >
          <div className="flex flex-col items-center gap-6 rounded-3xl bg-card/90 p-10 text-center shadow-plastic">
            <span className="font-mono text-xs uppercase tracking-widest text-destructive">
              Out of discs
            </span>
            <h2 className="font-display text-5xl font-black text-destructive text-shadow-pop">
              Game Over
            </h2>
            <p className="max-w-sm text-muted-foreground">
              The color thief got the better of you this time. The pyramid
              awaits another prowl!
            </p>
            <div className="flex flex-col items-center gap-3">
              <PillButton dataOcid="game.retry_button" onClick={startGame}>
                <RotateCcw className="size-5" />
                Try Again
              </PillButton>
              <PillButton
                dataOcid="game.gameover_menu_button"
                onClick={backToMenu}
                variant="secondary"
              >
                <ArrowLeft className="size-5" />
                Back to Menu
              </PillButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
