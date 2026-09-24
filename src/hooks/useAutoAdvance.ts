"use client";

import { useEffect, useState } from "react";

/** True while the tab is visible — sliders should not run in a hidden tab. */
export function usePageVisible(): boolean {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const update = () => setVisible(!document.hidden);
    const frame = requestAnimationFrame(update);
    document.addEventListener("visibilitychange", update);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  return visible;
}

/**
 * Advances a slider on a timer.
 *
 * The timer restarts whenever `resetKey` changes, so a manual move simply
 * re-arms the countdown instead of stopping it: the slider keeps running on its
 * own and only pauses while the visitor is actually hovering or dragging it.
 */
export function useAutoAdvance(
  advance: () => void,
  {
    interval = 3000,
    paused = false,
    resetKey = 0,
  }: { interval?: number; paused?: boolean; resetKey?: number | string } = {},
) {
  useEffect(() => {
    if (paused) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = setTimeout(advance, interval);
    return () => clearTimeout(timer);
  }, [advance, interval, paused, resetKey]);
}

/** Reading direction of the current subtree, for horizontal sliders. */
export function useDirection(): 1 | -1 {
  const [factor, setFactor] = useState<1 | -1>(1);

  useEffect(() => {
    // Read after paint so the value matches the hydrated document.
    const frame = requestAnimationFrame(() =>
      setFactor(document.documentElement.dir === "rtl" ? -1 : 1),
    );
    return () => cancelAnimationFrame(frame);
  }, []);

  return factor;
}
