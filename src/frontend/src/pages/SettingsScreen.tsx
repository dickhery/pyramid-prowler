import { useGameStore } from "@/game/store";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { PillButton } from "./MainMenu";

/** A labeled toggle switch used in the settings screen. */
function ToggleRow({
  label,
  hint,
  checked,
  onChange,
  dataOcid,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  dataOcid: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <span className="block font-display text-base font-bold text-foreground">
          {label}
        </span>
        {hint && (
          <span className="block text-sm text-muted-foreground">{hint}</span>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        data-ocid={dataOcid}
        onClick={() => onChange(!checked)}
        className={`relative h-8 w-14 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
          checked ? "bg-primary" : "bg-muted"
        }`}
      >
        <span
          className={`absolute top-1 size-6 rounded-full bg-foreground shadow transition-all ${
            checked ? "left-7" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

/** The settings screen: lightweight options wired to the store. */
export function SettingsScreen() {
  const goToMenu = useGameStore((s) => s.goToMenu);
  const cameraMode = useGameStore((s) => s.cameraMode);
  const setCameraMode = useGameStore((s) => s.setCameraMode);
  const setPowerUp = useGameStore((s) => s.setPowerUp);
  const slowEnemies = useGameStore((s) => s.powerUps.slowEnemies);

  // Local-only preferences (not persisted in the store contract).
  const [difficulty, setDifficulty] = useState<"Easy" | "Normal" | "Hard">(
    "Normal",
  );
  const [sensitivity, setSensitivity] = useState(50);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-pop px-6">
      <div className="w-full max-w-md rounded-3xl bg-card/80 p-8 shadow-plastic backdrop-blur">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-3xl font-black text-foreground">
            Settings
          </h2>
          <PillButton
            dataOcid="settings.back_button"
            onClick={goToMenu}
            variant="secondary"
            className="px-4 py-2 text-sm"
          >
            <ArrowLeft className="size-4" />
            Back
          </PillButton>
        </div>

        <div className="divide-y divide-border">
          <ToggleRow
            label="Orbit camera"
            hint="Free-orbit view instead of isometric"
            checked={cameraMode === "orbit"}
            onChange={(value) => setCameraMode(value ? "orbit" : "isometric")}
            dataOcid="settings.camera_toggle"
          />
          <ToggleRow
            label="Color-blind mode"
            hint="Adds patterns to distinguish cube colors"
            checked={slowEnemies}
            onChange={(value) => setPowerUp("slowEnemies", value)}
            dataOcid="settings.colorblind_toggle"
          />
        </div>

        <div className="mt-6">
          <span className="font-display text-sm font-bold text-muted-foreground">
            Difficulty
          </span>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {(["Easy", "Normal", "Hard"] as const).map((option) => (
              <button
                key={option}
                type="button"
                data-ocid={`settings.difficulty.${option.toLowerCase()}`}
                onClick={() => setDifficulty(option)}
                className={`rounded-full px-4 py-2 font-display text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  difficulty === option
                    ? "bg-primary text-primary-foreground shadow-plastic-sm"
                    : "bg-secondary text-secondary-foreground hover:brightness-110"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between">
            <span className="font-display text-sm font-bold text-muted-foreground">
              Camera sensitivity
            </span>
            <span className="font-mono text-sm font-bold text-foreground">
              {sensitivity}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={sensitivity}
            data-ocid="settings.sensitivity"
            aria-label="Camera sensitivity"
            onChange={(e) => setSensitivity(Number(e.target.value))}
            className="mt-3 w-full accent-primary"
          />
        </div>
      </div>
    </div>
  );
}
