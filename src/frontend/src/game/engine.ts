import {
  apex,
  buildBoard,
  findDisc,
  getCube,
  isBoardPainted,
  keyOf,
  neighbor,
  placeDiscsOnBoard,
} from "./board";
import {
  ENEMY_HOP_TIME,
  FREEZE_TIME,
  applyEnemyEffect,
  beginEnemyHop,
  chooseEnemyHop,
  collidesWithPlayer,
  freezeEnemies,
  isCatchable,
  isDeadly,
  landEnemy,
  lureEnemy,
  spawnFromRoster,
} from "./enemies";
import { getLevel } from "./levels";
import {
  emptyActivePowerUps,
  emptyEffectTimers,
  isInvincible,
  tickEffects,
} from "./powerups";
import {
  CATCH_UNDO_POINTS,
  EXTRA_LIFE_SCORE,
  GREEN_BALL_POINTS,
  LURE_POINTS,
  levelClearBonus,
  midPaintScore,
  paintScore,
  unusedDiscBonus,
} from "./scoring";
import type { GameState } from "./store";
import type {
  Board,
  Cube,
  Difficulty,
  DiscSpot,
  HopDirection,
  Particle,
  PlayerState,
} from "./types";

/** Hops per second for the player hop animation. */
const HOP_SPEED = 4.6;
/** Fall animation speed (0..1 progress per second). */
const FALL_SPEED = 1.35;
/** Seconds to ride a floating disc back to the top. */
const RIDE_TIME = 1.15;
/** Seconds of shake after a fall or hit. */
const SHAKE_DURATION = 0.45;
/** Stun after a hit (cannot hop). */
const HIT_STUN = 1.4;
/** Stun after respawning from a fall. */
const FALL_STUN = 0.7;
/** Swear balloon duration. */
const SWEAR_TIME = 1.1;
/** First-spawn delay so the player can start painting. */
const SPAWN_GRACE = 2.2;

const DIFFICULTY_SPAWN: Record<Difficulty, number> = {
  easy: 1.35,
  normal: 1,
  hard: 0.72,
};
const DIFFICULTY_TICK: Record<Difficulty, number> = {
  easy: 1.25,
  normal: 1,
  hard: 0.78,
};

export interface SessionCarry {
  lives: number;
  extraLifeAwarded: boolean;
}

function emptyPlayer(position: CubePositionLike): PlayerState {
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
    rideFrom: null,
    falling: false,
    fallProgress: 0,
    fallDirection: null,
    stuck: false,
    stuckTimer: 0,
    stunned: false,
    stunTimer: 0,
    swearTimer: 0,
  };
}

type CubePositionLike = PlayerState["position"];

function addScore(state: GameState, points: number): GameState {
  const score = state.score + points;
  let extraLifeAwarded = state.extraLifeAwarded;
  let lives = state.lives;
  let message = state.message;
  if (!extraLifeAwarded && score >= EXTRA_LIFE_SCORE) {
    extraLifeAwarded = true;
    lives += 1;
    message = "Extra Life!";
  }
  return { ...state, score, extraLifeAwarded, lives, message };
}

function addParticle(
  state: GameState,
  position: CubePositionLike,
  kind: Particle["kind"],
  color: string,
): GameState {
  const particle: Particle = {
    id: `p${state.particles.length}-${Math.random().toString(36).slice(2, 7)}`,
    position,
    kind,
    color,
    life: 0.55,
    maxLife: 0.55,
  };
  return { ...state, particles: [...state.particles, particle] };
}

function applyColorRule(
  board: Board,
  cube: Cube,
  rule: GameState["level"]["colorRule"],
): { board: Board; paintedNow: boolean; midNow: boolean } {
  const set = (updated: Cube): Board => ({
    ...board,
    cubes: { ...board.cubes, [keyOf(cube.position)]: updated },
  });

  if (rule === "oneHop") {
    if (cube.painted) return { board, paintedNow: false, midNow: false };
    return {
      board: set({
        ...cube,
        painted: true,
        color: "target",
        paintProgress: 0,
      }),
      paintedNow: true,
      midNow: false,
    };
  }

  if (rule === "twoHop") {
    if (cube.painted) return { board, paintedNow: false, midNow: false };
    const next = cube.paintProgress - 1;
    if (next <= 0) {
      return {
        board: set({
          ...cube,
          painted: true,
          color: "target",
          paintProgress: 0,
        }),
        paintedNow: true,
        midNow: false,
      };
    }
    return {
      board: set({ ...cube, paintProgress: next, color: "washed" }),
      paintedNow: false,
      midNow: true,
    };
  }

  if (rule === "flipBack") {
    if (cube.painted) {
      return {
        board: set({
          ...cube,
          painted: false,
          color: "washed",
          paintProgress: 1,
        }),
        paintedNow: false,
        midNow: false,
      };
    }
    return {
      board: set({
        ...cube,
        painted: true,
        color: "target",
        paintProgress: 0,
      }),
      paintedNow: true,
      midNow: false,
    };
  }

  // twoHopFlip: 2 → 1 (mid) → 0 (target) → 2 (washed)
  if (cube.painted) {
    return {
      board: set({
        ...cube,
        painted: false,
        color: "washed",
        paintProgress: 2,
      }),
      paintedNow: false,
      midNow: false,
    };
  }
  const next = cube.paintProgress - 1;
  if (next <= 0) {
    return {
      board: set({
        ...cube,
        painted: true,
        color: "target",
        paintProgress: 0,
      }),
      paintedNow: true,
      midNow: false,
    };
  }
  return {
    board: set({ ...cube, paintProgress: next, color: "washed" }),
    paintedNow: false,
    midNow: true,
  };
}

function clearHazards(state: GameState): GameState {
  return {
    ...state,
    enemies: [],
    spawnTimer: SPAWN_GRACE,
  };
}

function loseLife(state: GameState, message: string): GameState {
  const lives = state.lives - 1;
  if (lives <= 0) {
    return {
      ...state,
      lives: 0,
      phase: "gameover",
      message: "Game Over",
      shake: SHAKE_DURATION,
      player: { ...state.player, swearTimer: SWEAR_TIME },
    };
  }
  return {
    ...state,
    lives,
    message,
    shake: SHAKE_DURATION,
    player: { ...state.player, swearTimer: SWEAR_TIME },
  };
}

function startFall(state: GameState, direction: HopDirection): GameState {
  let s = loseLife(state, "Fell off!");
  return {
    ...s,
    player: {
      ...s.player,
      falling: true,
      fallProgress: 0,
      fallDirection: direction,
      hopping: false,
      ridingDisc: false,
      stunned: true,
      stunTimer: 99,
    },
  };
}

function hitPlayer(state: GameState): GameState {
  let s = loseLife(state, "@!#?@!");
  if (s.phase === "gameover") {
    return {
      ...s,
      player: { ...s.player, swearTimer: SWEAR_TIME, hopping: false },
    };
  }
  s = clearHazards(s);
  return {
    ...s,
    player: {
      ...s.player,
      hopping: false,
      hopProgress: 0,
      stunned: true,
      stunTimer: HIT_STUN,
      swearTimer: SWEAR_TIME,
    },
  };
}

function resolveContact(state: GameState): GameState {
  const occupant = state.enemies.find((e) =>
    collidesWithPlayer(e, state.player),
  );
  if (!occupant) return state;

  if (isCatchable(occupant)) {
    let s: GameState = {
      ...state,
      enemies: state.enemies.filter((e) => e.id !== occupant.id),
    };
    if (occupant.kind === "undo") {
      s = addScore(s, CATCH_UNDO_POINTS);
      s = { ...s, message: "+300" };
    } else {
      s = addScore(s, GREEN_BALL_POINTS);
      s = {
        ...s,
        enemies: freezeEnemies(s.enemies, FREEZE_TIME),
        message: "Freeze!",
      };
    }
    return addParticle(s, occupant.position, "gem", "#4cd964");
  }

  if (isDeadly(occupant)) {
    if (isInvincible(state.powerUps)) {
      return {
        ...state,
        enemies: state.enemies.filter((e) => e.id !== occupant.id),
        message: "Invincible!",
      };
    }
    return hitPlayer(state);
  }
  return state;
}

function applyLanding(state: GameState): GameState {
  const pos = state.player.hopTo;
  const cube = getCube(state.board, pos);
  if (!cube) return state;

  const { board, paintedNow, midNow } = applyColorRule(
    state.board,
    cube,
    state.level.colorRule,
  );

  let s: GameState = {
    ...state,
    board,
    player: {
      ...state.player,
      hopping: false,
      position: pos,
      hopProgress: 0,
      hopsRemaining: 0,
    },
  };

  if (paintedNow) {
    s = addScore(s, paintScore(Math.max(1, s.combo)));
    s = { ...s, combo: s.combo + 1, comboTimer: 3 };
    s = addParticle(s, pos, "colorChange", s.level.targetHex);
  } else if (midNow) {
    s = addScore(s, midPaintScore());
    s = addParticle(s, pos, "paint", s.level.midHex);
  }

  return resolveContact(s);
}

function lureCoily(state: GameState, from: CubePositionLike): GameState {
  const coily = state.enemies.find((e) => e.kind === "eggSnake" && e.hatched);
  if (!coily) return clearHazards(state);
  const close =
    keyOf(coily.position) === keyOf(from) ||
    keyOf(coily.hopTo) === keyOf(from) ||
    Math.abs(coily.position.x - from.x) + Math.abs(coily.position.z - from.z) <=
      2;
  if (!close) return clearHazards(state);
  let s = addScore(state, LURE_POINTS);
  s = addParticle(s, from, "enemyLure", "#a05ce0");
  s = {
    ...s,
    enemies: [lureEnemy(coily)],
    message: "500 — snake dove!",
    spawnTimer: SPAWN_GRACE,
  };
  return s;
}

function startRide(
  state: GameState,
  disc: DiscSpot,
  direction: HopDirection,
): GameState {
  let s: GameState = {
    ...state,
    discSpots: state.discSpots.map((d) =>
      d.id === disc.id ? { ...d, used: true, active: true } : d,
    ),
    discs: Math.max(0, state.discs - 1),
    player: {
      ...state.player,
      ridingDisc: true,
      rideTimer: RIDE_TIME,
      rideFrom: null,
      hopping: false,
      hopDirection: direction,
    },
  };
  s = lureCoily(s, state.player.position);
  return s;
}

function tickEnemies(state: GameState, deltaTime: number): GameState {
  let s = state;
  const tick = state.level.enemyTick * DIFFICULTY_TICK[state.difficulty];
  let board = s.board;
  const next = s.enemies.flatMap((enemy) => {
    if (enemy.falling) {
      const fp = enemy.fallProgress + deltaTime * FALL_SPEED;
      if (fp >= 1) return [];
      return [{ ...enemy, fallProgress: fp }];
    }
    if (enemy.frozenTimer > 0) {
      return [
        { ...enemy, frozenTimer: Math.max(0, enemy.frozenTimer - deltaTime) },
      ];
    }
    if (enemy.hopping) {
      const hp = enemy.hopProgress + deltaTime / ENEMY_HOP_TIME;
      if (hp < 1) return [{ ...enemy, hopProgress: hp }];
      const landed = landEnemy({ ...enemy, hopProgress: 1 }, board);
      if (!landed) return [];
      board = applyEnemyEffect(landed, board);
      return [landed];
    }
    const wait = enemy.moveTimer + deltaTime;
    if (wait < tick) return [{ ...enemy, moveTimer: wait }];
    const choice = chooseEnemyHop(enemy, board, s.player);
    if (!choice) return [];
    return [beginEnemyHop(enemy, choice.to, choice.leaving)];
  });
  s = { ...s, enemies: next, board };
  return resolveContact(s);
}

function tickSpawns(state: GameState, deltaTime: number): GameState {
  if (state.phase !== "playing") return state;
  const every = state.level.spawnEvery * DIFFICULTY_SPAWN[state.difficulty];
  const spawnTimer = state.spawnTimer + deltaTime;
  if (spawnTimer < every) return { ...state, spawnTimer };
  if (state.enemies.length >= state.level.maxEnemies) {
    return { ...state, spawnTimer: every };
  }

  const roster = state.level.spawnRoster;
  if (roster.length === 0) return { ...state, spawnTimer: 0 };

  let index = state.spawnIndex;
  let kind = roster[index % roster.length];
  // Only one snake at a time.
  if (kind === "eggSnake" && state.enemies.some((e) => e.kind === "eggSnake")) {
    index += 1;
    kind = roster[index % roster.length];
    if (
      kind === "eggSnake" &&
      state.enemies.some((e) => e.kind === "eggSnake")
    ) {
      return { ...state, spawnTimer: 0, spawnIndex: index + 1 };
    }
  }

  const spawned = spawnFromRoster(
    kind,
    state.board,
    `e${state.levelNumber}-${index}-${Math.random().toString(36).slice(2, 6)}`,
  );
  if (!spawned) return { ...state, spawnTimer: 0, spawnIndex: index + 1 };
  if (keyOf(spawned.position) === keyOf(state.player.position)) {
    return { ...state, spawnTimer: every * 0.4, spawnIndex: index };
  }
  return {
    ...state,
    enemies: [...state.enemies, spawned],
    spawnTimer: 0,
    spawnIndex: index + 1,
  };
}

export function startLevel(
  levelNumber: number,
  carry?: SessionCarry,
): Partial<GameState> {
  const level = getLevel(levelNumber);
  let board = buildBoard(level);
  if (level.colorRule === "twoHop" || level.colorRule === "twoHopFlip") {
    const cubes: Record<string, Cube> = {};
    for (const k of Object.keys(board.cubes)) {
      cubes[k] = { ...board.cubes[k], paintProgress: 2 };
    }
    board = { ...board, cubes };
  }
  const apexPos = apex(board).position;
  const lives = carry?.lives ?? level.lives;
  const discSpots = placeDiscsOnBoard(board, level.discs);
  return {
    phase: "playing",
    level,
    levelNumber,
    board,
    player: emptyPlayer(apexPos),
    enemies: [],
    powerUpItems: [],
    gems: [],
    discSpots,
    particles: [],
    effectTimers: emptyEffectTimers(),
    shake: 0,
    message: level.name,
    lives,
    discs: discSpots.length,
    targetColor: level.targetColor,
    combo: 0,
    comboTimer: 0,
    powerUps: emptyActivePowerUps(),
    spawnTimer: SPAWN_GRACE,
    spawnIndex: 0,
    extraLifeAwarded: carry?.extraLifeAwarded ?? false,
  };
}

/** Initiate a diagonal hop, ride a disc, or fall off the pyramid. */
export function hop(state: GameState, direction: HopDirection): GameState {
  if (state.phase !== "playing") return state;
  const p = state.player;
  if (p.hopping || p.falling || p.ridingDisc || p.stuck || p.stunned) {
    return state;
  }

  const target = neighbor(state.board, p.position, direction);
  if (target) {
    return {
      ...state,
      player: {
        ...p,
        hopping: true,
        hopDirection: direction,
        hopFrom: p.position,
        hopTo: target,
        hopProgress: 0,
        hopsRemaining: 0,
      },
    };
  }

  const disc = findDisc(state.discSpots, p.position, direction);
  if (disc) return startRide(state, disc, direction);

  return startFall(state, direction);
}

export function update(state: GameState, deltaTime: number): GameState {
  if (state.phase !== "playing") return state;
  let s = state;

  if (s.player.swearTimer > 0) {
    s = {
      ...s,
      player: {
        ...s.player,
        swearTimer: Math.max(0, s.player.swearTimer - deltaTime),
      },
    };
  }

  if (s.player.stunned && !s.player.falling) {
    const st = s.player.stunTimer - deltaTime;
    s = {
      ...s,
      player: { ...s.player, stunned: st > 0, stunTimer: Math.max(0, st) },
    };
  }

  if (s.player.hopping) {
    const hp = s.player.hopProgress + deltaTime * HOP_SPEED;
    if (hp >= 1) {
      s = applyLanding(s);
    } else {
      s = { ...s, player: { ...s.player, hopProgress: hp } };
    }
  }

  if (s.player.falling) {
    const fp = s.player.fallProgress + deltaTime * FALL_SPEED;
    if (fp >= 1) {
      if (s.phase === "gameover") {
        s = { ...s, player: { ...s.player, fallProgress: 1 } };
      } else {
        const top = apex(s.board).position;
        s = clearHazards(s);
        s = {
          ...s,
          player: {
            ...emptyPlayer(top),
            stunned: true,
            stunTimer: FALL_STUN,
          },
        };
      }
    } else {
      s = { ...s, player: { ...s.player, fallProgress: fp } };
    }
  }

  if (s.player.ridingDisc) {
    const rt = s.player.rideTimer - deltaTime;
    if (rt <= 0) {
      const top = apex(s.board).position;
      s = {
        ...s,
        player: {
          ...s.player,
          ridingDisc: false,
          rideTimer: 0,
          rideFrom: null,
          position: top,
          hopTo: top,
          hopFrom: top,
        },
        discSpots: s.discSpots.map((d) => ({ ...d, active: false })),
      };
    } else {
      s = { ...s, player: { ...s.player, rideTimer: rt } };
    }
  }

  s = tickEnemies(s, deltaTime);
  s = tickSpawns(s, deltaTime);

  const { active, timers } = tickEffects(s.powerUps, s.effectTimers, deltaTime);
  s = { ...s, powerUps: active, effectTimers: timers };

  if (s.combo > 0) {
    const ct = s.comboTimer - deltaTime;
    if (ct <= 0) s = { ...s, combo: 0, comboTimer: 0 };
    else s = { ...s, comboTimer: ct };
  }

  s = {
    ...s,
    particles: s.particles
      .map((p) => ({ ...p, life: p.life - deltaTime }))
      .filter((p) => p.life > 0),
  };

  if (s.shake > 0) s = { ...s, shake: Math.max(0, s.shake - deltaTime) };

  if (s.phase === "playing" && isBoardPainted(s.board)) {
    const unused = s.discSpots.filter((d) => !d.used).length;
    const bonus =
      levelClearBonus(s.levelNumber) + unusedDiscBonus(unused, s.levelNumber);
    s = addScore(
      {
        ...s,
        phase: "levelclear",
        message: "Level Clear!",
      },
      bonus,
    );
  }

  return s;
}

/** Advance to the next stage, keeping lives and extra-life state. */
export function advanceLevel(state: GameState): Partial<GameState> {
  return startLevel(state.levelNumber + 1, {
    lives: state.lives,
    extraLifeAwarded: state.extraLifeAwarded,
  });
}
