import { remainingCubes } from "@/game/board";
import { useGameStore } from "@/game/store";
import { Disc3, Heart, Layers, Target, Volume2, VolumeX } from "lucide-react";

function pad(value: number, width = 6): string {
  return String(value).padStart(width, "0");
}

function Lives() {
  const lives = useGameStore((s) => s.lives);
  const shown = Math.min(lives, 6);
  return (
    <div className="flex items-center gap-1" aria-label={`${lives} lives`}>
      {Array.from({ length: Math.max(shown, 3) }).map((_, i) => (
        <Heart
          key={`heart-${i + 1}`}
          data-ocid={`hud.life.${i + 1}`}
          className={`size-5 transition-colors ${
            i < lives ? "fill-destructive text-destructive" : "text-muted"
          }`}
        />
      ))}
      {lives > 6 && (
        <span className="font-mono text-xs font-bold text-foreground">
          +{lives - 6}
        </span>
      )}
    </div>
  );
}

function TargetSwatch() {
  const level = useGameStore((s) => s.level);
  return (
    <div
      className="flex items-center gap-2"
      data-ocid="hud.target"
      aria-label="Target color"
    >
      <Target className="size-4 text-muted-foreground" />
      <span
        className="size-5 rounded-sm border-2 border-white/20 shadow-plastic-sm"
        style={{ backgroundColor: level.targetHex }}
      />
      <span className="font-mono text-xs text-muted-foreground">TARGET</span>
    </div>
  );
}

function Discs() {
  const discs = useGameStore((s) => s.discSpots.filter((d) => !d.used).length);
  return (
    <div
      className="flex items-center gap-2"
      data-ocid="hud.discs"
      aria-label={`${discs} discs remaining`}
    >
      <Disc3 className="size-4 text-muted-foreground" />
      <span className="font-mono text-sm font-bold text-foreground">
        {discs}
      </span>
    </div>
  );
}

function Level() {
  const levelNumber = useGameStore((s) => s.levelNumber);
  return (
    <div
      className="flex items-center gap-2"
      data-ocid="hud.level"
      aria-label={`Level ${levelNumber}`}
    >
      <Layers className="size-4 text-muted-foreground" />
      <span className="font-mono text-sm font-bold text-foreground">
        LVL {levelNumber}
      </span>
    </div>
  );
}

function Remaining() {
  const board = useGameStore((s) => s.board);
  const left = remainingCubes(board);
  return (
    <div
      className="flex items-center gap-2"
      data-ocid="hud.remaining"
      aria-label={`${left} cubes left`}
    >
      <span className="font-mono text-xs text-muted-foreground">LEFT</span>
      <span className="font-mono text-sm font-bold text-foreground">
        {left}
      </span>
    </div>
  );
}

function Combo() {
  const combo = useGameStore((s) => s.combo);
  if (combo < 2) return null;
  return (
    <div
      data-ocid="hud.combo"
      className="pointer-events-none absolute left-1/2 top-[28%] -translate-x-1/2 animate-pop-in"
    >
      <span className="font-display text-4xl font-extrabold text-accent text-shadow-pop">
        x{combo}
      </span>
    </div>
  );
}

function Status() {
  const message = useGameStore((s) => s.message);
  const phase = useGameStore((s) => s.phase);
  if (!message || phase !== "playing") return null;
  return (
    <div className="pointer-events-none absolute left-1/2 top-16 -translate-x-1/2 sm:top-20">
      <span className="rounded-full bg-card/80 px-4 py-1 font-display text-sm font-bold text-foreground shadow-plastic-sm backdrop-blur">
        {message}
      </span>
    </div>
  );
}

function MuteToggle() {
  const muted = useGameStore((s) => s.soundMuted);
  const setMuted = useGameStore((s) => s.setSoundMuted);
  return (
    <button
      type="button"
      data-ocid="hud.mute"
      aria-label={muted ? "Unmute sound" : "Mute sound"}
      onClick={() => setMuted(!muted)}
      className="pointer-events-auto flex items-center gap-2 rounded-2xl bg-card/80 px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider text-foreground shadow-plastic-sm backdrop-blur hover:bg-card"
    >
      {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
      {muted ? "Muted" : "Sound"}
    </button>
  );
}

export function HUD() {
  const score = useGameStore((s) => s.score);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-2 p-2 pt-[max(0.5rem,env(safe-area-inset-top))] sm:gap-4 sm:p-4">
      <div className="flex flex-col gap-1.5 sm:gap-2">
        <div
          className="rounded-xl bg-card/80 px-2.5 py-1 shadow-plastic-sm backdrop-blur sm:rounded-2xl sm:px-4 sm:py-2"
          data-ocid="hud.score"
        >
          <span className="font-mono text-lg font-bold tracking-wider text-foreground sm:text-2xl">
            {pad(score)}
          </span>
        </div>
        <div className="rounded-xl bg-card/80 px-2.5 py-1 shadow-plastic-sm backdrop-blur sm:rounded-2xl sm:px-4 sm:py-2">
          <Lives />
        </div>
      </div>

      <div className="flex max-w-[55%] flex-wrap items-end justify-end gap-1.5 sm:max-w-none sm:flex-col sm:gap-2">
        <div className="rounded-xl bg-card/80 px-2.5 py-1 shadow-plastic-sm backdrop-blur sm:rounded-2xl sm:px-4 sm:py-2">
          <Level />
        </div>
        <div className="hidden rounded-2xl bg-card/80 px-4 py-2 shadow-plastic-sm backdrop-blur sm:block">
          <TargetSwatch />
        </div>
        <div className="flex gap-1.5 sm:gap-2">
          <div className="rounded-xl bg-card/80 px-2 py-1 shadow-plastic-sm backdrop-blur sm:rounded-2xl sm:px-3 sm:py-2">
            <Discs />
          </div>
          <div className="rounded-xl bg-card/80 px-2 py-1 shadow-plastic-sm backdrop-blur sm:rounded-2xl sm:px-3 sm:py-2">
            <Remaining />
          </div>
        </div>
        <MuteToggle />
      </div>

      <Status />
      <Combo />
    </div>
  );
}
