/**
 * Central type contracts for Pyramid Prowler.
 *
 * These types describe the board/pyramid grid, player hop movement, enemies,
 * power-ups, discs, gems, and levels. They are shared by the game store, the
 * 3D scene, and the HUD so every layer agrees on the same shapes.
 */

/** A cube's color state on the pyramid. */
export type CubeColor =
  | "washed" // pale, needs painting
  | "target" // matches the level's target color
  | "safe" // green — safe to land on
  | "deadly" // magenta/red — costs a life
  | "ice" // slippery — slides an extra hop
  | "sticky" // sticky — sticks for a beat
  | "booster" // launches the player
  | "teleporter"; // warps the player

/** A cube's special-block behaviour, independent of its visual color. */
export type SpecialBlock =
  | "none"
  | "ice" // slides an extra hop
  | "sticky" // sticks for a beat
  | "teleporter" // warps to another cube
  | "booster" // launches an extra hop
  | "multi"; // cycles through colors

/** The escalating color rule that governs how cubes get painted. */
export type ColorRule =
  | "oneHop" // one landing paints a cube
  | "twoHop" // two landings paint a cube
  | "flipBack" // re-stepping a painted cube unpaints it
  | "timedDecay"; // painted cubes fade back over time

/** The layout shape of a level's board. */
export type BoardShape = "pyramid" | "stepped" | "floating" | "rotating";

/** A single cube's position within the pyramid grid. */
export interface CubePosition {
  /** Column index (x axis). */
  x: number;
  /** Row index (z axis). */
  z: number;
  /** Layer / height index (y axis). */
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
  /** For twoHop rule: landings remaining before the cube paints. */
  paintProgress: number;
  /** For timedDecay rule: seconds before a painted cube fades back. */
  decayTimer: number;
  /** For multi special: current color-cycle index. */
  cycleIndex: number;
}

/** The full pyramid board: a flat list of cubes plus its dimensions. */
export interface Board {
  /** All cubes in the pyramid, keyed by "x,z,y". */
  cubes: Record<string, Cube>;
  /** Number of columns along the x axis. */
  width: number;
  /** Number of rows along the z axis. */
  depth: number;
  /** Number of layers along the y axis. */
  height: number;
  /** The layout shape used to build this board. */
  shape: BoardShape;
}

/** The four hop directions a player can move. */
export type HopDirection = "north" | "south" | "east" | "west";

/** The player's current position and hop state. */
export interface PlayerState {
  position: CubePosition;
  /** True while a hop animation is in flight. */
  hopping: boolean;
  /** The direction of the current hop, if any. */
  hopDirection: HopDirection | null;
  /** Number of hops remaining in a multi-hop (booster/ice) move. */
  hopsRemaining: number;
  /** 0..1 progress of the current hop animation. */
  hopProgress: number;
  /** The position the current hop started from (for interpolation). */
  hopFrom: CubePosition;
  /** The position the current hop is landing on. */
  hopTo: CubePosition;
  /** True while the player is being transported by a floating disc. */
  ridingDisc: boolean;
  /** Seconds remaining while riding a disc back to the top. */
  rideTimer: number;
  /** True while the player is falling off the edge of the pyramid. */
  falling: boolean;
  /** 0..1 progress of the fall animation. */
  fallProgress: number;
  /** True while the player is stuck on a sticky cube. */
  stuck: boolean;
  /** Seconds remaining while stuck. */
  stuckTimer: number;
}

/** The kinds of enemy that roam the pyramid. */
export type EnemyKind =
  | "eggSnake" // egg that hatches into a chasing snake
  | "crawler" // side-crawling face enemy
  | "undo" // green creature that reverses cube colors
  | "fallingBall" // red deadly / green freezes enemies
  | "drone" // modern chasing drone
  | "blob"; // color-draining blob

/** The face of a cube an enemy is crawling on. */
export type EnemyFace = "top" | "north" | "south" | "east" | "west";

/** A roaming enemy on the board. */
export interface Enemy {
  id: string;
  kind: EnemyKind;
  position: CubePosition;
  /** How many hops the enemy takes per player hop. */
  speed: number;
  /** The color used to render the enemy. */
  color: CubeColor;
  /** For eggSnake: true once the egg has hatched into a snake. */
  hatched: boolean;
  /** For eggSnake: seconds until the egg hatches. */
  hatchTimer: number;
  /** For fallingBall: green (freezes enemies) vs red (deadly). */
  frozen: boolean;
  /** For blob: how much color it drains per step. */
  drainAmount: number;
  /** For crawler: which cube face it is crawling on. */
  face: EnemyFace;
  /** Movement timer accumulator (enemies move on a tick). */
  moveTimer: number;
  /** True while the enemy is falling off a disc (for bonus points). */
  falling: boolean;
  /** Seconds remaining while frozen by a freeze ray / green ball. */
  frozenTimer: number;
}

/** A collectible power-up sitting on a cube. */
export interface PowerUp {
  id: string;
  position: CubePosition;
  kind: PowerUpKind;
}

/** The kinds of power-up a player can collect. */
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

/** The keys of every timed power-up effect. */
export type EffectKey =
  | "shield"
  | "slowEnemies"
  | "invincibility"
  | "speedBoost"
  | "colorRadius"
  | "freezeRay"
  | "doubleJump"
  | "magnetDisc";

/** The active power-up effects currently applied to the player. */
export type ActivePowerUps = Record<EffectKey, boolean>;

/** A collectible gem that boosts the score multiplier. */
export interface Gem {
  id: string;
  position: CubePosition;
  /** Base points awarded when collected. */
  value: number;
  /** True once collected (removed from the board). */
  collected: boolean;
}

/** A floating disc that transports the player back to the top. */
export interface DiscSpot {
  id: string;
  position: CubePosition;
  /** True while the player is riding this disc. */
  active: boolean;
}

/** A transient visual effect queued for the rendering layer. */
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
  /** CSS color used to tint the particle. */
  color: string;
  /** Seconds remaining before the particle disappears. */
  life: number;
  /** Total lifetime used for fade-out interpolation. */
  maxLife: number;
}

/** A single level definition. */
export interface Level {
  id: number;
  name: string;
  /** Board dimensions for this level. */
  width: number;
  depth: number;
  height: number;
  /** The layout shape of the board. */
  shape: BoardShape;
  /** The color every cube must reach to clear the level. */
  targetColor: CubeColor;
  /** The color rule governing how cubes get painted. */
  colorRule: ColorRule;
  /** Number of lives granted at the start of the level. */
  lives: number;
  /** Number of discs (hops) available for this level. */
  discs: number;
  /** Relative difficulty used to scale enemy speed and spawns. */
  difficulty: number;
  /** Enemies that spawn on this level. */
  enemies: Enemy[];
  /** Power-ups that spawn on this level. */
  powerUps: PowerUp[];
  /** Gems that spawn on this level. */
  gems: Gem[];
  /** Floating discs that transport the player back to the top. */
  discSpots: DiscSpot[];
}

/** The overall game phase. */
export type GamePhase =
  | "menu"
  | "playing"
  | "paused"
  | "levelclear"
  | "gameover";

/** The top-level screen shown in the app shell. */
export type Screen = "menu" | "game" | "settings";

/** The active camera mode for the 3D scene. */
export type CameraMode = "isometric" | "orbit";
