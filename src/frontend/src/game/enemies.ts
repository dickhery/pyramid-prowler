/**
 * Enemy AI for Pyramid Prowler.
 *
 * Classic roster:
 *  - eggSnake: purple egg bounces down, hatches at the bottom, then chases
 *  - fallingBall: red (deadly) or green (freeze) balls that only hop down
 *  - undo: green gremlins that hop down and unpaint cubes (safe to catch)
 *  - crawler: side-crawlers that cross the pyramid from a bottom corner
 */
import {
  applyHop,
  bottomLeft,
  bottomRight,
  downNeighbors,
  getCube,
  hasCube,
  keyOf,
  neighbor,
  neighborsOf,
  randomCube,
  spawnRow,
} from "./board";
import type {
  Board,
  Cube,
  CubeColor,
  CubePosition,
  Enemy,
  HopDirection,
  PlayerState,
  SpawnKind,
} from "./types";

/** Seconds for an egg to hatch after reaching the bottom. */
export const HATCH_TIME = 0.05;

/** Seconds enemies stay frozen after a green ball. */
export const FREEZE_TIME = 5;

/** Hop animation length for enemies (seconds). */
export const ENEMY_HOP_TIME = 0.28;

const DEADLY_KINDS = new Set<Enemy["kind"]>([
  "eggSnake",
  "crawler",
  "drone",
  "blob",
]);

/** Whether an enemy costs a life on contact. */
export function isDeadly(enemy: Enemy): boolean {
  if (enemy.frozenTimer > 0 || enemy.falling || enemy.leaving) return false;
  if (enemy.kind === "fallingBall") return enemy.color === "deadly";
  if (enemy.kind === "undo") return false;
  return DEADLY_KINDS.has(enemy.kind);
}

/** Catchable (green) — awards points and is removed. */
export function isCatchable(enemy: Enemy): boolean {
  if (enemy.frozenTimer > 0 || enemy.falling || enemy.leaving) return false;
  if (enemy.kind === "undo") return true;
  return enemy.kind === "fallingBall" && enemy.color === "safe";
}

export function isFrozen(enemy: Enemy): boolean {
  return enemy.frozenTimer > 0;
}

function dist(a: CubePosition, b: CubePosition): number {
  return Math.abs(a.x - b.x) + Math.abs(a.z - b.z) + Math.abs(a.y - b.y);
}

/** Occupies the same cube and is not currently in the air. */
export function collidesWithPlayer(enemy: Enemy, player: PlayerState): boolean {
  if (enemy.hopping || enemy.falling || enemy.leaving) return false;
  if (player.hopping || player.falling || player.ridingDisc) return false;
  return keyOf(enemy.position) === keyOf(player.position);
}

function emptyHopFields(pos: CubePosition) {
  return {
    hopping: false,
    hopProgress: 0,
    hopFrom: pos,
    hopTo: pos,
    leaving: false,
    falling: false,
    fallProgress: 0,
  };
}

/** Build a freshly spawned enemy. */
export function makeEnemy(
  id: string,
  kind: Enemy["kind"],
  position: CubePosition,
  color: CubeColor,
  extra: Partial<Enemy> = {},
): Enemy {
  return {
    id,
    kind,
    position,
    speed: 1,
    color,
    hatched: false,
    hatchTimer: 0,
    frozen: false,
    drainAmount: 1,
    face: "top",
    moveTimer: 0,
    frozenTimer: 0,
    crawlSense: null,
    ...emptyHopFields(position),
    ...extra,
  };
}

/** Spawn an enemy from the stage roster. */
export function spawnFromRoster(
  kind: SpawnKind,
  board: Board,
  id: string,
): Enemy | null {
  if (kind === "crawlerLeft") {
    const pos = bottomLeft(board);
    return makeEnemy(id, "crawler", pos, "deadly", {
      face: "east",
      crawlSense: "left",
    });
  }
  if (kind === "crawlerRight") {
    const pos = bottomRight(board);
    return makeEnemy(id, "crawler", pos, "deadly", {
      face: "west",
      crawlSense: "right",
    });
  }

  const row = spawnRow(board);
  if (row.length === 0) return null;
  const pos = row[Math.floor(Math.random() * row.length)];

  switch (kind) {
    case "redBall":
      return makeEnemy(id, "fallingBall", pos, "deadly");
    case "greenBall":
      return makeEnemy(id, "fallingBall", pos, "safe");
    case "eggSnake":
      return makeEnemy(id, "eggSnake", pos, "deadly", {
        hatched: false,
        hatchTimer: 0,
      });
    case "undo":
      return makeEnemy(id, "undo", pos, "safe");
  }
}

/** Pick the next hop for an enemy. `undefined` means hop off the pyramid. */
export function chooseEnemyHop(
  enemy: Enemy,
  board: Board,
  player: PlayerState,
): { to: CubePosition; leaving: boolean } | null {
  // Unhatched eggs, balls, and gremlins only bounce downward.
  const descends =
    enemy.kind === "fallingBall" ||
    enemy.kind === "undo" ||
    (enemy.kind === "eggSnake" && !enemy.hatched);

  if (descends) {
    const options = downNeighbors(board, enemy.position);
    if (options.length === 0) {
      return { to: applyHop(enemy.position, "south"), leaving: true };
    }
    return {
      to: options[Math.floor(Math.random() * options.length)],
      leaving: false,
    };
  }

  if (enemy.kind === "eggSnake" && enemy.hatched) {
    const options = neighborsOf(board, enemy.position);
    if (options.length === 0) return null;
    let best = options[0];
    let bestDist = dist(options[0], player.position);
    for (const option of options) {
      const d = dist(option, player.position);
      if (d < bestDist) {
        best = option;
        bestDist = d;
      }
    }
    return { to: best, leaving: false };
  }

  if (enemy.kind === "crawler") {
    return chooseCrawlerHop(enemy, board);
  }

  // Fallback chase (unused drone/blob).
  const options = neighborsOf(board, enemy.position);
  if (options.length === 0) return null;
  return {
    to: options[Math.floor(Math.random() * options.length)],
    leaving: false,
  };
}

/**
 * Side-crawlers travel from a bottom corner toward the opposite upper edge,
 * then hop off. Left-crawlers prefer +x / -z; right-crawlers prefer -x / -z.
 */
function chooseCrawlerHop(
  enemy: Enemy,
  board: Board,
): { to: CubePosition; leaving: boolean } | null {
  const dirs: HopDirection[] =
    enemy.crawlSense === "right"
      ? ["north", "west", "east", "south"]
      : ["west", "south", "north", "east"];
  for (const dir of dirs) {
    const n = neighbor(board, enemy.position, dir);
    if (!n) continue;
    if (enemy.crawlSense === "left") {
      if (n.x > enemy.position.x || n.z < enemy.position.z) {
        return { to: n, leaving: false };
      }
    } else if (n.x < enemy.position.x || n.z < enemy.position.z) {
      return { to: n, leaving: false };
    }
  }
  const any = neighborsOf(board, enemy.position);
  if (any.length === 0) {
    return { to: applyHop(enemy.position, "west"), leaving: true };
  }
  // No progress toward the exit — leave from the current edge.
  return { to: applyHop(enemy.position, "north"), leaving: true };
}

/** Begin an enemy hop (or off-pyramid exit). */
export function beginEnemyHop(
  enemy: Enemy,
  to: CubePosition,
  leaving: boolean,
): Enemy {
  return {
    ...enemy,
    hopping: true,
    hopProgress: 0,
    hopFrom: enemy.position,
    hopTo: to,
    leaving,
    moveTimer: 0,
  };
}

/** Finish an enemy hop: land, hatch, or leave. */
export function landEnemy(enemy: Enemy, board: Board): Enemy | null {
  if (enemy.leaving) return null;
  const landed = {
    ...enemy,
    ...emptyHopFields(enemy.hopTo),
    position: enemy.hopTo,
  };
  if (
    landed.kind === "eggSnake" &&
    !landed.hatched &&
    landed.position.y === 0
  ) {
    return { ...landed, hatched: true };
  }
  if (!hasCube(board, landed.position)) return null;
  return landed;
}

/** Unpaint the cube a green gremlin just landed on. */
export function applyEnemyEffect(enemy: Enemy, board: Board): Board {
  if (enemy.kind !== "undo") return board;
  const cube = getCube(board, enemy.position);
  if (!cube || !cube.painted) return board;
  return setCube(board, cube, { ...cube, painted: false, color: "washed" });
}

export function setCube(board: Board, cube: Cube, updated: Cube): Board {
  return {
    ...board,
    cubes: { ...board.cubes, [keyOf(cube.position)]: updated },
  };
}

export function freezeEnemies(enemies: Enemy[], duration: number): Enemy[] {
  return enemies.map((enemy) => ({ ...enemy, frozenTimer: duration }));
}

export function lureEnemy(enemy: Enemy): Enemy {
  return {
    ...enemy,
    falling: true,
    fallProgress: 0,
    hopping: false,
    leaving: true,
  };
}

export function teleportDestination(
  board: Board,
  _current: CubePosition,
): CubePosition {
  return randomCube(board).position;
}

export function isValidLanding(board: Board, pos: CubePosition): boolean {
  return hasCube(board, pos);
}
