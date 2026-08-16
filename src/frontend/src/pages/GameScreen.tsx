import { HUD } from "@/components/HUD";
import { SaveScore } from "@/components/SaveScore";
import { Scene } from "@/components/three/Scene";
import { useGameStore } from "@/game/store";
import type { HopDirection } from "@/game/types";
import { useGameAudio } from "@/game/useGameAudio";
import { useSwipeHop } from "@/game/useSwipeHop";
import {
  ArrowLeft,
  Camera,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEffect, useState } from "react";
import { PillButton } from "./MainMenu";

/**
 * Rotated-diamond mapping (classic 45° joystick):
 *   Q / Left  = up-left   (north)
 *   W / Up    = up-right  (west)
 *   A / Down  = down-left (east)
 *   S / Right / D = down-right (south)
 */
const KEY_DIRECTIONS: Record<string, HopDirection> = {
  KeyQ: "north",
  ArrowLeft: "north",
  KeyW: "west",
  ArrowUp: "west",
  KeyA: "east",
  ArrowDown: "east",
  KeyS: "south",
  ArrowRight: "south",
  KeyD: "south",
};

function HopPad() {
  const hop = useGameStore((s) => s.hop);
  const phase = useGameStore((s) => s.phase);
  const disabled = phase !== "playing";

  const btn = (dir: HopDirection, label: string, ocid: string, extra = "") => (
    <button
      type="button"
      data-ocid={ocid}
      aria-label={label}
      disabled={disabled}
      onPointerDown={(event) => {
        event.preventDefault();
        hop(dir);
      }}
      className={`flex size-16 items-center justify-center rounded-2xl bg-card/90 font-mono text-[10px] font-bold uppercase tracking-wide text-foreground shadow-plastic-sm backdrop-blur transition-transform hover:brightness-110 active:translate-y-0.5 disabled:opacity-40 sm:size-14 ${extra}`}
    >
      {label}
    </button>
  );

  return (
    <div
      className="pointer-events-auto absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-1/2 z-20 grid -translate-x-1/2 grid-cols-3 grid-rows-3 gap-1.5 sm:bottom-8 sm:left-4 sm:translate-x-0 sm:gap-2"
      data-ocid="game.hop_pad"
    >
      <div />
      {btn("west", "Up-R", "game.hop.west")}
      <div />
      {btn("north", "Up-L", "game.hop.north")}
      <div className="flex items-center justify-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        hop
      </div>
      {btn("south", "Dn-R", "game.hop.south")}
      <div />
      {btn("east", "Dn-L", "game.hop.east")}
      <div />
    </div>
  );
}

export function GameScreen() {
  useGameAudio();
  const phase = useGameStore((s) => s.phase);
  useSwipeHop(phase === "playing");
  const cameraMode = useGameStore((s) => s.cameraMode);
  const setCameraMode = useGameStore((s) => s.setCameraMode);
  const pauseGame = useGameStore((s) => s.pauseGame);
  const resumeGame = useGameStore((s) => s.resumeGame);
  const backToMenu = useGameStore((s) => s.backToMenu);
  const hop = useGameStore((s) => s.hop);
  const nextLevel = useGameStore((s) => s.nextLevel);
  const startGame = useGameStore((s) => s.startGame);
  const score = useGameStore((s) => s.score);
  const levelNumber = useGameStore((s) => s.levelNumber);
  const levelName = useGameStore((s) => s.level.name);
  const soundMuted = useGameStore((s) => s.soundMuted);
  const setSoundMuted = useGameStore((s) => s.setSoundMuted);
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    setShowIntro(levelNumber > 0);
    const timer = window.setTimeout(() => setShowIntro(false), 1700);
    return () => window.clearTimeout(timer);
  }, [levelNumber]);

  const toggleCamera = () =>
    setCameraMode(cameraMode === "isometric" ? "orbit" : "isometric");

  useEffect(() => {
    if (phase !== "playing") return;
    const preventScroll = (event: TouchEvent) => {
      event.preventDefault();
    };
    document.addEventListener("touchmove", preventScroll, { passive: false });
    return () => document.removeEventListener("touchmove", preventScroll);
  }, [phase]);

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
        else if (phase === "playing") pauseGame();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [hop, phase, pauseGame, resumeGame]);

  return (
    <div className="relative h-dvh w-screen overflow-hidden bg-background touch-none">
      <Scene />
      <HUD />

      <div className="absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] right-[max(0.5rem,env(safe-area-inset-right))] z-20 flex flex-col items-end gap-2 sm:bottom-6 sm:right-4">
        <button
          type="button"
          data-ocid="game.camera_toggle"
          aria-label={`Switch to ${cameraMode === "isometric" ? "orbit" : "isometric"} camera`}
          onClick={toggleCamera}
          className="hidden items-center gap-2 rounded-full bg-card/80 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-foreground shadow-plastic-sm backdrop-blur transition-colors hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex"
        >
          <Camera className="size-4" />
          {cameraMode}
        </button>
        <button
          type="button"
          data-ocid="game.pause_button"
          aria-label={phase === "paused" ? "Resume game" : "Pause game"}
          onClick={phase === "paused" ? resumeGame : pauseGame}
          className="flex size-11 items-center justify-center rounded-full bg-card/85 text-foreground shadow-plastic-sm backdrop-blur sm:h-auto sm:w-auto sm:gap-2 sm:px-4 sm:py-2 sm:font-mono sm:text-xs sm:font-bold sm:uppercase sm:tracking-wider"
        >
          {phase === "paused" ? (
            <Play className="size-5 fill-current sm:size-4" />
          ) : (
            <Pause className="size-5 sm:size-4" />
          )}
          <span className="hidden sm:inline">
            {phase === "paused" ? "Resume" : "Pause"}
          </span>
        </button>
        <button
          type="button"
          data-ocid="game.back_button"
          aria-label="Back to menu"
          onClick={backToMenu}
          className="flex size-11 items-center justify-center rounded-full bg-card/85 text-foreground shadow-plastic-sm backdrop-blur sm:h-auto sm:w-auto sm:gap-2 sm:px-4 sm:py-2 sm:font-mono sm:text-xs sm:font-bold sm:uppercase sm:tracking-wider"
        >
          <ArrowLeft className="size-5 sm:size-4" />
          <span className="hidden sm:inline">Menu</span>
        </button>
      </div>

      {phase === "playing" && <HopPad />}

      {phase === "playing" && showIntro && (
        <div
          data-ocid="game.round_intro"
          className="pointer-events-none absolute inset-x-0 top-[22%] z-20 flex flex-col items-center animate-pop-in"
        >
          <span className="font-mono text-xs uppercase tracking-widest text-primary">
            Round {levelNumber}
          </span>
          <h2 className="font-display text-4xl font-black text-foreground text-shadow-pop sm:text-5xl">
            {levelName}
          </h2>
        </div>
      )}

      {phase === "paused" && (
        <div
          data-ocid="game.pause_overlay"
          className="absolute inset-0 z-30 flex items-center justify-center bg-background/70 backdrop-blur-sm"
        >
          <div className="mx-4 flex max-h-[90dvh] w-full max-w-md flex-col items-center gap-5 overflow-y-auto rounded-3xl bg-card/90 p-6 shadow-plastic sm:gap-6 sm:p-10">
            <h2 className="font-display text-3xl font-black text-foreground sm:text-4xl">
              Paused
            </h2>
            <p className="text-center text-sm text-muted-foreground">
              Swipe diagonally or use the hop pad. On a keyboard: Q / ← up-left
              · W / ↑ up-right · A / ↓ down-left · S / → down-right. Hop onto a
              pink disc to ride home. Do not hop off the pyramid.
            </p>
            <div className="flex flex-col items-center gap-3">
              <PillButton dataOcid="game.resume_button" onClick={resumeGame}>
                <Play className="size-5 fill-current" />
                Resume
              </PillButton>
              <PillButton
                dataOcid="game.pause_mute_button"
                onClick={() => setSoundMuted(!soundMuted)}
                variant="secondary"
              >
                {soundMuted ? (
                  <VolumeX className="size-5" />
                ) : (
                  <Volume2 className="size-5" />
                )}
                {soundMuted ? "Unmute" : "Mute"}
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

      {phase === "levelclear" && (
        <div
          data-ocid="game.levelclear_overlay"
          className="absolute inset-0 z-30 flex items-center justify-center bg-background/70 backdrop-blur-sm"
        >
          <div className="mx-4 flex max-h-[90dvh] w-full max-w-lg flex-col items-center gap-5 overflow-y-auto rounded-3xl bg-card/90 p-6 text-center shadow-plastic sm:gap-6 sm:p-10">
            <span className="font-mono text-xs uppercase tracking-widest text-primary">
              {levelName} complete
            </span>
            <h2 className="font-display text-4xl font-black text-foreground text-shadow-pop sm:text-5xl">
              Level Clear!
            </h2>
            <p className="max-w-sm text-muted-foreground">
              Every cube matches the target. Score {score.toLocaleString()}.
              Next up: stage {levelNumber + 1}.
            </p>
            <PillButton dataOcid="game.next_level_button" onClick={nextLevel}>
              <Play className="size-5 fill-current" />
              Next Level
            </PillButton>
          </div>
        </div>
      )}

      {phase === "gameover" && (
        <div
          data-ocid="game.gameover_overlay"
          className="absolute inset-0 z-30 flex items-center justify-center bg-background/70 backdrop-blur-sm"
        >
          <div className="mx-4 flex max-h-[90dvh] w-full max-w-lg flex-col items-center gap-4 overflow-y-auto rounded-3xl bg-card/90 p-5 text-center shadow-plastic sm:gap-6 sm:p-10">
            <span className="font-mono text-xs uppercase tracking-widest text-destructive">
              Out of lives
            </span>
            <h2 className="font-display text-4xl font-black text-destructive text-shadow-pop sm:text-5xl">
              Game Over
            </h2>
            <p className="max-w-sm text-muted-foreground">
              Final score {score.toLocaleString()} on stage {levelNumber}. The
              pyramid is still waiting.
            </p>
            <SaveScore points={score} stage={levelNumber} />
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
