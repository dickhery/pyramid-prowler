import { create } from "zustand";
import { advanceLevel, hop, startLevel, update } from "./engine";
import type {
  ActivePowerUps,
  Board,
  CameraMode,
  CubeColor,
  Difficulty,
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

export const STARTING_LIVES = 3;
export const STARTING_DISCS = 2;
export const STARTING_SCORE = 0;
export const STARTING_LEVEL = 1;

export interface GameState {
  screen: Screen;
  phase: GamePhase;
  level: Level;
  levelNumber: number;
  board: Board;
  player: PlayerState;
  enemies: Enemy[];
  powerUpItems: PowerUp[];
  gems: Gem[];
  discSpots: DiscSpot[];
  particles: Particle[];
  effectTimers: Record<EffectKey, number>;
  shake: number;
  message: string | null;
  score: number;
  lives: number;
  discs: number;
  targetColor: CubeColor;
  combo: number;
  comboTimer: number;
  powerUps: ActivePowerUps;
  cameraMode: CameraMode;
  spawnTimer: number;
  spawnIndex: number;
  extraLifeAwarded: boolean;
  difficulty: Difficulty;
  colorBlind: boolean;

  goToMenu: () => void;
  goToGame: () => void;
  goToSettings: () => void;
  goToHowTo: () => void;

  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  clearLevel: () => void;
  gameOver: () => void;
  backToMenu: () => void;

  startLevel: (levelNumber: number) => void;
  nextLevel: () => void;
  hop: (direction: HopDirection) => void;
  update: (deltaTime: number) => void;

  addScore: (points: number) => void;
  loseLife: () => void;
  spendDisc: () => void;
  addDiscs: (amount: number) => void;
  setCombo: (combo: number) => void;
  setTargetColor: (color: CubeColor) => void;
  setPowerUp: (key: keyof ActivePowerUps, value: boolean) => void;
  setCameraMode: (mode: CameraMode) => void;
  setDifficulty: (difficulty: Difficulty) => void;
  setColorBlind: (value: boolean) => void;
  resetSession: () => void;
}

const seed = startLevel(STARTING_LEVEL) as GameState;

export const useGameStore = create<GameState>((set) => ({
  ...seed,
  screen: "menu",
  phase: "menu",
  score: STARTING_SCORE,
  cameraMode: "isometric",
  spawnTimer: 0,
  spawnIndex: 0,
  extraLifeAwarded: false,
  difficulty: "normal",
  colorBlind: false,

  goToMenu: () => set({ screen: "menu", phase: "menu" }),
  goToGame: () => set({ screen: "game" }),
  goToSettings: () => set({ screen: "settings" }),
  goToHowTo: () => set({ screen: "howto" }),

  startGame: () =>
    set((s) => ({
      screen: "game",
      score: STARTING_SCORE,
      extraLifeAwarded: false,
      ...startLevel(STARTING_LEVEL, {
        lives: STARTING_LIVES,
        extraLifeAwarded: false,
      }),
      difficulty: s.difficulty,
      colorBlind: s.colorBlind,
      cameraMode: s.cameraMode,
    })),
  pauseGame: () => set({ phase: "paused" }),
  resumeGame: () => set({ phase: "playing" }),
  clearLevel: () => set({ phase: "levelclear" }),
  gameOver: () => set({ phase: "gameover" }),
  backToMenu: () => set({ screen: "menu", phase: "menu" }),

  startLevel: (levelNumber) =>
    set((s) =>
      startLevel(levelNumber, {
        lives: s.lives,
        extraLifeAwarded: s.extraLifeAwarded,
      }),
    ),
  nextLevel: () =>
    set((s) => ({
      ...advanceLevel(s),
      score: s.score,
    })),
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
  setDifficulty: (difficulty) => set({ difficulty }),
  setColorBlind: (colorBlind) => set({ colorBlind }),
  resetSession: () =>
    set((s) => ({
      ...startLevel(STARTING_LEVEL, {
        lives: STARTING_LIVES,
        extraLifeAwarded: false,
      }),
      screen: "menu",
      phase: "menu",
      score: STARTING_SCORE,
      extraLifeAwarded: false,
      difficulty: s.difficulty,
      colorBlind: s.colorBlind,
      cameraMode: s.cameraMode,
    })),
}));
