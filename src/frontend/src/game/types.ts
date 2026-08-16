/**
 * Central type contracts for Pyramid Prowler.
 *
 * These types describe the board/pyramid grid, player hop movement, enemies,
 * discs, and levels. They are shared by the game store, the 3D scene, and
 * the HUD so every layer agrees on the same shapes.
 */

/** A cube's color state on the pyramid. */
export type CubeColor =
  | "washed"
  | "target"
  | "safe"
  | "deadly"
  | "ice"
  | "sticky"
  | "booster"
  | "teleporter";

/** A cube's special-block behaviour, independent of its visual color. */
export type SpecialBlock =
  | "none"
  | "ice"
  | "sticky"
  | "teleporter"
  | "booster"
  | "multi";

/**
 * How cubes change color when hopped on — matches the arcade stage rules:
 * one landing, two landings, flip-back off the target, or two landings that
 * also flip when hopped again.
 */
export type ColorRule = "oneHop" | "twoHop" | "flipBack" | "twoHopFlip";

/** The layout shape of a level's board. */
export type BoardShape =
  | "pyramid"
  | "stepped"
  | "chevron"
  | "hourglass"
  | "wings"
  | "trident"
  | "mesa"
  | "spire"
  | "floating"
  | "rotating";

/** Arcade difficulty used to scale spawn rate and enemy hop speed. */
export type Difficulty = "easy" | "normal" | "hard";

/** A single cube's position within the pyramid grid. */
export interface CubePosition {
  /** Column index (x axis). */
  x: number;
  /** Row index (z axis). 0 is the apex row. */
  z: number;
  /** Layer / height index (y axis). y = height - 1 - z. */
  y: number;
}

/** A cube on the board: its position plus its current color state. */
export interface Cube {
  position: CubePosition;
  color: CubeColor;
  /** True once this cube has reached the target color. */
  painted: boolean;
  /** The special-block behaviour of this cube. */
  special: SpecialBlock;
  /** Landings remaining before the cube paints (two-hop rules). */
  paintProgress: number;
  /** Unused (kept so older save shapes stay compatible). */
  decayTimer: number;
  /** Unused (kept so older save shapes stay compatible). */
  cycleIndex: number;
}

/** The full pyramid board: a flat list of cubes plus its dimensions. */
export interface Board {
  /** All cubes in the pyramid, keyed by "x,z,y". */
  cubes: Record<string, Cube>;
  width: number;
  depth: number;
  height: number;
  shape: BoardShape;
}

/**
 * The four hop directions. Mapped to the isometric diagonals:
 * north = up-left, west = up-right, east = down-left, south = down-right.
 */
export type HopDirection = "north" | "south" | "east" | "west";

/** The player's current position and hop state. */
export interface PlayerState {
  position: CubePosition;
  hopping: boolean;
  hopDirection: HopDirection | null;
  hopsRemaining: number;
  hopProgress: number;
  hopFrom: CubePosition;
  hopTo: CubePosition;
  ridingDisc: boolean;
  rideTimer: number;
  /** World-space start of a disc ride (the disc itself). */
  rideFrom: [number, number, number] | null;
  falling: boolean;
  fallProgress: number;
  fallDirection: HopDirection | null;
  stuck: boolean;
  stuckTimer: number;
  /** True while the player cannot hop (after a hit or fall). */
  stunned: boolean;
  stunTimer: number;
  /** Seconds remaining to show the swear balloon. */
  swearTimer: number;
}

/** The kinds of enemy that roam the pyramid. */
export type EnemyKind =
  | "eggSnake"
  | "crawler"
  | "undo"
  | "fallingBall"
  | "drone"
  | "blob";

/** The face of a cube an enemy is crawling on. */
export type EnemyFace = "top" | "north" | "south" | "east" | "west";

/** Roster entries used by the in-stage spawn timer. */
export type SpawnKind =
  | "redBall"
  | "greenBall"
  | "eggSnake"
  | "undo"
  | "crawlerLeft"
  | "crawlerRight";

/** A roaming enemy on the board. */
export interface Enemy {
  id: string;
  kind: EnemyKind;
  position: CubePosition;
  speed: number;
  color: CubeColor;
  hatched: boolean;
  hatchTimer: number;
  frozen: boolean;
  drainAmount: number;
  face: EnemyFace;
  moveTimer: number;
  falling: boolean;
  fallProgress: number;
  frozenTimer: number;
  hopping: boolean;
  hopProgress: number;
  hopFrom: CubePosition;
  hopTo: CubePosition;
  /** True when this hop leaves the pyramid (despawn on land). */
  leaving: boolean;
  /** Side-crawler travel sense: left = Ugg-like, right = Wrongway-like. */
  crawlSense: "left" | "right" | null;
}

/** A collectible power-up sitting on a cube. */
export interface PowerUp {
  id: string;
  position: CubePosition;
  kind: PowerUpKind;
}

export type PowerUpKind =
  | "extraLife"
  | "paintAll"
  | "slowEnemies"
  | "shield"
  | "invincibility"
  | "speedBoost"
  | "colorRadius"
  | "freezeRay"
  | "doubleJump"
  | "magnetDisc";

export type EffectKey =
  | "shield"
  | "slowEnemies"
  | "invincibility"
  | "speedBoost"
  | "colorRadius"
  | "freezeRay"
  | "doubleJump"
  | "magnetDisc";

export type ActivePowerUps = Record<EffectKey, boolean>;

export interface Gem {
  id: string;
  position: CubePosition;
  value: number;
  collected: boolean;
}

/**
 * A floating disc beside the pyramid. Hopping off `anchor` in `direction`
 * rides the disc back to the apex (and can lure a chasing snake off).
 */
export interface DiscSpot {
  id: string;
  anchor: CubePosition;
  direction: HopDirection;
  active: boolean;
  used: boolean;
}

export interface Particle {
  id: string;
  position: CubePosition;
  kind:
    | "colorChange"
    | "hopTrail"
    | "gem"
    | "enemyLure"
    | "paint"
    | "explosion";
  color: string;
  life: number;
  maxLife: number;
}

/** A single level / stage definition. */
export interface Level {
  id: number;
  name: string;
  width: number;
  depth: number;
  height: number;
  shape: BoardShape;
  targetColor: CubeColor;
  colorRule: ColorRule;
  lives: number;
  discs: number;
  difficulty: number;
  enemies: Enemy[];
  powerUps: PowerUp[];
  gems: Gem[];
  discSpots: DiscSpot[];
  /** Seconds between enemy spawns. */
  spawnEvery: number;
  /** Cycling spawn roster for this stage. */
  spawnRoster: SpawnKind[];
  /** Cap on simultaneous enemies. */
  maxEnemies: number;
  /** Seconds between enemy hops. */
  enemyTick: number;
  /** Top-face palette for this stage. */
  washedHex: string;
  midHex: string;
  targetHex: string;
  sideAHex: string;
  sideBHex: string;
}

export type GamePhase =
  | "menu"
  | "playing"
  | "paused"
  | "levelclear"
  | "gameover";

export type Screen = "menu" | "game" | "settings" | "howto" | "leaderboard";

export type CameraMode = "isometric" | "orbit";
