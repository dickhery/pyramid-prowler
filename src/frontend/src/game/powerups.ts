/**
 * Power-up logic for Pyramid Prowler.
 *
 * Power-ups spawn on cubes and are collected by landing on them. Each applies a
 * timed effect tracked in the store's `effectTimers` record. Effects expire
 * when their timer reaches zero.
 */
import type { ActivePowerUps, EffectKey, PowerUpKind } from "./types";

/** How long each timed effect lasts, in seconds. */
export const EFFECT_DURATION: Record<EffectKey, number> = {
  shield: 8,
  slowEnemies: 6,
  invincibility: 6,
  speedBoost: 8,
  colorRadius: 6,
  freezeRay: 5,
  doubleJump: 8,
  magnetDisc: 6,
};

/** Map a collectible power-up kind to the effect key it activates. */
export function effectForKind(kind: PowerUpKind): EffectKey | null {
  switch (kind) {
    case "shield":
      return "shield";
    case "slowEnemies":
      return "slowEnemies";
    case "invincibility":
      return "invincibility";
    case "speedBoost":
      return "speedBoost";
    case "colorRadius":
      return "colorRadius";
    case "freezeRay":
      return "freezeRay";
    case "doubleJump":
      return "doubleJump";
    case "magnetDisc":
      return "magnetDisc";
    case "extraLife":
    case "paintAll":
      return null; // instant effects, not timed
  }
}

/** Build a fresh (all-off) active power-up record. */
export function emptyActivePowerUps(): ActivePowerUps {
  return {
    shield: false,
    slowEnemies: false,
    invincibility: false,
    speedBoost: false,
    colorRadius: false,
    freezeRay: false,
    doubleJump: false,
    magnetDisc: false,
  };
}

/** Build a fresh effect-timer record (all zero). */
export function emptyEffectTimers(): Record<EffectKey, number> {
  return {
    shield: 0,
    slowEnemies: 0,
    invincibility: 0,
    speedBoost: 0,
    colorRadius: 0,
    freezeRay: 0,
    doubleJump: 0,
    magnetDisc: 0,
  };
}

/** Activate a timed effect, refreshing its timer. */
export function activateEffect(
  active: ActivePowerUps,
  timers: Record<EffectKey, number>,
  key: EffectKey,
): { active: ActivePowerUps; timers: Record<EffectKey, number> } {
  return {
    active: { ...active, [key]: true },
    timers: { ...timers, [key]: EFFECT_DURATION[key] },
  };
}

/** Tick all effect timers down and turn off any that have expired. */
export function tickEffects(
  active: ActivePowerUps,
  timers: Record<EffectKey, number>,
  deltaTime: number,
): { active: ActivePowerUps; timers: Record<EffectKey, number> } {
  const nextTimers = { ...timers };
  const nextActive = { ...active };
  for (const key of Object.keys(nextTimers) as EffectKey[]) {
    if (nextTimers[key] > 0) {
      nextTimers[key] = Math.max(0, nextTimers[key] - deltaTime);
      if (nextTimers[key] === 0) {
        nextActive[key] = false;
      }
    }
  }
  return { active: nextActive, timers: nextTimers };
}

/** Whether the player is currently invincible (shield or invincibility). */
export function isInvincible(active: ActivePowerUps): boolean {
  return active.shield || active.invincibility;
}
