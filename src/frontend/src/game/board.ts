/**
 * Board generation and cube helpers for Pyramid Prowler.
 *
 * A board is a triangular staircase of cubes. Valid cells satisfy
 * 0 <= x <= z <= height-1, and y = height-1-z. The apex is (0, 0, height-1).
 * Every cube is reachable from the apex via the four diagonal hops.
 */
import type {
  Board,
  Cube,
  CubeColor,
  CubePosition,
  DiscSpot,
  HopDirection,
  Level,
  SpecialBlock,
} from "./types";

export const DIRECTIONS: HopDirection[] = ["north", "south", "east", "west"];

/** Downward hops used by bouncing balls, eggs, and green gremlins. */
export const DOWN_DIRECTIONS: HopDirection[] = ["east", "south"];

/** Build the record key for a cube position. */
export function key(x: number, z: number, y: number): string {
  return `${x},${z},${y}`;
}

/** Build the record key for a cube position object. */
export function keyOf(pos: CubePosition): string {
  return key(pos.x, pos.z, pos.y);
}

/** Whether two positions occupy the same cube. */
export function samePos(a: CubePosition, b: CubePosition): boolean {
  return a.x === b.x && a.z === b.z && a.y === b.y;
}

/** Grid delta for one hop. */
export function hopDelta(direction: HopDirection): CubePosition {
  switch (direction) {
    case "north":
      return { x: -1, z: -1, y: 1 };
    case "south":
      return { x: 1, z: 1, y: -1 };
    case "east":
      return { x: 0, z: 1, y: -1 };
    case "west":
      return { x: 0, z: -1, y: 1 };
  }
}

/** Apply a hop to a position (does not check the board). */
export function applyHop(
  pos: CubePosition,
  direction: HopDirection,
): CubePosition {
  const d = hopDelta(direction);
  return { x: pos.x + d.x, z: pos.z + d.z, y: pos.y + d.y };
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
 * The four diagonal hop targets from a cube.
 *   north (up-left):    (x-1, z-1, y+1)
 *   south (down-right): (x+1, z+1, y-1)
 *   east  (down-left):  (x,   z+1, y-1)
 *   west  (up-right):   (x,   z-1, y+1)
 */
export function neighbor(
  board: Board,
  pos: CubePosition,
  direction: HopDirection,
): CubePosition | undefined {
  const target = applyHop(pos, direction);
  return hasCube(board, target) ? target : undefined;
}

/** Which hop, if any, takes `from` to `to`. */
export function directionBetween(
  from: CubePosition,
  to: CubePosition,
): HopDirection | undefined {
  for (const dir of DIRECTIONS) {
    const n = applyHop(from, dir);
    if (samePos(n, to)) return dir;
  }
  return undefined;
}

/** All valid hop destinations from a cube. */
export function neighborsOf(board: Board, pos: CubePosition): CubePosition[] {
  const out: CubePosition[] = [];
  for (const dir of DIRECTIONS) {
    const n = neighbor(board, pos, dir);
    if (n) out.push(n);
  }
  return out;
}

/** Downward neighbors (used by bouncing balls). */
export function downNeighbors(board: Board, pos: CubePosition): CubePosition[] {
  const out: CubePosition[] = [];
  for (const dir of DOWN_DIRECTIONS) {
    const n = neighbor(board, pos, dir);
    if (n) out.push(n);
  }
  return out;
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

/** Pick a random cube from the board. */
export function randomCube(board: Board): Cube {
  const cubes = allCubes(board);
  return cubes[Math.floor(Math.random() * cubes.length)];
}

/** The apex (top) cube of the pyramid. */
export function apex(board: Board): Cube {
  return board.cubes[key(0, 0, board.height - 1)];
}

/** The two cubes on the second row — classic spawn points. */
export function spawnRow(board: Board): CubePosition[] {
  const y = board.height - 2;
  const spots: CubePosition[] = [
    { x: 0, z: 1, y },
    { x: 1, z: 1, y },
  ];
  return spots.filter((p) => hasCube(board, p));
}

/** Bottom-left corner cube. */
export function bottomLeft(board: Board): CubePosition {
  return { x: 0, z: board.height - 1, y: 0 };
}

/** Bottom-right corner cube. */
export function bottomRight(board: Board): CubePosition {
  const z = board.height - 1;
  return { x: z, z, y: 0 };
}

/** An unused disc that sits off `from` in `direction`. */
export function findDisc(
  discs: DiscSpot[],
  from: CubePosition,
  direction: HopDirection,
): DiscSpot | undefined {
  return discs.find(
    (d) =>
      !d.used &&
      d.direction === direction &&
      d.anchor.x === from.x &&
      d.anchor.z === from.z &&
      d.anchor.y === from.y,
  );
}

/** Place classic side discs (left = north off x=0, right = west off x=z). */
export function placeDiscs(height: number, count: number): DiscSpot[] {
  const discs: DiscSpot[] = [];
  const mid = Math.max(2, Math.floor(height * 0.5));
  const low = Math.max(2, Math.floor(height * 0.72));
  const high = Math.max(2, Math.floor(height * 0.32));
  const rows = [mid, low, high].slice(0, Math.max(1, count));
  rows.forEach((z, i) => {
    const y = height - 1 - z;
    if (i % 2 === 0) {
      discs.push({
        id: `disc-L${i}`,
        anchor: { x: 0, z, y },
        direction: "north",
        active: false,
        used: false,
      });
    } else {
      discs.push({
        id: `disc-R${i}`,
        anchor: { x: z, z, y },
        direction: "west",
        active: false,
        used: false,
      });
    }
  });
  // Always try to have at least one on each side when count >= 2.
  if (count >= 2 && !discs.some((d) => d.direction === "west")) {
    discs.push({
      id: "disc-R",
      anchor: { x: low, z: low, y: height - 1 - low },
      direction: "west",
      active: false,
      used: false,
    });
  }
  return discs.slice(0, count);
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

/** Build a classic triangular pyramid (28 cubes when height is 7). */
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
  return buildTriangle(level);
}

/** The default washed-out color for a fresh cube. */
export const WASHED: CubeColor = "washed";
