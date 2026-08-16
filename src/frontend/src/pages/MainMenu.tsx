import { arcadeAudio } from "@/game/audio";
import { useGameStore } from "@/game/store";
import { BookOpen, Play, Settings } from "lucide-react";

/** Stable unique keys for the decorative background cubes (not array indices). */
const DECO_KEYS = Array.from({ length: 25 }, (_, i) => `deco-${i}`);

/** A chunky pill-shaped primary button used across the menu and settings. */
export function PillButton({
  children,
  onClick,
  variant = "primary",
  dataOcid,
  className = "",
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "primary" | "secondary";
  dataOcid: string;
  className?: string;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full px-8 py-3 font-display text-lg font-extrabold transition-transform duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-0.5";
  const styles =
    variant === "primary"
      ? "bg-primary text-primary-foreground shadow-plastic hover:-translate-y-0.5 hover:brightness-110"
      : "bg-secondary text-secondary-foreground shadow-plastic-sm hover:-translate-y-0.5 hover:brightness-110";
  return (
    <button
      type="button"
      data-ocid={dataOcid}
      onClick={onClick}
      className={`${base} ${styles} ${className}`}
    >
      {children}
    </button>
  );
}

/** The main menu: title, tagline, backstory, and primary actions. */
export function MainMenu() {
  const startGame = useGameStore((s) => s.startGame);
  const goToSettings = useGameStore((s) => s.goToSettings);
  const goToHowTo = useGameStore((s) => s.goToHowTo);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-pop px-6">
      <div className="absolute inset-0 flex items-center justify-center opacity-20">
        <div className="grid grid-cols-5 gap-2">
          {DECO_KEYS.map((k) => (
            <div
              key={k}
              className="size-8 rounded-md bg-primary/40 shadow-plastic-sm"
            />
          ))}{" "}
        </div>
      </div>

      <div className="relative z-10 flex max-w-xl flex-col items-center text-center">
        <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-card/70 px-4 py-1.5 font-mono text-xs uppercase tracking-widest text-muted-foreground shadow-plastic-sm backdrop-blur">
          <span className="size-2 animate-pulse rounded-full bg-primary" />A
          color-restoring adventure
        </span>

        <h1
          data-ocid="menu.title"
          className="font-display text-6xl font-black leading-none text-foreground text-shadow-pop sm:text-7xl"
        >
          Pyramid
          <span className="block text-primary">Prowler</span>
        </h1>

        <p className="mt-4 font-display text-xl font-bold text-accent">
          Hop the pyramid. Paint the world back to life.
        </p>

        <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
          A mischievous color thief drained every cube of its hue. You are
          Prowler — hop diagonally across the pyramid, change every top face to
          the target color, and dodge bouncing balls, a hatching snake, and
          side-crawlers. Ride a floating disc back to the top if trouble closes
          in.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:flex-wrap sm:justify-center">
          <PillButton
            dataOcid="menu.start_button"
            onClick={() => {
              arcadeAudio.unlock();
              arcadeAudio.play("ui");
              startGame();
            }}
            className="text-xl"
          >
            <Play className="size-5 fill-current" />
            Start Hopping!
          </PillButton>
          <PillButton
            dataOcid="menu.howto_button"
            onClick={goToHowTo}
            variant="secondary"
          >
            <BookOpen className="size-5" />
            How to Play
          </PillButton>
          <PillButton
            dataOcid="menu.settings_button"
            onClick={goToSettings}
            variant="secondary"
          >
            <Settings className="size-5" />
            Settings
          </PillButton>
        </div>

        <p className="mt-8 font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Q / W / A / S or arrows — hop the four diagonals
        </p>
      </div>
    </div>
  );
}
