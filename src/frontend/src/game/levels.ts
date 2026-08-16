/**
 * Stage definitions for Pyramid Prowler.
 *
 * Classic 7-row pyramid (28 cubes) with arcade-style color rules:
 * hop once, hop twice, flip-back, then two-hop + flip. Enemies are
 * spawned during play from each stage's roster — not pre-placed.
 */
import { placeDiscs } from "./board";
import type {
  ColorRule,
  DiscSpot,
  Enemy,
  Gem,
  Level,
  PowerUp,
  SpawnKind,
} from "./types";

const PYRAMID_HEIGHT = 7;

interface StageSpec {
  id: number;
  name: string;
  colorRule: ColorRule;
  discs: number;
  spawnEvery: number;
  enemyTick: number;
  maxEnemies: number;
  spawnRoster: SpawnKind[];
  washedHex: string;
  midHex: string;
  targetHex: string;
  sideAHex: string;
  sideBHex: string;
}

function makeLevel(spec: StageSpec): Level {
  return {
    id: spec.id,
    name: spec.name,
    width: PYRAMID_HEIGHT,
    depth: PYRAMID_HEIGHT,
    height: PYRAMID_HEIGHT,
    shape: "pyramid",
    targetColor: "target",
    colorRule: spec.colorRule,
    lives: 3,
    discs: spec.discs,
    difficulty: 1,
    enemies: [] as Enemy[],
    powerUps: [] as PowerUp[],
    gems: [] as Gem[],
    discSpots: placeDiscs(PYRAMID_HEIGHT, spec.discs) as DiscSpot[],
    spawnEvery: spec.spawnEvery,
    spawnRoster: spec.spawnRoster,
    maxEnemies: spec.maxEnemies,
    enemyTick: spec.enemyTick,
    washedHex: spec.washedHex,
    midHex: spec.midHex,
    targetHex: spec.targetHex,
    sideAHex: spec.sideAHex,
    sideBHex: spec.sideBHex,
  };
}

const STAGES: StageSpec[] = [
  {
    id: 1,
    name: "The First Glow",
    colorRule: "oneHop",
    discs: 2,
    spawnEvery: 4.2,
    enemyTick: 0.95,
    maxEnemies: 2,
    spawnRoster: ["redBall", "redBall", "greenBall"],
    washedHex: "#f0d24a",
    midHex: "#f0d24a",
    targetHex: "#3d6bdb",
    sideAHex: "#c45a2a",
    sideBHex: "#6b2d7a",
  },
  {
    id: 2,
    name: "Purple Hatchling",
    colorRule: "oneHop",
    discs: 2,
    spawnEvery: 3.6,
    enemyTick: 0.88,
    maxEnemies: 3,
    spawnRoster: ["redBall", "eggSnake", "redBall", "greenBall"],
    washedHex: "#f0d24a",
    midHex: "#f0d24a",
    targetHex: "#2f9e8f",
    sideAHex: "#c45a2a",
    sideBHex: "#5a2d7a",
  },
  {
    id: 3,
    name: "Mischief Green",
    colorRule: "oneHop",
    discs: 2,
    spawnEvery: 3.3,
    enemyTick: 0.82,
    maxEnemies: 3,
    spawnRoster: ["redBall", "eggSnake", "undo", "greenBall"],
    washedHex: "#f07a9a",
    midHex: "#f07a9a",
    targetHex: "#3d6bdb",
    sideAHex: "#8a3a5a",
    sideBHex: "#3a3a7a",
  },
  {
    id: 4,
    name: "Sidewinders",
    colorRule: "oneHop",
    discs: 2,
    spawnEvery: 3.1,
    enemyTick: 0.78,
    maxEnemies: 4,
    spawnRoster: [
      "redBall",
      "eggSnake",
      "crawlerLeft",
      "crawlerRight",
      "greenBall",
    ],
    washedHex: "#7ad0f0",
    midHex: "#7ad0f0",
    targetHex: "#e05a2a",
    sideAHex: "#2a6a8a",
    sideBHex: "#5a2d6a",
  },
  {
    id: 5,
    name: "Two-Tone Trouble",
    colorRule: "twoHop",
    discs: 2,
    spawnEvery: 3.0,
    enemyTick: 0.74,
    maxEnemies: 4,
    spawnRoster: ["redBall", "eggSnake", "undo", "crawlerLeft", "greenBall"],
    washedHex: "#f0d24a",
    midHex: "#e07a2a",
    targetHex: "#3d6bdb",
    sideAHex: "#c45a2a",
    sideBHex: "#6b2d7a",
  },
  {
    id: 6,
    name: "Second Coat",
    colorRule: "twoHop",
    discs: 2,
    spawnEvery: 2.8,
    enemyTick: 0.7,
    maxEnemies: 4,
    spawnRoster: [
      "redBall",
      "eggSnake",
      "undo",
      "crawlerRight",
      "redBall",
      "greenBall",
    ],
    washedHex: "#f07a9a",
    midHex: "#c05080",
    targetHex: "#3dcc8a",
    sideAHex: "#8a3a5a",
    sideBHex: "#3a3a7a",
  },
  {
    id: 7,
    name: "Flip-Back Folly",
    colorRule: "flipBack",
    discs: 2,
    spawnEvery: 2.7,
    enemyTick: 0.66,
    maxEnemies: 4,
    spawnRoster: [
      "redBall",
      "eggSnake",
      "undo",
      "crawlerLeft",
      "crawlerRight",
      "greenBall",
    ],
    washedHex: "#8ad060",
    midHex: "#8ad060",
    targetHex: "#7a3fa8",
    sideAHex: "#3a7a40",
    sideBHex: "#4a2a6a",
  },
  {
    id: 8,
    name: "Don't Step Twice",
    colorRule: "flipBack",
    discs: 3,
    spawnEvery: 2.5,
    enemyTick: 0.62,
    maxEnemies: 5,
    spawnRoster: [
      "redBall",
      "eggSnake",
      "undo",
      "crawlerLeft",
      "redBall",
      "greenBall",
    ],
    washedHex: "#f0d24a",
    midHex: "#f0d24a",
    targetHex: "#e14b8a",
    sideAHex: "#c45a2a",
    sideBHex: "#6b2d7a",
  },
  {
    id: 9,
    name: "Double Flip",
    colorRule: "twoHopFlip",
    discs: 3,
    spawnEvery: 2.4,
    enemyTick: 0.58,
    maxEnemies: 5,
    spawnRoster: [
      "redBall",
      "eggSnake",
      "undo",
      "crawlerLeft",
      "crawlerRight",
      "greenBall",
    ],
    washedHex: "#7ad0f0",
    midHex: "#3d6bdb",
    targetHex: "#f0d24a",
    sideAHex: "#2a6a8a",
    sideBHex: "#5a2d6a",
  },
  {
    id: 10,
    name: "Rush Hour",
    colorRule: "twoHopFlip",
    discs: 3,
    spawnEvery: 2.2,
    enemyTick: 0.54,
    maxEnemies: 5,
    spawnRoster: [
      "redBall",
      "eggSnake",
      "undo",
      "crawlerLeft",
      "redBall",
      "crawlerRight",
      "greenBall",
    ],
    washedHex: "#f07a9a",
    midHex: "#e05a2a",
    targetHex: "#3d6bdb",
    sideAHex: "#8a3a5a",
    sideBHex: "#3a3a7a",
  },
  {
    id: 11,
    name: "Apex Storm",
    colorRule: "twoHop",
    discs: 3,
    spawnEvery: 2.0,
    enemyTick: 0.5,
    maxEnemies: 6,
    spawnRoster: [
      "redBall",
      "eggSnake",
      "undo",
      "crawlerLeft",
      "crawlerRight",
      "redBall",
      "greenBall",
    ],
    washedHex: "#c8c0e8",
    midHex: "#7a3fa8",
    targetHex: "#30d5c8",
    sideAHex: "#5a4a8a",
    sideBHex: "#2a3a6a",
  },
  {
    id: 12,
    name: "The Final Glow",
    colorRule: "twoHopFlip",
    discs: 4,
    spawnEvery: 1.85,
    enemyTick: 0.46,
    maxEnemies: 6,
    spawnRoster: [
      "redBall",
      "eggSnake",
      "undo",
      "crawlerLeft",
      "redBall",
      "crawlerRight",
      "undo",
      "greenBall",
    ],
    washedHex: "#f0d24a",
    midHex: "#3dcc8a",
    targetHex: "#e14b8a",
    sideAHex: "#c45a2a",
    sideBHex: "#6b2d7a",
  },
];

export const LEVELS: Level[] = STAGES.map(makeLevel);

/** Look up a stage by 1-based id. Past the last stage, recycle faster. */
export function getLevel(id: number): Level {
  const safeId = Math.max(1, id);
  const index = (safeId - 1) % LEVELS.length;
  const cycle = Math.floor((safeId - 1) / LEVELS.length);
  const base = LEVELS[index];
  if (cycle === 0) return { ...base, id: safeId };
  return {
    ...base,
    id: safeId,
    name: `${base.name} +${cycle}`,
    spawnEvery: Math.max(1.2, base.spawnEvery - cycle * 0.15),
    enemyTick: Math.max(0.32, base.enemyTick - cycle * 0.04),
    difficulty: base.difficulty + cycle * 0.25,
    discSpots: placeDiscs(base.height, base.discs),
  };
}

export const TOTAL_LEVELS = LEVELS.length;
