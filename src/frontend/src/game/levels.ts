/**
 * Level definitions for Pyramid Prowler.
 *
 * A set of escalating levels with new board layouts and color rules every few
 * levels. Each level defines its board shape, target color, color rule, enemy
 * spawns, disc count, and difficulty.
 */
import type {
  BoardShape,
  ColorRule,
  CubeColor,
  DiscSpot,
  Enemy,
  Gem,
  Level,
  PowerUp,
} from "./types";

/** A compact builder for enemy spawns. */
function enemy(
  id: string,
  kind: Enemy["kind"],
  x: number,
  z: number,
  y: number,
  speed: number,
  color: CubeColor,
): Enemy {
  return {
    id,
    kind,
    position: { x, z, y },
    speed,
    color,
    hatched: false,
    hatchTimer: 0,
    frozen: false,
    drainAmount: 1,
    face: "top",
    moveTimer: 0,
    falling: false,
    frozenTimer: 0,
  };
}

/** A compact builder for power-up spawns. */
function powerUp(
  id: string,
  kind: PowerUp["kind"],
  x: number,
  z: number,
  y: number,
): PowerUp {
  return { id, kind, position: { x, z, y } };
}

/** A compact builder for gem spawns. */
function gem(id: string, x: number, z: number, y: number, value: number): Gem {
  return { id, position: { x, z, y }, value, collected: false };
}

/** A compact builder for floating disc spawns. */
function disc(id: string, x: number, z: number, y: number): DiscSpot {
  return { id, position: { x, z, y }, active: false };
}

/** A compact builder for a full level. */
function level(
  id: number,
  name: string,
  height: number,
  shape: BoardShape,
  targetColor: CubeColor,
  colorRule: ColorRule,
  discs: number,
  difficulty: number,
  enemies: Enemy[],
  powerUps: PowerUp[],
  gems: Gem[],
  discSpots: DiscSpot[],
): Level {
  return {
    id,
    name,
    width: height,
    depth: height,
    height,
    shape,
    targetColor,
    colorRule,
    lives: 3,
    discs,
    difficulty,
    enemies,
    powerUps,
    gems,
    discSpots,
  };
}

/** The full ordered list of levels in Classic Arcade mode. */
export const LEVELS: Level[] = [
  level(
    1,
    "The Washed-Out Steps",
    5,
    "pyramid",
    "target",
    "oneHop",
    24,
    1,
    [],
    [powerUp("p1", "extraLife", 1, 1, 3)],
    [gem("g1", 2, 2, 2, 100)],
    [disc("d1", 2, 4, 0)],
  ),
  level(
    2,
    "First Hatchlings",
    5,
    "pyramid",
    "target",
    "oneHop",
    22,
    1.2,
    [enemy("e1", "eggSnake", 3, 3, 1, 1, "deadly")],
    [powerUp("p1", "shield", 1, 1, 3)],
    [gem("g1", 2, 2, 2, 100), gem("g2", 1, 1, 3, 150)],
    [disc("d1", 2, 4, 0)],
  ),
  level(
    3,
    "Two-Tone Trouble",
    5,
    "pyramid",
    "target",
    "twoHop",
    20,
    1.4,
    [
      enemy("e1", "eggSnake", 3, 3, 1, 1, "deadly"),
      enemy("e2", "crawler", 1, 3, 1, 1, "deadly"),
    ],
    [powerUp("p1", "invincibility", 1, 1, 3)],
    [gem("g1", 2, 2, 2, 100), gem("g2", 1, 1, 3, 150)],
    [disc("d1", 2, 4, 0)],
  ),
  level(
    4,
    "Stepped Heights",
    6,
    "stepped",
    "target",
    "twoHop",
    18,
    1.6,
    [
      enemy("e1", "eggSnake", 4, 4, 1, 1, "deadly"),
      enemy("e2", "drone", 2, 3, 2, 2, "deadly"),
    ],
    [powerUp("p1", "speedBoost", 1, 1, 4), powerUp("p2", "extraLife", 2, 2, 3)],
    [gem("g1", 2, 2, 3, 150), gem("g2", 1, 1, 4, 200)],
    [disc("d1", 2, 5, 0), disc("d2", 3, 5, 0)],
  ),
  level(
    5,
    "Flip-Back Folly",
    6,
    "stepped",
    "target",
    "flipBack",
    16,
    1.8,
    [
      enemy("e1", "eggSnake", 4, 4, 1, 1, "deadly"),
      enemy("e2", "drone", 2, 3, 2, 2, "deadly"),
      enemy("e3", "undo", 1, 4, 1, 1, "safe"),
    ],
    [powerUp("p1", "freezeRay", 1, 1, 4), powerUp("p2", "shield", 2, 2, 3)],
    [gem("g1", 2, 2, 3, 150), gem("g2", 1, 1, 4, 200), gem("g3", 3, 3, 2, 250)],
    [disc("d1", 2, 5, 0), disc("d2", 3, 5, 0)],
  ),
  level(
    6,
    "Floating Gardens",
    6,
    "floating",
    "target",
    "flipBack",
    14,
    2,
    [
      enemy("e1", "eggSnake", 4, 4, 1, 1, "deadly"),
      enemy("e2", "drone", 2, 3, 2, 2, "deadly"),
      enemy("e3", "undo", 1, 4, 1, 1, "safe"),
      enemy("e4", "fallingBall", 3, 3, 2, 1, "deadly"),
    ],
    [
      powerUp("p1", "colorRadius", 1, 1, 4),
      powerUp("p2", "doubleJump", 2, 2, 3),
    ],
    [gem("g1", 2, 2, 3, 150), gem("g2", 1, 1, 4, 200), gem("g3", 3, 3, 2, 250)],
    [disc("d1", 2, 5, 0), disc("d2", 3, 5, 0), disc("d3", 1, 5, 0)],
  ),
  level(
    7,
    "Rotating Rings",
    7,
    "rotating",
    "target",
    "timedDecay",
    12,
    2.2,
    [
      enemy("e1", "eggSnake", 5, 5, 1, 1, "deadly"),
      enemy("e2", "drone", 2, 4, 2, 2, "deadly"),
      enemy("e3", "undo", 1, 5, 1, 1, "safe"),
      enemy("e4", "fallingBall", 3, 3, 3, 1, "deadly"),
      enemy("e5", "blob", 2, 5, 1, 1, "deadly"),
    ],
    [
      powerUp("p1", "magnetDisc", 1, 1, 5),
      powerUp("p2", "invincibility", 2, 2, 4),
    ],
    [gem("g1", 2, 2, 4, 200), gem("g2", 1, 1, 5, 250), gem("g3", 3, 3, 3, 300)],
    [disc("d1", 2, 6, 0), disc("d2", 3, 6, 0), disc("d3", 1, 6, 0)],
  ),
  level(
    8,
    "The Great Drain",
    7,
    "rotating",
    "target",
    "timedDecay",
    10,
    2.4,
    [
      enemy("e1", "eggSnake", 5, 5, 1, 1, "deadly"),
      enemy("e2", "drone", 2, 4, 2, 2, "deadly"),
      enemy("e3", "undo", 1, 5, 1, 1, "safe"),
      enemy("e4", "fallingBall", 3, 3, 3, 1, "deadly"),
      enemy("e5", "blob", 2, 5, 1, 1, "deadly"),
      enemy("e6", "drone", 3, 4, 2, 2, "deadly"),
    ],
    [
      powerUp("p1", "freezeRay", 1, 1, 5),
      powerUp("p2", "extraLife", 2, 2, 4),
      powerUp("p3", "speedBoost", 3, 3, 3),
    ],
    [
      gem("g1", 2, 2, 4, 200),
      gem("g2", 1, 1, 5, 250),
      gem("g3", 3, 3, 3, 300),
      gem("g4", 0, 1, 5, 400),
    ],
    [disc("d1", 2, 6, 0), disc("d2", 3, 6, 0), disc("d3", 1, 6, 0)],
  ),
  level(
    9,
    "Apex Assault",
    8,
    "pyramid",
    "target",
    "twoHop",
    8,
    2.6,
    [
      enemy("e1", "eggSnake", 6, 6, 1, 1, "deadly"),
      enemy("e2", "drone", 2, 5, 2, 2, "deadly"),
      enemy("e3", "undo", 1, 6, 1, 1, "safe"),
      enemy("e4", "fallingBall", 3, 3, 4, 1, "deadly"),
      enemy("e5", "blob", 2, 6, 1, 1, "deadly"),
      enemy("e6", "drone", 3, 5, 2, 2, "deadly"),
      enemy("e7", "crawler", 2, 4, 3, 1, "deadly"),
    ],
    [
      powerUp("p1", "invincibility", 1, 1, 6),
      powerUp("p2", "magnetDisc", 2, 2, 5),
      powerUp("p3", "doubleJump", 3, 3, 4),
    ],
    [
      gem("g1", 2, 2, 5, 250),
      gem("g2", 1, 1, 6, 300),
      gem("g3", 3, 3, 4, 350),
      gem("g4", 0, 1, 6, 500),
    ],
    [disc("d1", 2, 7, 0), disc("d2", 3, 7, 0), disc("d3", 1, 7, 0)],
  ),
  level(
    10,
    "The Final Glow",
    8,
    "floating",
    "target",
    "timedDecay",
    6,
    3,
    [
      enemy("e1", "eggSnake", 6, 6, 1, 1, "deadly"),
      enemy("e2", "drone", 2, 5, 2, 2, "deadly"),
      enemy("e3", "undo", 1, 6, 1, 1, "safe"),
      enemy("e4", "fallingBall", 3, 3, 4, 1, "deadly"),
      enemy("e5", "blob", 2, 6, 1, 1, "deadly"),
      enemy("e6", "drone", 3, 5, 2, 2, "deadly"),
      enemy("e7", "crawler", 2, 4, 3, 1, "deadly"),
      enemy("e8", "blob", 1, 5, 2, 1, "deadly"),
    ],
    [
      powerUp("p1", "invincibility", 1, 1, 6),
      powerUp("p2", "freezeRay", 2, 2, 5),
      powerUp("p3", "extraLife", 3, 3, 4),
    ],
    [
      gem("g1", 2, 2, 5, 250),
      gem("g2", 1, 1, 6, 300),
      gem("g3", 3, 3, 4, 350),
      gem("g4", 0, 1, 6, 500),
    ],
    [disc("d1", 2, 7, 0), disc("d2", 3, 7, 0), disc("d3", 1, 7, 0)],
  ),
];

/** Look up a level by its 1-based id, wrapping past the final level. */
export function getLevel(id: number): Level {
  const index = Math.min(Math.max(id - 1, 0), LEVELS.length - 1);
  return LEVELS[index];
}

/** The total number of levels in the game. */
export const TOTAL_LEVELS = LEVELS.length;
