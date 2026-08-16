/**
 * Board generation and cube helpers for Pyramid Prowler.
 *
 * A board is a pyramid of cubes arranged in layers. Layer `y` (0 = bottom) is a
 * square of side `height - y`, so the top layer is a single cube (the apex).
 * Cubes are keyed by "x,z,y" in a flat record for O(1) lookup.
 */
import type {
  Board,
  BoardShape,
  Cube,
  CubeColor,
  CubePosition,
  Level,
  SpecialBlock,
} from "./types";

/** Build the record key for a cube position. */
export function key(x: number, z: number, y: number): string {
  return `${x},${z},${y}`;
}

/** Build the record key for a cube position object. */
export function keyOf(pos: CubePosition): string {
  return key(pos.x, pos.z, pos.y);
}

/** Whether a cube exists at the given layer coordinates. */
export function inLayer(
  x: number,
  z: number,
  y: number,
  height: number,
): boolean {
  const side = height - y;
  return x >= 0 && z >= 0 && x < side && z < side;
}

/** Look up a cube on the board, or undefined if it does not exist. */
export function getCube(board: Board, pos: CubePosition): Cube | undefined {
  return board.cubes[keyOf(pos)];
}

/** Whether a cube exists at the given position. */
export function hasCube(board: Board, pos: CubePosition): boolean {
  return keyOf(pos) in board.cubes;
}

/**
 * The four diagonal hop targets from a cube, in direction order.
 *
 * Q*bert-style movement on the triangle: each hop changes the row `z` by ±1
 * and the column `x` by 0 or ±1, with the layer `y` moving opposite to `z`
 * (y = height-1-z). The four hops are:
 *   north (up-left):    (x-1, z-1, y+1)
 *   south (down-right): (x+1, z+1, y-1)
 *   east  (down-left):  (x,   z+1, y-1)
 *   west  (up-right):   (x,   z-1, y+1)
 */
export function neighbor(
  board: Board,
  pos: CubePosition,
  direction: "north" | "south" | "east" | "west",
): CubePosition | undefined {
  const { x, z, y } = pos;
  let target: CubePosition;
  switch (direction) {
    case "north":
      target = { x: x - 1, z: z - 1, y: y + 1 };
      break;
    case "south":
      target = { x: x + 1, z: z + 1, y: y - 1 };
      break;
    case "east":
      target = { x, z: z + 1, y: y - 1 };
      break;
    case "west":
      target = { x, z: z - 1, y: y + 1 };
      break;
  }
  return hasCube(board, target) ? target : undefined;
}

/** All cubes on the board as a flat array. */
export function allCubes(board: Board): Cube[] {
  return Object.values(board.cubes);
}

/** Whether every cube on the board has reached the target color. */
export function isBoardPainted(board: Board): boolean {
  return allCubes(board).every((cube) => cube.painted);
}

/** Count how many cubes are still unpainted. */
export function remainingCubes(board: Board): number {
  return allCubes(board).filter((cube) => !cube.painted).length;
}

/** Pick a random cube from the board (used by teleporters). */
export function randomCube(board: Board): Cube {
  const cubes = allCubes(board);
  return cubes[Math.floor(Math.random() * cubes.length)];
}

/** The apex (top) cube of the pyramid. */
export function apex(board: Board): Cube {
  return board.cubes[key(0, 0, board.height - 1)];
}

/** A random cube on the bottom layer (used for disc destinations). */
export function randomBottomCube(board: Board): Cube {
  const bottom = allCubes(board).filter((cube) => cube.position.y === 0);
  return bottom[Math.floor(Math.random() * bottom.length)];
}

/** Create a fresh cube with default state. */
function makeCube(
  x: number,
  z: number,
  y: number,
  special: SpecialBlock,
): Cube {
  return {
    position: { x, z, y },
    color: "washed",
    painted: false,
    special,
    paintProgress: 1,
    decayTimer: 0,
    cycleIndex: 0,
  };
}

/** Assign special blocks to a handful of cubes for visual variety. */
function sprinkleSpecials(cubes: Cube[], count: number): void {
  const specials: SpecialBlock[] = [
    "ice",
    "sticky",
    "teleporter",
    "booster",
    "multi",
  ];
  const pool = cubes.filter((cube) => cube.position.y > 0);
  for (let i = 0; i < count && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    const cube = pool.splice(idx, 1)[0];
    cube.special = specials[Math.floor(Math.random() * specials.length)];
  }
}

/**
 * Build a Q*bert-style triangle board.
 *
 * The valid cubes are exactly those with 0 <= x <= z <= height-1, and each
 * cube sits at layer y = height-1-z. The apex is the single cube at
 * (0, 0, height-1). Every cube is reachable from the apex via the four
 * diagonal hops, so the level is always completable. All shapes build this
 * same triangle so no cube is ever unreachable.
 */
function buildTriangle(level: Level): Board {
  const cubes: Record<string, Cube> = {};
  const height = level.height;
  for (let z = 0; z < height; z++) {
    const y = height - 1 - z;
    for (let x = 0; x <= z; x++) {
      cubes[key(x, z, y)] = makeCube(x, z, y, "none");
    }
  }
  return {
    cubes,
    width: height,
    depth: height,
    height,
    shape: level.shape,
  };
}

/** Build a board from a level definition. */
export function buildBoard(level: Level): Board {
  const board = buildTriangle(level);
  // Sprinkle special blocks on later levels for escalating challenge.
  const specialCount =
    level.id >= 3 ? Math.min(4, Math.floor(level.id / 2)) : 0;
  sprinkleSpecials(allCubes(board), specialCount);
  return board;
}

/** The default washed-out color for a fresh cube. */
export const WASHED: CubeColor = "washed";
