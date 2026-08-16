/**
 * Scoring for Pyramid Prowler — values follow the 1982 arcade pyramid-hopper:
 * 25 per color change (15 on the first step of a two-step cube), 500 for
 * luring the snake off a disc, 100 for a green ball, 300 for catching a
 * green gremlin, unused-disc bonus, and a rising stage-clear bonus.
 */
import type { CubeColor } from "./types";

/** Points for changing a cube to the target color. */
export const PAINT_POINTS = 25;

/** Points for the intermediate step of a two-hop cube. */
export const MID_PAINT_POINTS = 15;

/** Points for luring the chasing snake off a disc. */
export const LURE_POINTS = 500;

/** Points for catching a green ball (freezes enemies). */
export const GREEN_BALL_POINTS = 100;

/** Points for catching a green gremlin that undoes colors. */
export const CATCH_UNDO_POINTS = 300;

/** Points per unused disc at stage clear. */
export const UNUSED_DISC_POINTS = 50;

/** Stage-clear bonus starts here and climbs by STEP each stage. */
export const LEVEL_CLEAR_BASE = 1000;
export const LEVEL_CLEAR_STEP = 250;
export const LEVEL_CLEAR_MAX = 5000;

/** Extra life at this score (once per run). */
export const EXTRA_LIFE_SCORE = 8000;

/** Kept for older power-up / gem paths. */
export const GEM_BASE = 100;
export const POWERUP_POINTS = 150;
export const LEVEL_CLEAR_POINTS = 1000;

export const COMBO_WINDOW = 3;
export const MAX_COMBO = 8;

export function paintScore(combo: number): number {
  return PAINT_POINTS * Math.max(1, comboMultiplier(combo));
}

export function midPaintScore(): number {
  return MID_PAINT_POINTS;
}

export function gemScore(value: number, combo: number): number {
  return value * Math.max(1, comboMultiplier(combo));
}

export function lureScore(_combo: number): number {
  return LURE_POINTS;
}

export function comboMultiplier(combo: number): number {
  return Math.min(Math.max(combo, 1), MAX_COMBO);
}

export function bumpCombo(combo: number): number {
  return Math.min(combo + 1, MAX_COMBO);
}

export function levelClearBonus(levelNumber: number): number {
  return Math.min(
    LEVEL_CLEAR_MAX,
    LEVEL_CLEAR_BASE + Math.max(0, levelNumber - 1) * LEVEL_CLEAR_STEP,
  );
}

export function unusedDiscBonus(unused: number, levelNumber: number): number {
  const per = levelNumber >= 5 ? 100 : UNUSED_DISC_POINTS;
  return unused * per;
}

export function colorLabel(color: CubeColor): string {
  switch (color) {
    case "target":
      return "Target";
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
      return "Start";
  }
}
