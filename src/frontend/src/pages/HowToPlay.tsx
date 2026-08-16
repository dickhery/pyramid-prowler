import { arcadeAudio } from "@/game/audio";
import { useGameStore } from "@/game/store";
import { ArrowLeft, Play } from "lucide-react";
import { PillButton } from "./MainMenu";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="text-left">
      <h3 className="font-display text-lg font-black text-primary">{title}</h3>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

export function HowToPlay() {
  const goToMenu = useGameStore((s) => s.goToMenu);
  const startGame = useGameStore((s) => s.startGame);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center overflow-y-auto bg-gradient-pop px-4 py-[max(1rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-10">
      <div className="w-full max-w-2xl rounded-3xl bg-card/85 p-5 shadow-plastic backdrop-blur sm:p-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="font-display text-2xl font-black text-foreground sm:text-3xl">
            How to Play
          </h2>
          <PillButton
            dataOcid="howto.back_button"
            onClick={goToMenu}
            variant="secondary"
            className="px-4 py-2 text-sm"
          >
            <ArrowLeft className="size-4" />
            Menu
          </PillButton>
        </div>

        <div className="flex max-h-[min(70vh,calc(100dvh-11rem))] flex-col gap-6 overflow-y-auto pr-1">
          <Section title="Goal">
            <p>
              You are Prowler, the orange hopper. Start at the top of the
              pyramid and hop diagonally onto every cube until every top face
              matches the target color. Clear the pyramid to advance.
            </p>
          </Section>

          <Section title="Controls">
            <p>
              The four hops are the isometric diagonals — the same idea as a
              joystick rotated 45°.
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <span className="font-mono text-foreground">Q</span> or{" "}
                <span className="font-mono text-foreground">←</span> — hop
                up-left
              </li>
              <li>
                <span className="font-mono text-foreground">W</span> or{" "}
                <span className="font-mono text-foreground">↑</span> — hop
                up-right
              </li>
              <li>
                <span className="font-mono text-foreground">A</span> or{" "}
                <span className="font-mono text-foreground">↓</span> — hop
                down-left
              </li>
              <li>
                <span className="font-mono text-foreground">S</span> or{" "}
                <span className="font-mono text-foreground">→</span> /{" "}
                <span className="font-mono text-foreground">D</span> — hop
                down-right
              </li>
              <li>
                On a phone: swipe diagonally across the board, or use the hop
                pad
              </li>
              <li>On desktop: tap a neighboring cube or use the hop pad</li>
              <li>
                <span className="font-mono text-foreground">Esc</span> — pause
              </li>
            </ul>
          </Section>

          <Section title="Color rules">
            <p>
              Early stages change a cube with one hop. Later stages need two
              hops (an intermediate color first). On flip stages, hopping a
              finished cube undoes it — plan your path.
            </p>
          </Section>

          <Section title="Hazards">
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <span className="text-foreground">Red balls</span> bounce down
                the pyramid. Touching one costs a life.
              </li>
              <li>
                <span className="text-foreground">Purple eggs</span> bounce to
                the bottom, then hatch into a chasing snake. The snake follows
                you.
              </li>
              <li>
                <span className="text-foreground">Side-crawlers</span> climb the
                faces from a bottom corner. They are deadly.
              </li>
              <li>
                Hopping off the pyramid with no disc is a fall — you lose a life
                and respawn at the apex.
              </li>
            </ul>
          </Section>

          <Section title="Friends and tools">
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <span className="text-foreground">Green gremlins</span> undo
                painted cubes but do not hurt you. Catch them for 300 points.
              </li>
              <li>
                <span className="text-foreground">Green balls</span> freeze
                every enemy for a few seconds (100 points).
              </li>
              <li>
                <span className="text-foreground">Pink discs</span> float beside
                the pyramid. Hop onto one to ride back to the top. If the snake
                is close behind, it leaps after you and falls — 500 points, and
                the board clears for a moment.
              </li>
            </ul>
          </Section>

          <Section title="Scoring">
            <p>
              25 points for a cube that reaches the target color (15 for the
              first step of a two-step cube). Unused discs add a bonus when you
              clear a stage. Stage-clear bonus starts at 1,000 and climbs by 250
              each stage, up to 5,000. An extra life is awarded at 8,000 points.
            </p>
          </Section>

          <Section title="Leaderboard">
            <p>
              After a run, sign in with Internet Identity, pick a 2–16 character
              display name, and save your personal best. The public board keeps
              the top 20. One identity, one best score — beating your old score
              replaces the row.
            </p>
          </Section>

          <Section title="Sound">
            <p>
              While you hop, a looping stage bed plays in the browser — bright
              and fast on early rounds, spookier once flip-back and finale
              stages begin. Mute music or effects separately in Settings, or tap
              Sound on the HUD. 8-bit cues mark hops, paints, extra lives, and
              close calls.
            </p>
          </Section>

          <Section title="Changing boards">
            <p>
              Each round uses a different silhouette — shorter mesas, taller
              spires, chevrons, hourglasses, tridents, and boards with gaps. The
              camera looks at the pyramid from the isometric corner so cubes sit
              on a diagonal staircase, not a straight wall, and every top face
              stays visible.
            </p>
          </Section>

          <Section title="Tips">
            <p>
              Paint toward the edges, then use a disc to escape the snake. Wait
              for red balls to bounce past before dropping a row. On flip
              stages, never recross a finished cube unless you must.
            </p>
          </Section>
        </div>

        <div className="mt-8 flex justify-center">
          <PillButton
            dataOcid="howto.start_button"
            onClick={() => {
              arcadeAudio.unlock();
              arcadeAudio.play("ui");
              startGame();
            }}
          >
            <Play className="size-5 fill-current" />
            Start Hopping!
          </PillButton>
        </div>
      </div>
    </div>
  );
}
