/**
 * Scoring and combo logic for Pyramid Prowler.
 *
 * Points are awarded for color changes, gems, enemy lures, and level
 * completion. A combo multiplier builds as the player chains hops and lures
 * enemies, then decays when the player is idle.
 */
import type { CubeColor } from "./types";

/** Base points for painting a single cube. */
export const PAINT_POINTS = 25;

/** Base points for a gem, scaled by its value. */
export const GEM_BASE = 100;

/** Points for luring an enemy onto a disc. */
export const LURE_POINTS = 200;

/** Points for clearing a level. */
export const LEVEL_CLEAR_POINTS = 1000;

/** Points for collecting a power-up. */
export const POWERUP_POINTS = 150;

/** Seconds of idle time before the combo multiplier resets. */
export const COMBO_WINDOW = 3;

/** The maximum combo multiplier that can be reached. */
export const MAX_COMBO = 8;

/** Compute the score for painting a cube under the current combo. */
export function paintScore(combo: number): number {
  return PAINT_POINTS * comboMultiplier(combo);
}

/** Compute the score for collecting a gem under the current combo. */
export function gemScore(value: number, combo: number): number {
  return value * comboMultiplier(combo);
}

/** Compute the score for luring an enemy under the current combo. */
export function lureScore(combo: number): number {
  return LURE_POINTS * comboMultiplier(combo);
}

/** The multiplier applied for a given combo count. */
export function comboMultiplier(combo: number): number {
  return Math.min(combo, MAX_COMBO);
}

/** Advance the combo after a successful action. */
export function bumpCombo(combo: number): number {
  return Math.min(combo + 1, MAX_COMBO);
}

/** Decay the combo back toward zero over time. */
export function decayCombo(
  combo: number,
  deltaTime: number,
  comboTimer: number,
): number {
  if (combo <= 0) return 0;
  const next = comboTimer - deltaTime;
  if (next <= 0) return 0;
  return combo;
}

/** A short human-readable label for a cube color (used in HUD copy). */
export function colorLabel(color: CubeColor): string {
  switch (color) {
    case "target":
      return "Teal";
    case "safe":
      return "Green";
    case "deadly":
      return "Magenta";
    case "ice":
      return "Ice";
    case "sticky":
      return "Sticky";
    case "booster":
      return "Booster";
    case "teleporter":
      return "Teleporter";
    default:
      return "Washed";
  }
}
