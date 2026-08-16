import type { Board, CubeColor, CubePosition } from "@/game/types";

/** The edge length of a single cube in world units. */
export const CUBE_SIZE = 0.92;

/**
 * Convert a grid cube position into a world-space [x, y, z] triple.
 * The board is centred on the origin and each cube's y is its layer index,
 * so the cube centre sits at `y + CUBE_SIZE / 2`.
 */
export function cubeCenter(
  board: Board,
  pos: CubePosition,
): [number, number, number] {
  return [
    pos.x - (board.width - 1) / 2,
    pos.y + CUBE_SIZE / 2,
    pos.z - (board.depth - 1) / 2,
  ];
}

/** Map a cube color state to a CSS color string for the 3D material. */
export function colorFor(cubeColor: CubeColor): string {
  switch (cubeColor) {
    case "washed":
      return "#d9d6e6";
    case "target":
      return "#30d5c8";
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
