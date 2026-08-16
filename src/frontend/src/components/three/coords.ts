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

/** Look-at target: visual centre of the staircase, slightly toward the front. */
export function pyramidFocus(board: Board): [number, number, number] {
  const h = board.height;
  return [0, h * CUBE_SIZE * 0.38, h * ROW_DEPTH * 0.48];
}

/**
 * Default camera position: in front of the pyramid (+Z) and a little to the
 * right, high enough that every top face reads as a diamond. The old equal
 * +X/+Z rig looked along the side edge, so players had to yaw 90°.
 */
export function pyramidCameraPos(board: Board): [number, number, number] {
  const [fx, fy, fz] = pyramidFocus(board);
  const span = Math.max(board.height, 5);
  return [fx + span * 0.22, fy + span * 0.92, fz + span * 1.38];
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
