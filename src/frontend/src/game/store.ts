import { create } from "zustand";
import { hop, startLevel, update } from "./engine";
import type {
  ActivePowerUps,
  Board,
  CameraMode,
  CubeColor,
  DiscSpot,
  EffectKey,
  Enemy,
  GamePhase,
  Gem,
  HopDirection,
  Level,
  Particle,
  PlayerState,
  PowerUp,
  Screen,
} from "./types";

/** The default starting values for a fresh game session. */
export const STARTING_LIVES = 3;
export const STARTING_DISCS = 24;
export const STARTING_SCORE = 0;
export const STARTING_LEVEL = 1;

/** The full shape of the game state. */
export interface GameState {
  /** Which top-level screen is currently shown. */
  screen: Screen;
  /** The current game phase within the game screen. */
  phase: GamePhase;
  /** The current level definition. */
  level: Level;
  /** The 1-based number of the current level. */
  levelNumber: number;
  /** The pyramid board of cubes. */
  board: Board;
  /** The player's position and hop/fall/ride state. */
  player: PlayerState;
  /** The roaming enemies on the board. */
  enemies: Enemy[];
  /** The collectible power-ups sitting on cubes. */
  powerUpItems: PowerUp[];
  /** The collectible gems on the board. */
  gems: Gem[];
  /** The floating discs that transport the player back to the top. */
  discSpots: DiscSpot[];
  /** Transient visual effects queued for the rendering layer. */
  particles: Particle[];
  /** Remaining seconds for each timed power-up effect. */
  effectTimers: Record<EffectKey, number>;
  /** Remaining screen-shake intensity (seconds). */
  shake: number;
  /** A transient status message shown to the player. */
  message: string | null;
  /** The player's current score. */
  score: number;
  /** Lives remaining. */
  lives: number;
  /** Discs (floating-disc rides) remaining. */
  discs: number;
  /** The color every cube must reach to clear the level. */
  targetColor: CubeColor;
  /** Current combo multiplier. */
  combo: number;
  /** Seconds until the combo resets to zero. */
  comboTimer: number;
  /** Active power-up effects. */
  powerUps: ActivePowerUps;
  /** The active camera mode. */
  cameraMode: CameraMode;

  // Navigation
  goToMenu: () => void;
  goToGame: () => void;
  goToSettings: () => void;

  // Phase transitions
  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  clearLevel: () => void;
  gameOver: () => void;
  backToMenu: () => void;

  // Gameplay
  startLevel: (levelNumber: number) => void;
  nextLevel: () => void;
  hop: (direction: HopDirection) => void;
  update: (deltaTime: number) => void;

  // Simple mutations (kept for compatibility with existing consumers)
  addScore: (points: number) => void;
  loseLife: () => void;
  spendDisc: () => void;
  addDiscs: (amount: number) => void;
  setCombo: (combo: number) => void;
  setTargetColor: (color: CubeColor) => void;
  setPowerUp: (key: keyof ActivePowerUps, value: boolean) => void;
  setCameraMode: (mode: CameraMode) => void;
  resetSession: () => void;
}

/** Seed the default game fields from level 1. */
const seed = startLevel(STARTING_LEVEL) as GameState;

export const useGameStore = create<GameState>((set) => ({
  ...seed,
  screen: "menu",
  phase: "menu",
  score: STARTING_SCORE,
  cameraMode: "isometric",

  goToMenu: () => set({ screen: "menu", phase: "menu" }),
  goToGame: () => set({ screen: "game" }),
  goToSettings: () => set({ screen: "settings" }),

  startGame: () =>
    set(() => ({
      screen: "game",
      score: STARTING_SCORE,
      ...startLevel(STARTING_LEVEL),
    })),
  pauseGame: () => set({ phase: "paused" }),
  resumeGame: () => set({ phase: "playing" }),
  clearLevel: () => set({ phase: "levelclear" }),
  gameOver: () => set({ phase: "gameover" }),
  backToMenu: () => set({ screen: "menu", phase: "menu" }),

  startLevel: (levelNumber) => set(() => startLevel(levelNumber)),
  nextLevel: () => set((s) => startLevel(s.levelNumber + 1)),
  hop: (direction) => set((s) => hop(s, direction)),
  update: (deltaTime) => set((s) => update(s, deltaTime)),

  addScore: (points) => set((s) => ({ score: s.score + points })),
  loseLife: () => set((s) => ({ lives: Math.max(0, s.lives - 1) })),
  spendDisc: () => set((s) => ({ discs: Math.max(0, s.discs - 1) })),
  addDiscs: (amount) => set((s) => ({ discs: s.discs + amount })),
  setCombo: (combo) => set({ combo }),
  setTargetColor: (targetColor) => set({ targetColor }),
  setPowerUp: (key, value) =>
    set((s) => ({ powerUps: { ...s.powerUps, [key]: value } })),
  setCameraMode: (cameraMode) => set({ cameraMode }),
  resetSession: () =>
    set(() => ({
      ...startLevel(STARTING_LEVEL),
      screen: "menu",
      phase: "menu",
      score: STARTING_SCORE,
    })),
}));
