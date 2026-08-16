import type {
  Board,
  Cube,
  CubePosition,
  DiscSpot,
  HopDirection,
  Level,
} from "@/game/types";

/** Edge length of a single cube in world units. */
export const CUBE_SIZE = 1;

/** Forward step per pyramid row — close to a full cube so tops stay readable. */
export const ROW_DEPTH = 0.86;

/** Distance from a cube's top face to the character origin (body center). */
export const FOOT_OFFSET = 0.56;

/**
 * Convert a grid cube into world-space [x, y, z].
 *
 * Cubes form a triangular staircase (classic isometric pyramid):
 * each down-left / down-right hop offsets by half a cube sideways,
 * a full cube down, and half a cube toward the camera. The character
 * must use `standOnTop` — this returns the cube *centre*, which sits
 * inside the block.
 */
export function cubeCenter(
  _board: Board,
  pos: CubePosition,
): [number, number, number] {
  const s = CUBE_SIZE;
  return [(pos.x - pos.z / 2) * s, pos.y * s + s / 2, pos.z * ROW_DEPTH];
}

/** World position of the top centre of a cube. */
export function cubeTop(
  board: Board,
  pos: CubePosition,
): [number, number, number] {
  const [x, y, z] = cubeCenter(board, pos);
  return [x, y + CUBE_SIZE / 2, z];
}

/**
 * World position for a creature standing on a cube. The origin is the
 * body centre, so we lift by the cube half-extent plus foot offset —
 * otherwise the mesh is buried inside the block.
 */
export function standOnTop(
  board: Board,
  pos: CubePosition,
): [number, number, number] {
  const [x, y, z] = cubeCenter(board, pos);
  return [x, y + CUBE_SIZE / 2 + FOOT_OFFSET, z];
}

/** World-space delta of one hop in a given direction. */
export function hopWorldDelta(
  direction: HopDirection,
): [number, number, number] {
  const s = CUBE_SIZE;
  const d = ROW_DEPTH;
  switch (direction) {
    case "north":
      return [-s / 2, s, -d];
    case "south":
      return [s / 2, -s, d];
    case "east":
      return [-s / 2, -s, d];
    case "west":
      return [s / 2, s, -d];
  }
}

/** World position of a floating escape disc beside its anchor cube. */
export function discWorldPos(
  board: Board,
  disc: DiscSpot,
): [number, number, number] {
  const [cx, cy, cz] = cubeCenter(board, disc.anchor);
  const [dx, , dz] = hopWorldDelta(disc.direction);
  return [cx + dx, cy + CUBE_SIZE / 2 + 0.04, cz + dz];
}

/** Interpolate a hop between two standing positions with a jump arc. */
export function hopArc(
  from: [number, number, number],
  to: [number, number, number],
  t: number,
  height = 0.85,
): [number, number, number] {
  const arc = Math.sin(t * Math.PI) * height;
  return [
    from[0] + (to[0] - from[0]) * t,
    from[1] + (to[1] - from[1]) * t + arc,
    from[2] + (to[2] - from[2]) * t,
  ];
}

/** Starting vertical field of view — wide enough to show a full tall board. */
export const CAMERA_FOV = 42;

/** World-axis-aligned bounds of every cube, padded for discs and the hopper. */
export function boardBounds(board: Board): {
  min: [number, number, number];
  max: [number, number, number];
  center: [number, number, number];
} {
  const cubes = Object.values(board.cubes);
  if (cubes.length === 0) {
    return { min: [-1, 0, -1], max: [1, 2, 1], center: [0, 1, 0] };
  }
  const half = CUBE_SIZE / 2;
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let minZ = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  let maxZ = Number.NEGATIVE_INFINITY;
  for (const cube of cubes) {
    const [x, y, z] = cubeCenter(board, cube.position);
    minX = Math.min(minX, x - half);
    maxX = Math.max(maxX, x + half);
    minY = Math.min(minY, y - half);
    maxY = Math.max(maxY, y + half);
    minZ = Math.min(minZ, z - half);
    maxZ = Math.max(maxZ, z + half);
  }
  // Side discs sit one hop off the edges; leave room for the character.
  minX -= CUBE_SIZE;
  maxX += CUBE_SIZE;
  maxY += FOOT_OFFSET + 0.4;
  minZ -= ROW_DEPTH;
  maxZ += ROW_DEPTH;
  return {
    min: [minX, minY, minZ],
    max: [maxX, maxY, maxZ],
    center: [(minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2],
  };
}

/** Look-at target: true visual centre of the current silhouette. */
export function pyramidFocus(board: Board): [number, number, number] {
  return boardBounds(board).center;
}

/**
 * Distance from the focus that fits the whole board in the frustum.
 * `padding` covers HUD, hop pad, and a little breathing room.
 */
export function fitDistance(
  board: Board,
  fovDeg = CAMERA_FOV,
  aspect = 16 / 9,
  padding = 1.55,
): number {
  const { min, max } = boardBounds(board);
  const width = max[0] - min[0];
  // The staircase is both tall and deep; from the front-elevated angle those
  // two axes stack on screen, so add a share of depth to the vertical size.
  const height = max[1] - min[1] + (max[2] - min[2]) * 0.45;
  const fov = (fovDeg * Math.PI) / 180;
  const half = Math.tan(fov / 2);
  const distV = height / 2 / half;
  const distH = width / 2 / half / Math.max(aspect, 0.5);
  const portrait = aspect < 0.85 ? 1.22 : 1;
  return Math.max(distV, distH, 8) * padding * portrait;
}

/**
 * Default camera: in front of the pyramid (+Z), a little to the right, far
 * enough that every cube (and the side discs) is on screen at start.
 */
export function pyramidCameraPos(
  board: Board,
  aspect = 16 / 9,
  zoom = 1,
): [number, number, number] {
  const [fx, fy, fz] = pyramidFocus(board);
  const dist = fitDistance(board, CAMERA_FOV, aspect) * zoom;
  const dirX = 0.2;
  const dirY = 0.78;
  const dirZ = 1.42;
  const len = Math.hypot(dirX, dirY, dirZ);
  return [
    fx + (dirX / len) * dist,
    fy + (dirY / len) * dist,
    fz + (dirZ / len) * dist,
  ];
}

/** Top-face color for a cube using the level palette. */
export function topColor(cube: Cube, level: Level): string {
  if (cube.painted) return level.targetHex;
  if (
    cube.paintProgress === 1 &&
    (level.colorRule === "twoHop" || level.colorRule === "twoHopFlip")
  ) {
    return level.midHex;
  }
  return level.washedHex;
}

/** Map a cube color state to a fallback CSS color. */
export function colorFor(cubeColor: Cube["color"]): string {
  switch (cubeColor) {
    case "washed":
      return "#e8d36a";
    case "target":
      return "#3d6bdb";
    case "safe":
      return "#4cd964";
    case "deadly":
      return "#e14b8a";
    case "ice":
      return "#9fd8ff";
    case "sticky":
      return "#7a3fa8";
    case "booster":
      return "#30d5c8";
    case "teleporter":
      return "#a05ce0";
  }
}
