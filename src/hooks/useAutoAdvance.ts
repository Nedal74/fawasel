"use client";

import { useEffect } from "react";

/**
 * Advances a slider on an interval, pausing while the tab is hidden, while the
 * user is interacting, and entirely under reduced motion.
 */
export function useAutoAdvance(
  advance: () => void,
  { interval = 4200, paused = false }: { interval?: number; paused?: boolean } = {},
) {
  useEffect(() => {
    if (paused) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let timer: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (timer === null) timer = setInterval(advance, interval);
    };
    const stop = () => {
      if (timer !== null) {
        clearInterval(timer);
        timer = null;
      }
    };
    const onVisibility = () => (document.hidden ? stop() : start());

    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [advance, interval, paused]);
}
