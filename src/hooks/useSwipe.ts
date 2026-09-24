"use client";

import { useRef } from "react";

/**
 * Minimal horizontal/vertical swipe detection built on pointer events, so the
 * sliders work with touch, pen and mouse drag without a carousel dependency.
 */
export function useSwipe({
  onNext,
  onPrevious,
  axis = "x",
  threshold = 48,
}: {
  onNext: () => void;
  onPrevious: () => void;
  axis?: "x" | "y";
  threshold?: number;
}) {
  const start = useRef<{ x: number; y: number } | null>(null);

  return {
    onPointerDown: (event: React.PointerEvent) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      start.current = { x: event.clientX, y: event.clientY };
    },
    onPointerUp: (event: React.PointerEvent) => {
      const origin = start.current;
      start.current = null;
      if (!origin) return;
      const deltaX = event.clientX - origin.x;
      const deltaY = event.clientY - origin.y;
      const primary = axis === "x" ? deltaX : deltaY;
      const secondary = axis === "x" ? deltaY : deltaX;
      if (Math.abs(primary) < threshold || Math.abs(primary) <= Math.abs(secondary)) return;
      // In RTL a swipe left still means "next" for vertical sliders; horizontal
      // sliders pass their own direction handling via onNext/onPrevious.
      if (primary < 0) onNext();
      else onPrevious();
    },
    onPointerCancel: () => {
      start.current = null;
    },
  };
}
