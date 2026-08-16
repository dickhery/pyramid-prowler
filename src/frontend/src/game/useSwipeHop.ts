import { useEffect } from "react";
import { useGameStore } from "./store";
import type { HopDirection } from "./types";

const MIN_SWIPE = 36;

function directionFromSwipe(dx: number, dy: number): HopDirection {
  if (dy < 0) return dx < 0 ? "north" : "west";
  return dx < 0 ? "east" : "south";
}

/**
 * Map a finger swipe to the four isometric hop diagonals.
 * Ignores mouse (keyboard / cube click still work) and ignores swipes
 * that start on a button so the hop pad and HUD stay independent.
 */
export function useSwipeHop(enabled: boolean): void {
  const hop = useGameStore((s) => s.hop);

  useEffect(() => {
    if (!enabled) return;
    let startX = 0;
    let startY = 0;
    let tracking = false;

    const onDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse") return;
      const target = event.target;
      if (
        target instanceof Element &&
        target.closest("button, input, textarea, a")
      ) {
        return;
      }
      tracking = true;
      startX = event.clientX;
      startY = event.clientY;
    };

    const onUp = (event: PointerEvent) => {
      if (!tracking) return;
      tracking = false;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      if (Math.hypot(dx, dy) < MIN_SWIPE) return;
      hop(directionFromSwipe(dx, dy));
    };

    const onCancel = () => {
      tracking = false;
    };

    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
    };
  }, [enabled, hop]);
}
