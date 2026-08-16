import { useEffect, useRef } from "react";
import { arcadeAudio } from "./audio";
import { remainingCubes } from "./board";
import { useGameStore } from "./store";

/**
 * Watch the zustand store and play arcade cues. Kept out of the pure
 * engine so the game loop stays deterministic and cycle-free.
 */
export function useGameAudio(): void {
  const prev = useRef({
    hopping: false,
    falling: false,
    riding: false,
    swear: 0,
    lives: 3,
    enemies: 0,
    hatched: 0,
    remaining: 99,
    phase: "menu" as string,
    message: null as string | null,
    score: 0,
  });

  useEffect(() => {
    const unsub = useGameStore.subscribe((state) => {
      const p = prev.current;
      if (state.player.hopping && !p.hopping) arcadeAudio.play("hop");
      if (!state.player.hopping && p.hopping && !state.player.falling) {
        arcadeAudio.play("land");
      }
      if (state.player.falling && !p.falling) arcadeAudio.play("fall");
      if (state.player.ridingDisc && !p.riding) arcadeAudio.play("disc");
      if (state.player.swearTimer > p.swear && state.player.swearTimer > 0.8) {
        arcadeAudio.play("hit");
      }
      if (state.lives > p.lives) arcadeAudio.play("extraLife");
      if (state.enemies.length > p.enemies) arcadeAudio.play("spawn");
      const hatched = state.enemies.filter(
        (e) => e.kind === "eggSnake" && e.hatched,
      ).length;
      if (hatched > p.hatched) arcadeAudio.play("hatch");
      const left = remainingCubes(state.board);
      if (left < p.remaining && state.phase === "playing") {
        arcadeAudio.play("paint");
      }
      if (state.phase === "levelclear" && p.phase !== "levelclear") {
        arcadeAudio.play("clear");
      }
      if (state.phase === "gameover" && p.phase !== "gameover") {
        arcadeAudio.play("gameover");
      }
      if (state.message === "Freeze!" && p.message !== "Freeze!") {
        arcadeAudio.play("freeze");
      }
      if (state.message === "+300" && p.message !== "+300") {
        arcadeAudio.play("catch");
      }
      if (
        state.message?.includes("snake dove") &&
        !p.message?.includes("snake dove")
      ) {
        arcadeAudio.play("lure");
      }

      prev.current = {
        hopping: state.player.hopping,
        falling: state.player.falling,
        riding: state.player.ridingDisc,
        swear: state.player.swearTimer,
        lives: state.lives,
        enemies: state.enemies.length,
        hatched,
        remaining: left,
        phase: state.phase,
        message: state.message,
        score: state.score,
      };
    });
    return unsub;
  }, []);
}
