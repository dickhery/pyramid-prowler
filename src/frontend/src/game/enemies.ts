import {
  allCubes,
  getCube,
  hasCube,
  keyOf,
  neighbor,
  randomCube,
} from "./board";
/**
 * Enemy AI for Pyramid Prowler.
 *
 * Enemies move on a tick (accumulating `moveTimer`). Each kind has distinct
 * behaviour: egg-then-snake pursuers hatch then chase, crawlers move along
 * cube faces, undo creatures reverse cube colors, falling balls are deadly
 * (red) or freeze enemies (green), drones chase, and blobs drain color.
 * Green = safe, purple/red = deadly.
 */
import type { Board, Cube, CubePosition, Enemy, PlayerState } from "./types";

/** Seconds between enemy moves (base). */
export const ENEMY_TICK = 1.0;

/** Seconds for an egg to hatch into a snake. */
export const HATCH_TIME = 4;

/** Seconds an enemy stays frozen by a freeze ray / green ball. */
export const FREEZE_TIME = 4;

/** The deadly colors that cost a life on collision. */
const DEADLY_COLORS = new Set(["deadly", "teleporter", "sticky"]);

/** Whether an enemy is deadly (costs a life) on collision. */
export function isDeadly(enemy: Enemy): boolean {
  if (enemy.frozenTimer > 0) return false;
  if (enemy.kind === "fallingBall") return enemy.color === "deadly";
  return DEADLY_COLORS.has(enemy.color);
}

/** Whether an enemy is currently frozen and cannot move. */
export function isFrozen(enemy: Enemy): boolean {
  return enemy.frozenTimer > 0;
}

/** The four directions an enemy can step. */
const DIRECTIONS = ["north", "south", "east", "west"] as const;

/** Pick a random valid neighbor for an enemy to step to. */
function randomStep(board: Board, pos: CubePosition): CubePosition {
  const options = DIRECTIONS.map((d) => neighbor(board, pos, d)).filter(
    (n): n is CubePosition => n !== undefined,
  );
  if (options.length === 0) return pos;
  return options[Math.floor(Math.random() * options.length)];
}

/** Step an enemy one hop toward the player (chasing kinds). */
function chaseStep(
  board: Board,
  pos: CubePosition,
  player: CubePosition,
): CubePosition {
  const options = DIRECTIONS.map((d) => neighbor(board, pos, d)).filter(
    (n): n is CubePosition => n !== undefined,
  );
  if (options.length === 0) return pos;
  // Pick the neighbor closest to the player (Manhattan distance on the grid).
  let best = options[0];
  let bestDist = dist(options[0], player);
  for (const option of options) {
    const d = dist(option, player);
    if (d < bestDist) {
      best = option;
      bestDist = d;
    }
  }
  return best;
}

/** Manhattan distance between two cube positions. */
function dist(a: CubePosition, b: CubePosition): number {
  return Math.abs(a.x - b.x) + Math.abs(a.z - b.z) + Math.abs(a.y - b.y);
}

/** Whether the player and enemy occupy the same cube. */
export function collidesWithPlayer(enemy: Enemy, player: PlayerState): boolean {
  return keyOf(enemy.position) === keyOf(player.position);
}

/** Advance an enemy by one tick of movement. */
export function stepEnemy(
  enemy: Enemy,
  board: Board,
  player: PlayerState,
): Enemy {
  if (enemy.frozenTimer > 0 || enemy.falling) return enemy;

  // Eggs just count down until they hatch.
  if (enemy.kind === "eggSnake" && !enemy.hatched) {
    return { ...enemy, hatchTimer: Math.max(0, enemy.hatchTimer - ENEMY_TICK) };
  }

  let next = { ...enemy };
  switch (enemy.kind) {
    case "eggSnake":
    case "drone":
      next.position = chaseStep(board, enemy.position, player.position);
      break;
    default:
      next.position = randomStep(board, enemy.position);
      break;
  }
  return next;
}

/** Apply an enemy's effect on the cube it currently occupies. */
export function applyEnemyEffect(enemy: Enemy, board: Board): Board {
  const cube = getCube(board, enemy.position);
  if (!cube) return board;

  // Undo creatures reverse painted cubes back to washed.
  if (enemy.kind === "undo" && cube.painted) {
    return setCube(board, cube, { ...cube, painted: false, color: "washed" });
  }
  // Blobs drain color from painted cubes.
  if (enemy.kind === "blob" && cube.painted) {
    return setCube(board, cube, { ...cube, painted: false, color: "washed" });
  }
  return board;
}

/** Replace a single cube in the board record. */
export function setCube(board: Board, cube: Cube, updated: Cube): Board {
  return {
    ...board,
    cubes: { ...board.cubes, [keyOf(cube.position)]: updated },
  };
}

/** Freeze every enemy for a duration (freeze ray / green ball). */
export function freezeEnemies(enemies: Enemy[], duration: number): Enemy[] {
  return enemies.map((enemy) => ({ ...enemy, frozenTimer: duration }));
}

/** Slow every enemy by scaling their tick (slowEnemies effect). */
export function slowEnemies(enemies: Enemy[], factor: number): Enemy[] {
  return enemies.map((enemy) => ({
    ...enemy,
    speed: Math.max(0.25, enemy.speed * factor),
  }));
}

/** Lure an enemy onto a disc: mark it falling for bonus points. */
export function lureEnemy(enemy: Enemy): Enemy {
  return { ...enemy, falling: true };
}

/** Pick a random cube for a teleporter destination. */
export function teleportDestination(
  board: Board,
  _current: CubePosition,
): CubePosition {
  const cube = randomCube(board);
  return cube.position;
}

/** Whether a cube is a valid landing spot (exists on the board). */
export function isValidLanding(board: Board, pos: CubePosition): boolean {
  return hasCube(board, pos);
}

/** All enemies that are currently falling (for bonus scoring). */
export function fallingEnemies(enemies: Enemy[]): Enemy[] {
  return enemies.filter((enemy) => enemy.falling);
}

/** Remove enemies that have finished falling off the board. */
export function removeFallen(enemies: Enemy[]): Enemy[] {
  return enemies.filter((enemy) => !enemy.falling);
}

/** A helper to get a random cube for enemy spawns. */
export function randomBoardCube(board: Board): Cube {
  return randomCube(board);
}

/** All cubes on the board (re-export for convenience). */
export function boardCubes(board: Board): Cube[] {
  return allCubes(board);
}
