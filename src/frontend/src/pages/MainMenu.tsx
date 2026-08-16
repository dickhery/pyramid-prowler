import { arcadeAudio } from "@/game/audio";
import { useGameStore } from "@/game/store";
import { BookOpen, Play, Settings, Trophy } from "lucide-react";

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
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-8 py-3 font-display text-lg font-extrabold transition-transform duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-0.5";
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
  const goToLeaderboard = useGameStore((s) => s.goToLeaderboard);

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-y-auto overflow-x-hidden bg-gradient-pop px-4 py-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <img
          src="/assets/images/hero.webp"
          alt=""
          className="absolute inset-x-0 top-0 h-[52%] w-full object-cover object-top opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/70 to-background" />
        <div className="absolute inset-0 flex items-center justify-center opacity-15">
          <div className="grid grid-cols-5 gap-2">
            {DECO_KEYS.map((k) => (
              <div
                key={k}
                className="size-8 rounded-md bg-primary/40 shadow-plastic-sm"
              />
            ))}
          </div>
        </div>
      </div>

      <div className="relative z-10 flex max-w-xl flex-col items-center text-center">
        <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-card/70 px-4 py-1.5 font-mono text-xs uppercase tracking-widest text-muted-foreground shadow-plastic-sm backdrop-blur">
          <span className="size-2 animate-pulse rounded-full bg-primary" />A
          color-restoring adventure
        </span>

        <h1
          data-ocid="menu.title"
          className="font-display text-5xl font-black leading-none text-foreground text-shadow-pop sm:text-7xl"
        >
          Pyramid
          <span className="block text-primary">Prowler</span>
        </h1>

        <p className="mt-4 font-display text-xl font-bold text-accent">
          Hop the pyramid. Paint the world back to life.
        </p>

        <p className="mt-4 hidden max-w-md text-base leading-relaxed text-muted-foreground sm:mt-6 sm:block">
          A mischievous color thief drained every cube of its hue. You are
          Prowler — hop diagonally across the pyramid, change every top face to
          the target color, and dodge bouncing balls, a hatching snake, and
          side-crawlers. Ride a floating disc back to the top if trouble closes
          in.
        </p>

        <div className="mt-8 flex w-full max-w-sm flex-col items-stretch gap-3 sm:mt-10 sm:max-w-none sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-4">
          <PillButton
            dataOcid="menu.start_button"
            onClick={() => {
              arcadeAudio.unlock();
              arcadeAudio.play("ui");
              startGame();
            }}
            className="w-full text-xl sm:w-auto"
          >
            <Play className="size-5 fill-current" />
            Start Hopping!
          </PillButton>
          <PillButton
            dataOcid="menu.howto_button"
            onClick={goToHowTo}
            variant="secondary"
            className="w-full sm:w-auto"
          >
            <BookOpen className="size-5" />
            How to Play
          </PillButton>
          <PillButton
            dataOcid="menu.leaderboard_button"
            onClick={goToLeaderboard}
            variant="secondary"
            className="w-full sm:w-auto"
          >
            <Trophy className="size-5" />
            Leaderboard
          </PillButton>
          <PillButton
            dataOcid="menu.settings_button"
            onClick={goToSettings}
            variant="secondary"
            className="w-full sm:w-auto"
          >
            <Settings className="size-5" />
            Settings
          </PillButton>
        </div>

        <p className="mt-8 font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Swipe or hop pad on phones · QWAS / arrows on desktop
        </p>
      </div>
    </div>
  );
}
