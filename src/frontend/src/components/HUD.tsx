import { useGameStore } from "@/game/store";
import { Disc3, Heart, Layers, Target } from "lucide-react";

/** Zero-pad a number to a fixed width for the score readout. */
function pad(value: number, width = 6): string {
  return String(value).padStart(width, "0");
}

/** A row of hearts representing the player's remaining lives. */
function Lives() {
  const lives = useGameStore((s) => s.lives);
  return (
    <div className="flex items-center gap-1" aria-label={`${lives} lives`}>
      {Array.from({ length: 3 }).map((_, i) => (
        <Heart
          key={`heart-${i + 1}`}
          data-ocid={`hud.life.${i + 1}`}
          className={`size-5 transition-colors ${
            i < lives ? "fill-destructive text-destructive" : "text-muted"
          }`}
        />
      ))}
    </div>
  );
}

/** The target color swatch the player must paint every cube to. */
function TargetSwatch() {
  const targetColor = useGameStore((s) => s.targetColor);
  const swatch =
    targetColor === "safe"
      ? "#4cd964"
      : targetColor === "deadly"
        ? "#e14b8a"
        : "#30d5c8";
  return (
    <div
      className="flex items-center gap-2"
      data-ocid="hud.target"
      aria-label="Target color"
    >
      <Target className="size-4 text-muted-foreground" />
      <span
        className="size-5 rounded-full border-2 border-white/20 shadow-plastic-sm"
        style={{ backgroundColor: swatch }}
      />
      <span className="font-mono text-xs text-muted-foreground">TARGET</span>
    </div>
  );
}

/** The remaining discs (hops) readout. */
function Discs() {
  const discs = useGameStore((s) => s.discs);
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

/** The current level number readout. */
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

/** A combo multiplier overlay shown while the player chains hops. */
function Combo() {
  const combo = useGameStore((s) => s.combo);
  if (combo < 2) return null;
  return (
    <div
      data-ocid="hud.combo"
      className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 animate-pop-in"
    >
      <span className="font-display text-4xl font-extrabold text-accent text-shadow-pop">
        x{combo}
      </span>
    </div>
  );
}

/**
 * The clean, unobtrusive HUD positioned over the 3D canvas.
 */
export function HUD() {
  const score = useGameStore((s) => s.score);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-4 p-4">
      <div className="flex flex-col gap-2">
        <div
          className="rounded-2xl bg-card/80 px-4 py-2 shadow-plastic-sm backdrop-blur"
          data-ocid="hud.score"
        >
          <span className="font-mono text-2xl font-bold tracking-wider text-foreground">
            {pad(score)}
          </span>
        </div>
        <div className="rounded-2xl bg-card/80 px-4 py-2 shadow-plastic-sm backdrop-blur">
          <Lives />
        </div>
      </div>

      <div className="flex flex-col items-end gap-2">
        <div className="rounded-2xl bg-card/80 px-4 py-2 shadow-plastic-sm backdrop-blur">
          <Level />
        </div>
        <div className="rounded-2xl bg-card/80 px-4 py-2 shadow-plastic-sm backdrop-blur">
          <TargetSwatch />
        </div>
        <div className="rounded-2xl bg-card/80 px-4 py-2 shadow-plastic-sm backdrop-blur">
          <Discs />
        </div>
      </div>

      <Combo />
    </div>
  );
}
