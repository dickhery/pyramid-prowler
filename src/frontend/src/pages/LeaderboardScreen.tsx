import { type Score, createActor } from "@/backend";
import { useGameStore } from "@/game/store";
import { useActor, useInternetIdentity } from "@caffeineai/core-infrastructure";
import { ArrowLeft, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { PillButton } from "./MainMenu";

function formatPoints(value: bigint): string {
  return Number(value).toLocaleString();
}

function shortPrincipal(owner: Score["owner"]): string {
  const text = owner.toText();
  if (text.length <= 16) return text;
  return `${text.slice(0, 6)}…${text.slice(-5)}`;
}

export function LeaderboardScreen() {
  const goToMenu = useGameStore((s) => s.goToMenu);
  const { actor, isFetching } = useActor(createActor);
  const { identity, login, clear, isAuthenticated, isLoggingIn } =
    useInternetIdentity();
  const [rows, setRows] = useState<Score[]>([]);
  const [mine, setMine] = useState<Score | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!actor || isFetching) return;
    let cancelled = false;
    const load = async () => {
      try {
        const board = await actor.getLeaderboard();
        const own = isAuthenticated ? await actor.getMyScore() : null;
        if (cancelled) return;
        setRows(board);
        setMine(own);
        setError(null);
      } catch {
        if (!cancelled) {
          setError("Leaderboard is available after this app is deployed.");
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [actor, isFetching, isAuthenticated]);

  const myText = identity?.getPrincipal().toText() ?? "";

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center overflow-y-auto bg-gradient-pop px-4 py-[max(1rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-10">
      <div className="w-full max-w-xl rounded-3xl bg-card/85 p-5 shadow-plastic backdrop-blur sm:p-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="flex items-center gap-2 font-display text-3xl font-black text-foreground">
            <Trophy className="size-7 text-accent" />
            Leaderboard
          </h2>
          <PillButton
            dataOcid="board.back_button"
            onClick={goToMenu}
            variant="secondary"
            className="px-4 py-2 text-sm"
          >
            <ArrowLeft className="size-4" />
            Menu
          </PillButton>
        </div>

        <p className="mb-4 text-sm text-muted-foreground">
          Top 20 personal bests. Saving a score requires Internet Identity so
          each hopper has one row.
        </p>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          {isAuthenticated ? (
            <>
              <span className="font-mono text-[10px] text-muted-foreground">
                Signed in {myText.slice(0, 8)}…{myText.slice(-5)}
              </span>
              <button
                type="button"
                data-ocid="board.logout_button"
                onClick={() => clear()}
                className="rounded-full bg-secondary px-3 py-1 font-display text-xs font-bold text-secondary-foreground"
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              type="button"
              data-ocid="board.login_button"
              disabled={isLoggingIn}
              onClick={() => login()}
              className="rounded-full bg-primary px-4 py-1.5 font-display text-xs font-extrabold text-primary-foreground disabled:opacity-50"
            >
              {isLoggingIn ? "Opening Identity…" : "Sign in"}
            </button>
          )}
        </div>

        {mine && (
          <p className="mb-4 rounded-2xl bg-secondary/70 px-4 py-2 font-display text-sm font-bold text-foreground">
            Your best: {formatPoints(mine.points)} pts as {mine.displayName}{" "}
            (stage {Number(mine.stage)})
          </p>
        )}

        {error && <p className="text-sm text-muted-foreground">{error}</p>}

        {!error && rows.length === 0 && !isFetching && (
          <p className="text-sm text-muted-foreground">
            No scores yet. Finish a run and save your name.
          </p>
        )}

        {rows.length > 0 && (
          <ol className="divide-y divide-border">
            {rows.map((row, index) => (
              <li
                key={`${row.owner.toText()}-${row.recordedAt.toString()}`}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-display text-base font-bold text-foreground">
                    <span className="mr-2 font-mono text-xs text-muted-foreground">
                      {index + 1}.
                    </span>
                    {row.displayName}
                  </p>
                  <p className="truncate font-mono text-[10px] text-muted-foreground">
                    {shortPrincipal(row.owner)} · stage {Number(row.stage)}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-sm font-bold text-primary">
                  {formatPoints(row.points)}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
