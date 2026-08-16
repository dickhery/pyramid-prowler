import {
  apex,
  buildBoard,
  getCube,
  isBoardPainted,
  keyOf,
  neighbor,
} from "./board";
import {
  ENEMY_TICK,
  applyEnemyEffect,
  collidesWithPlayer,
  isDeadly,
  setCube,
  stepEnemy,
  teleportDestination,
} from "./enemies";
import { getLevel } from "./levels";
import {
  activateEffect,
  effectForKind,
  emptyActivePowerUps,
  emptyEffectTimers,
  isInvincible,
  tickEffects,
} from "./powerups";
import {
  LEVEL_CLEAR_POINTS,
  POWERUP_POINTS,
  bumpCombo,
  gemScore,
  paintScore,
} from "./scoring";
import type { GameState } from "./store";
/**
 * The game loop for Pyramid Prowler.
 *
 * Pure TypeScript operating on the zustand store. `startLevel` builds a fresh
 * level, `hop` initiates diagonal movement, and `update` advances animations,
 * enemies, effects, color decay, and win/lose detection. No three.js here —
 * the rendering layer reads the resulting state from the store.
 */
import type {
  Board,
  Cube,
  CubeColor,
  CubePosition,
  Enemy,
  Gem,
  HopDirection,
  Particle,
  PlayerState,
  PowerUp,
} from "./types";

/** Hops per second for the hop animation. */
const HOP_SPEED = 8;
/** Fall animation speed (0..1 progress per second). */
const FALL_SPEED = 2;
/** Seconds to ride a floating disc back to the top. */
const RIDE_TIME = 1.2;
/** Seconds the player is stuck on a sticky cube. */
const STICK_TIME = 1.0;
/** Seconds a painted cube stays painted under timedDecay. */
const DECAY_TIME = 6;
/** Seconds per color cycle on a multi cube. */
const MULTI_CYCLE = 1.5;
/** Seconds of shake after a fall or hit. */
const SHAKE_DURATION = 0.5;
/** Seconds of idle before the combo resets. */
const COMBO_WINDOW = 3;
/** The colors a multi cube cycles through. */
const MULTI_COLORS: CubeColor[] = ["target", "safe", "deadly", "ice"];

/** Build a fresh player state standing on a given cube. */
function emptyPlayer(position: CubePosition): PlayerState {
  return {
    position,
    hopping: false,
    hopDirection: null,
    hopsRemaining: 0,
    hopProgress: 0,
    hopFrom: position,
    hopTo: position,
    ridingDisc: false,
    rideTimer: 0,
    falling: false,
    fallProgress: 0,
    stuck: false,
    stuckTimer: 0,
  };
}

/** Deep-clone enemies so level definitions are never mutated. */
function cloneEnemies(enemies: Enemy[]): Enemy[] {
  return enemies.map((e) => ({ ...e, position: { ...e.position } }));
}

/** Add points to the score. */
function addScore(state: GameState, points: number): GameState {
  return { ...state, score: state.score + points };
}

/** Bump the combo and refresh its decay window. */
function bumpComboState(state: GameState): GameState {
  return { ...state, combo: bumpCombo(state.combo), comboTimer: COMBO_WINDOW };
}

/** Queue a transient particle for the rendering layer. */
function addParticle(
  state: GameState,
  position: CubePosition,
  kind: Particle["kind"],
  color: string,
): GameState {
  const particle: Particle = {
    id: `p${state.particles.length}-${Math.random().toString(36).slice(2, 7)}`,
    position,
    kind,
    color,
    life: 0.6,
    maxLife: 0.6,
  };
  return { ...state, particles: [...state.particles, particle] };
}

/** Apply the level's color rule to a cube the player just landed on. */
function applyColorRule(
  board: Board,
  cube: Cube,
  rule: GameState["level"]["colorRule"],
): Board {
  if (cube.painted) {
    // flipBack: re-stepping a painted cube unpaints it.
    if (rule === "flipBack") {
      return setCube(board, cube, {
        ...cube,
        painted: false,
        color: "washed",
        paintProgress: 1,
      });
    }
    return board;
  }
  switch (rule) {
    case "oneHop":
      return setCube(board, cube, {
        ...cube,
        painted: true,
        color: "target",
        paintProgress: 0,
      });
    case "twoHop": {
      const next = cube.paintProgress - 1;
      if (next <= 0) {
        return setCube(board, cube, {
          ...cube,
          painted: true,
          color: "target",
          paintProgress: 0,
        });
      }
      return setCube(board, cube, { ...cube, paintProgress: next });
    }
    case "flipBack":
      return setCube(board, cube, {
        ...cube,
        painted: true,
        color: "target",
        paintProgress: 0,
      });
    case "timedDecay":
      return setCube(board, cube, {
        ...cube,
        painted: true,
        color: "target",
        paintProgress: 0,
        decayTimer: DECAY_TIME,
      });
  }
}

/** Paint every cube on the board (paintAll power-up). */
function paintAll(board: Board, target: CubeColor): Board {
  const cubes: Record<string, Cube> = {};
  for (const k of Object.keys(board.cubes)) {
    cubes[k] = {
      ...board.cubes[k],
      painted: true,
      color: target,
      paintProgress: 0,
    };
  }
  return { ...board, cubes };
}

/** Lose a life, shake the screen, and detect game over. */
function damage(state: GameState): GameState {
  const lives = state.lives - 1;
  let s: GameState = {
    ...state,
    lives,
    shake: SHAKE_DURATION,
    message: "Ouch!",
  };
  if (lives <= 0) {
    s = { ...s, phase: "gameover", message: "Game Over" };
  }
  return s;
}

/** Start a fall off the edge: lose a life and animate the drop. */
function startFall(state: GameState): GameState {
  let s = damage(state);
  if (s.phase === "gameover") return s;
  return {
    ...s,
    player: {
      ...s.player,
      falling: true,
      fallProgress: 0,
      hopping: false,
      stuck: false,
    },
  };
}

/** Collect a power-up at the player's position. */
function collectPowerUp(state: GameState, pu: PowerUp): GameState {
  let s = addScore(state, POWERUP_POINTS);
  s = addParticle(s, pu.position, "gem", "#ffd54a");
  const key = effectForKind(pu.kind);
  if (key) {
    const { active, timers } = activateEffect(s.powerUps, s.effectTimers, key);
    s = { ...s, powerUps: active, effectTimers: timers };
  } else if (pu.kind === "extraLife") {
    s = { ...s, lives: s.lives + 1, message: "+1 Life!" };
  } else if (pu.kind === "paintAll") {
    s = {
      ...s,
      board: paintAll(s.board, s.level.targetColor),
      message: "All painted!",
    };
  }
  return { ...s, powerUpItems: s.powerUpItems.filter((p) => p.id !== pu.id) };
}

/** Collect a gem at the player's position. */
function collectGem(state: GameState, gem: Gem): GameState {
  let s = addScore(state, gemScore(gem.value, state.combo));
  s = bumpComboState(s);
  s = addParticle(s, gem.position, "gem", "#ffd54a");
  return {
    ...s,
    gems: s.gems.map((g) => (g.id === gem.id ? { ...g, collected: true } : g)),
  };
}

/** Start riding a floating disc back to the top. */
function startRide(state: GameState, discIndex: number): GameState {
  const disc = state.discSpots[discIndex];
  const discs = Math.max(0, state.discs - 1);
  let s: GameState = {
    ...state,
    discs,
    discSpots: state.discSpots.map((d, i) =>
      i === discIndex ? { ...d, active: true } : d,
    ),
  };
  s = {
    ...s,
    player: {
      ...s.player,
      ridingDisc: true,
      rideTimer: RIDE_TIME,
      hopping: false,
    },
  };
  s = addParticle(s, disc.position, "enemyLure", "#30d5c8");
  return s;
}

/** Check for a deadly enemy collision and apply its consequence. */
function checkCollision(state: GameState): GameState {
  const deadly = state.enemies.find(
    (e) => collidesWithPlayer(e, state.player) && isDeadly(e),
  );
  if (!deadly) return state;
  if (isInvincible(state.powerUps)) {
    return {
      ...state,
      enemies: state.enemies.filter((e) => e.id !== deadly.id),
      message: "Invincible!",
    };
  }
  return startFall(state);
}

/** Apply every landing effect for the cube the player reached. */
function applyLanding(state: GameState): GameState {
  const pos = state.player.hopTo;
  const cube = getCube(state.board, pos);
  if (!cube) return state;

  let s = state;
  let nextPlayer: PlayerState = {
    ...state.player,
    hopping: false,
    position: pos,
    hopProgress: 0,
    hopsRemaining: 0,
  };

  // 1. Color rule
  const nextBoard = applyColorRule(state.board, cube, state.level.colorRule);
  const landed = getCube(nextBoard, pos);
  const paintedNow = landed ? landed.painted && !cube.painted : false;
  if (paintedNow) {
    s = addScore(s, paintScore(s.combo));
    s = bumpComboState(s);
    s = addParticle(s, pos, "colorChange", "#30d5c8");
  }

  // 2. Special block
  if (landed) {
    switch (landed.special) {
      case "ice":
      case "booster":
        nextPlayer = {
          ...nextPlayer,
          hopsRemaining: nextPlayer.hopsRemaining + 1,
        };
        break;
      case "sticky":
        nextPlayer = { ...nextPlayer, stuck: true, stuckTimer: STICK_TIME };
        break;
      case "teleporter": {
        const dest = teleportDestination(nextBoard, pos);
        nextPlayer = { ...nextPlayer, position: dest, hopTo: dest };
        s = addParticle(s, dest, "colorChange", "#a05ce0");
        break;
      }
      default:
        break;
    }
  }

  s = { ...s, board: nextBoard, player: nextPlayer };

  // 3. Power-up
  const puIndex = s.powerUpItems.findIndex(
    (pu) => keyOf(pu.position) === keyOf(pos),
  );
  if (puIndex >= 0) s = collectPowerUp(s, s.powerUpItems[puIndex]);

  // 4. Gem
  const gemIndex = s.gems.findIndex(
    (g) => !g.collected && keyOf(g.position) === keyOf(pos),
  );
  if (gemIndex >= 0) s = collectGem(s, s.gems[gemIndex]);

  // 5. Disc ride
  const discIndex = s.discSpots.findIndex(
    (d) => keyOf(d.position) === keyOf(pos),
  );
  if (discIndex >= 0 && s.discs > 0 && !s.player.ridingDisc) {
    s = startRide(s, discIndex);
  }

  // 6. Enemy collision
  s = checkCollision(s);

  return s;
}

/** Finish a hop: land, then chain any extra hops (ice/booster). */
function completeHop(state: GameState): GameState {
  let s = applyLanding(state);
  if (
    s.player.hopsRemaining > 0 &&
    !s.player.falling &&
    !s.player.ridingDisc &&
    !s.player.stuck &&
    s.phase === "playing"
  ) {
    const dir = s.player.hopDirection;
    if (!dir) return s;
    const target = neighbor(s.board, s.player.position, dir);
    if (target) {
      s = {
        ...s,
        player: {
          ...s.player,
          hopping: true,
          hopFrom: s.player.position,
          hopTo: target,
          hopProgress: 0,
          hopsRemaining: s.player.hopsRemaining - 1,
        },
      };
    } else {
      s = startFall(s);
    }
  }
  return s;
}

/** Advance enemy movement, hatching, and effects. */
function updateEnemies(state: GameState, deltaTime: number): GameState {
  let s = state;
  let enemies = s.enemies.map((e) =>
    e.frozenTimer > 0
      ? { ...e, frozenTimer: Math.max(0, e.frozenTimer - deltaTime) }
      : e,
  );
  enemies = enemies.map((e) => ({ ...e, moveTimer: e.moveTimer + deltaTime }));
  const tick = ENEMY_TICK * (s.powerUps.slowEnemies ? 1.5 : 1);
  let board = s.board;
  let moved = false;
  enemies = enemies.map((e) => {
    if (e.frozenTimer > 0 || e.falling || e.moveTimer < tick) return e;
    moved = true;
    let next = stepEnemy(e, board, s.player);
    if (next.kind === "eggSnake" && !next.hatched && next.hatchTimer <= 0) {
      next = { ...next, hatched: true };
    }
    board = applyEnemyEffect(next, board);
    return { ...next, moveTimer: 0 };
  });
  s = { ...s, enemies, board };
  if (moved) s = checkCollision(s);
  return s;
}

/** Fade painted cubes back to washed under the timedDecay rule. */
function decayBoard(board: Board, deltaTime: number): Board {
  const cubes: Record<string, Cube> = { ...board.cubes };
  let changed = false;
  for (const k of Object.keys(cubes)) {
    const c = cubes[k];
    if (c.painted && c.decayTimer > 0) {
      const dt = c.decayTimer - deltaTime;
      if (dt <= 0) {
        cubes[k] = { ...c, painted: false, color: "washed", decayTimer: 0 };
        changed = true;
      } else {
        cubes[k] = { ...c, decayTimer: dt };
      }
    }
  }
  return changed ? { ...board, cubes } : board;
}

/** Cycle the color of multi special cubes over time. */
function cycleMulti(board: Board, deltaTime: number): Board {
  const cubes: Record<string, Cube> = { ...board.cubes };
  let changed = false;
  for (const k of Object.keys(cubes)) {
    const c = cubes[k];
    if (c.special === "multi") {
      const next = c.cycleIndex + deltaTime / MULTI_CYCLE;
      cubes[k] = {
        ...c,
        cycleIndex: next,
        color: MULTI_COLORS[Math.floor(next) % MULTI_COLORS.length],
      };
      changed = true;
    }
  }
  return changed ? { ...board, cubes } : board;
}

/**
 * Build a fresh level: board, player at the apex, and all spawns from the
 * level definition. Returns a partial state the store merges in.
 */
export function startLevel(levelNumber: number): Partial<GameState> {
  const level = getLevel(levelNumber);
  let board = buildBoard(level);
  if (level.colorRule === "twoHop") {
    const cubes: Record<string, Cube> = {};
    for (const k of Object.keys(board.cubes)) {
      cubes[k] = { ...board.cubes[k], paintProgress: 2 };
    }
    board = { ...board, cubes };
  }
  const apexPos = apex(board).position;
  return {
    phase: "playing",
    level,
    levelNumber,
    board,
    player: emptyPlayer(apexPos),
    enemies: cloneEnemies(level.enemies),
    powerUpItems: level.powerUps.map((p) => ({ ...p })),
    gems: level.gems.map((g) => ({ ...g })),
    discSpots: level.discSpots.map((d) => ({ ...d })),
    particles: [],
    effectTimers: emptyEffectTimers(),
    shake: 0,
    message: null,
    lives: level.lives,
    discs: level.discs,
    targetColor: level.targetColor,
    combo: 0,
    comboTimer: 0,
    powerUps: emptyActivePowerUps(),
  };
}

/** Initiate a diagonal hop in the given direction. */
export function hop(state: GameState, direction: HopDirection): GameState {
  if (state.phase !== "playing") return state;
  const p = state.player;
  if (p.hopping || p.falling || p.ridingDisc || p.stuck) return state;

  const target = neighbor(state.board, p.position, direction);
  if (!target) return startFall(state);

  return {
    ...state,
    player: {
      ...p,
      hopping: true,
      hopDirection: direction,
      hopFrom: p.position,
      hopTo: target,
      hopProgress: 0,
      hopsRemaining: 1,
    },
  };
}

/** Advance the game by a frame of `deltaTime` seconds. */
export function update(state: GameState, deltaTime: number): GameState {
  if (state.phase !== "playing") return state;
  let s = state;

  // Hop animation
  if (s.player.hopping) {
    const hp = s.player.hopProgress + deltaTime * HOP_SPEED;
    if (hp >= 1) {
      s = completeHop(s);
    } else {
      s = { ...s, player: { ...s.player, hopProgress: hp } };
    }
  }

  // Fall animation
  if (s.player.falling) {
    const fp = s.player.fallProgress + deltaTime * FALL_SPEED;
    if (fp >= 1) {
      s = {
        ...s,
        player: {
          ...s.player,
          falling: false,
          fallProgress: 0,
          position: apex(s.board).position,
        },
      };
    } else {
      s = { ...s, player: { ...s.player, fallProgress: fp } };
    }
  }

  // Stuck
  if (s.player.stuck) {
    const st = s.player.stuckTimer - deltaTime;
    s = {
      ...s,
      player: { ...s.player, stuck: st > 0, stuckTimer: Math.max(0, st) },
    };
  }

  // Disc ride
  if (s.player.ridingDisc) {
    const rt = s.player.rideTimer - deltaTime;
    if (rt <= 0) {
      s = {
        ...s,
        player: {
          ...s.player,
          ridingDisc: false,
          rideTimer: 0,
          position: apex(s.board).position,
        },
        discSpots: s.discSpots.map((d) => ({ ...d, active: false })),
      };
    } else {
      s = { ...s, player: { ...s.player, rideTimer: rt } };
    }
  }

  // Enemies
  s = updateEnemies(s, deltaTime);

  // Effect timers
  const { active, timers } = tickEffects(s.powerUps, s.effectTimers, deltaTime);
  s = { ...s, powerUps: active, effectTimers: timers };

  // Color decay
  if (s.level.colorRule === "timedDecay") {
    s = { ...s, board: decayBoard(s.board, deltaTime) };
  }

  // Multi cycling
  s = { ...s, board: cycleMulti(s.board, deltaTime) };

  // Combo decay
  if (s.combo > 0) {
    const ct = s.comboTimer - deltaTime;
    if (ct <= 0) {
      s = { ...s, combo: 0, comboTimer: 0 };
    } else {
      s = { ...s, comboTimer: ct };
    }
  }

  // Particles
  s = {
    ...s,
    particles: s.particles
      .map((p) => ({ ...p, life: p.life - deltaTime }))
      .filter((p) => p.life > 0),
  };

  // Shake decay
  if (s.shake > 0) {
    s = { ...s, shake: Math.max(0, s.shake - deltaTime) };
  }

  // Level clear
  if (s.phase === "playing" && isBoardPainted(s.board)) {
    s = {
      ...s,
      phase: "levelclear",
      score: s.score + LEVEL_CLEAR_POINTS,
      message: "Level Clear!",
    };
  }

  return s;
}
