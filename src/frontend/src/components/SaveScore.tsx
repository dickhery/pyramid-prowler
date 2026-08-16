import {
  type Score,
  SubmitError,
  type SubmitResult,
  createActor,
} from "@/backend";
import { useActor, useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useState } from "react";

const NAME_KEY = "pyramid-prowler-display-name";

function loadName(): string {
  try {
    return window.localStorage.getItem(NAME_KEY) ?? "";
  } catch {
    return "";
  }
}

function saveName(name: string): void {
  try {
    window.localStorage.setItem(NAME_KEY, name);
  } catch {
    // ignore quota / private-mode failures
  }
}

function errorMessage(err: SubmitError): string {
  switch (err) {
    case SubmitError.anonymous:
      return "Sign in with Internet Identity to save.";
    case SubmitError.nameInvalid:
      return "Use 2–16 letters, numbers, spaces, - or _.";
    case SubmitError.notHighEnough:
      return "That score is not high enough to replace your best.";
    case SubmitError.zeroScore:
      return "Score a point first.";
    default:
      return "Could not save that score.";
  }
}

function isOk(result: SubmitResult): result is { __kind__: "ok"; ok: Score } {
  return result.__kind__ === "ok";
}

/**
 * Game-over panel: sign in with Internet Identity, pick a display name,
 * and write one personal-best row to the canister.
 */
export function SaveScore({
  points,
  stage,
}: {
  points: number;
  stage: number;
}) {
  const { login, isAuthenticated, isLoggingIn, identity } =
    useInternetIdentity();
  const { actor, isFetching } = useActor(createActor);
  const [name, setName] = useState(loadName);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const principal = identity?.getPrincipal().toText() ?? "";

  const onSubmit = async () => {
    if (!actor) {
      setStatus("Leaderboard is available after the app is deployed.");
      return;
    }
    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.length > 16) {
      setStatus("Use 2–16 letters, numbers, spaces, - or _.");
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      const result = await actor.submitScore(
        trimmed,
        BigInt(points),
        BigInt(stage),
      );
      if (isOk(result)) {
        saveName(trimmed);
        setSaved(true);
        setStatus(`Saved ${Number(result.ok.points).toLocaleString()} pts.`);
      } else {
        setStatus(errorMessage(result.err));
      }
    } catch {
      setStatus("Could not reach the leaderboard. Try again after deploy.");
    } finally {
      setBusy(false);
    }
  };

  if (points <= 0) return null;

  return (
    <div className="mt-2 w-full max-w-sm rounded-2xl bg-secondary/60 p-4 text-left">
      <p className="font-display text-sm font-bold text-foreground">
        Save to the leaderboard
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Internet Identity is required so the score is tied to you — one best
        score per identity.
      </p>

      {!isAuthenticated ? (
        <button
          type="button"
          data-ocid="score.login_button"
          disabled={isLoggingIn}
          onClick={() => login()}
          className="mt-3 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2 font-display text-sm font-extrabold text-primary-foreground shadow-plastic-sm disabled:opacity-50"
        >
          {isLoggingIn ? "Opening Identity…" : "Sign in to save"}
        </button>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Display name
            <input
              type="text"
              maxLength={16}
              value={name}
              data-ocid="score.name_input"
              disabled={saved || busy}
              onChange={(event) => setName(event.target.value)}
              placeholder="Prowler"
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 font-display text-sm font-bold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
          <p className="truncate font-mono text-[10px] text-muted-foreground">
            {principal.slice(0, 8)}…{principal.slice(-5)}
          </p>
          <button
            type="button"
            data-ocid="score.submit_button"
            disabled={saved || busy || isFetching || !actor}
            onClick={() => void onSubmit()}
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2 font-display text-sm font-extrabold text-primary-foreground shadow-plastic-sm disabled:opacity-50"
          >
            {saved ? "Saved" : busy ? "Saving…" : "Save high score"}
          </button>
        </div>
      )}
      {status && (
        <p
          className="mt-2 text-xs text-muted-foreground"
          data-ocid="score.status"
        >
          {status}
        </p>
      )}
    </div>
  );
}
