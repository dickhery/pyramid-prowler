/**
 * Board generation and cube helpers for Pyramid Prowler.
 *
 * A board is a triangular staircase of cubes. Valid cells satisfy
 * 0 <= x <= z <= height-1, and y = height-1-z. The apex is (0, 0, height-1).
 * World space maps down-left to +Z and down-right to +X so the staircase
 * reads as a classic isometric pyramid, not a straight wall of boxes.
 * Every cube is reachable from the apex via the four diagonal hops.
 */
import type {
  Board,
  BoardShape,
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
  const found = spots.filter((p) => hasCube(board, p));
  if (found.length > 0) return found;
  return allCubes(board)
    .filter((c) => c.position.z === 1)
    .map((c) => c.position);
}

/** Lowest existing cube on the left edge (x = 0). */
export function bottomLeft(board: Board): CubePosition {
  const left = allCubes(board).filter((c) => c.position.x === 0);
  if (left.length === 0) return allCubes(board)[0].position;
  return left.reduce((best, cube) =>
    cube.position.z > best.position.z ? cube : best,
  ).position;
}

/** Lowest existing cube on the right edge (x = z). */
export function bottomRight(board: Board): CubePosition {
  const right = allCubes(board).filter((c) => c.position.x === c.position.z);
  if (right.length === 0) return allCubes(board)[0].position;
  return right.reduce((best, cube) =>
    cube.position.z > best.position.z ? cube : best,
  ).position;
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
  const mid = Math.max(2, Math.floor(height * 0.5));
  const low = Math.max(2, Math.floor(height * 0.72));
  const high = Math.max(2, Math.floor(height * 0.32));
  const rows = [mid, low, high];
  const discs: DiscSpot[] = [];
  rows.forEach((z, i) => {
    const y = height - 1 - z;
    if (z >= height) return;
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

/** Place discs only beside cubes that actually exist on this board. */
export function placeDiscsOnBoard(board: Board, count: number): DiscSpot[] {
  const left = allCubes(board)
    .filter((c) => c.position.x === 0 && c.position.z >= 2)
    .sort((a, b) => a.position.z - b.position.z);
  const right = allCubes(board)
    .filter((c) => c.position.x === c.position.z && c.position.z >= 2)
    .sort((a, b) => a.position.z - b.position.z);
  const picks: DiscSpot[] = [];
  const take = (list: Cube[], i: number, side: "L" | "R"): DiscSpot | null => {
    if (list.length === 0) return null;
    const cube =
      list[Math.min(list.length - 1, Math.floor((i * list.length) / 3))];
    return {
      id: `disc-${side}${i}`,
      anchor: cube.position,
      direction: side === "L" ? "north" : "west",
      active: false,
      used: false,
    };
  };
  for (let i = 0; i < count; i++) {
    const disc = i % 2 === 0 ? take(left, i, "L") : take(right, i, "R");
    if (disc) picks.push(disc);
  }
  return picks;
}

/**
 * Which cells of the triangle belong to this stage's silhouette.
 * Top three rows and both long edges always stay so every cube is
 * reachable from the apex.
 */
export function includeCell(
  shape: BoardShape,
  x: number,
  z: number,
  height: number,
): boolean {
  if (x < 0 || z < 0 || x > z || z >= height) return false;
  if (z <= 2) return true;
  if (x === 0 || x === z) return true;

  switch (shape) {
    case "mesa":
    case "spire":
    case "pyramid":
      return true;
    case "stepped":
      return !(z % 2 === 1 && x === z - 1 && z >= 4);
    case "chevron":
      return !(z >= height - 2 && x !== 0 && x !== z);
    case "hourglass": {
      const lo = Math.floor(height * 0.4);
      const hi = Math.floor(height * 0.72);
      if (z >= lo && z <= hi && x !== Math.floor(z / 2)) return false;
      return true;
    }
    case "wings":
      return !(z >= 3 && z < height - 1 && x === Math.floor(z / 2));
    case "trident":
      return x === Math.floor(z / 2) || x === Math.ceil(z / 2);
    case "floating":
      return !(z === height - 3 && (x === 1 || x === z - 1) && z > 3);
    case "rotating":
      return !((x + z) % 3 === 0 && z > 3);
  }
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

/** Build a triangular staircase, then cut it to the stage silhouette. */
function buildTriangle(level: Level): Board {
  const cubes: Record<string, Cube> = {};
  const height = level.height;
  for (let z = 0; z < height; z++) {
    const y = height - 1 - z;
    for (let x = 0; x <= z; x++) {
      if (!includeCell(level.shape, x, z, height)) continue;
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
