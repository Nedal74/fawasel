"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { useAutoAdvance, usePageVisible } from "@/hooks/useAutoAdvance";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useSwipe } from "@/hooks/useSwipe";
import { cn } from "@/lib/utils";

export type MetricSlide = {
  id: string;
  label: string;
  value: number;
  prefix: string;
  suffix: string;
  description: string;
};

/** Counts to `value` whenever the active metric changes. */
function useCountTo(value: number, active: boolean, reduced: boolean) {
  const [display, setDisplay] = useState(value);
  const frame = useRef(0);

  useEffect(() => {
    if (!active) return;
    if (reduced) {
      const raf = requestAnimationFrame(() => setDisplay(value));
      return () => cancelAnimationFrame(raf);
    }
    const duration = 900;
    let start = 0;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      setDisplay(Math.round(value * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame.current);
  }, [value, active, reduced]);

  return display;
}

/**
 * One very large metric at a time, advancing on its own and on demand.
 * Numbers count up, the label masks in, and the neighbours stay as small ticks.
 */
export function MetricsCarousel({ metrics }: { metrics: MetricSlide[] }) {
  const [active, setActive] = useState(0);
  const [held, setHeld] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);
  const reduced = useReducedMotion();
  const visible = usePageVisible();
  const count = metrics.length;

  const go = useCallback(
    (next: number) => {
      if (count === 0) return;
      setDirection(next > active ? 1 : -1);
      setActive(((next % count) + count) % count);
    },
    [active, count],
  );

  const next = useCallback(() => go(active + 1), [active, go]);
  const previous = useCallback(() => go(active - 1), [active, go]);

  // Runs on its own every three seconds; a manual move just re-arms the timer.
  useAutoAdvance(next, {
    interval: 3000,
    paused: held || !visible || count < 2,
    resetKey: active,
  });

  const swipe = useSwipe({ onNext: next, onPrevious: previous, axis: "x" });
  const current = metrics[active];
  const display = useCountTo(current?.value ?? 0, true, reduced);

  if (count === 0) return null;

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label="Marketing numbers"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") {
          event.preventDefault();
          next();
        } else if (event.key === "ArrowLeft") {
          event.preventDefault();
          previous();
        }
      }}
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      {...swipe}
      className="relative select-none focus-visible:outline-none"
    >
      <div className="grid items-end gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8">
          {/* key forces the entrance animation to replay on every change */}
          <div
            key={current.id}
            className="animate-rise"
            style={{
              animationDuration: reduced ? "0ms" : "620ms",
              ["--tw-enter" as string]: direction,
            }}
          >
            <p className="display text-accent text-[clamp(4.5rem,18vw,13rem)] leading-[0.82] tabular-nums">
              {current.prefix}
              {display}
              {current.suffix}
            </p>
            <p className="mt-4 text-[clamp(1rem,2.4vw,1.6rem)] uppercase tracking-[0.2em] text-offwhite">
              {current.label}
            </p>
            {current.description ? (
              <p className="mt-3 max-w-md text-sm text-muted">{current.description}</p>
            ) : null}
          </div>
        </div>

        <div className="lg:col-span-4">
          <ol className="space-y-px border-t border-[var(--color-line)]">
            {metrics.map((metric, index) => (
              <li key={metric.id}>
                <button
                  type="button"
                  onClick={() => go(index)}
                  aria-current={index === active ? "true" : undefined}
                  className={cn(
                    "flex w-full items-baseline justify-between gap-4 border-b border-[var(--color-line)] py-2.5 text-start transition-colors",
                    index === active ? "text-accent" : "text-dim hover:text-offwhite",
                  )}
                >
                  <span className="text-[0.625rem] uppercase tracking-[0.18em]">{metric.label}</span>
                  <span className="text-xs tabular-nums">
                    {metric.prefix}
                    {metric.value}
                    {metric.suffix}
                  </span>
                </button>
              </li>
            ))}
          </ol>

          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={previous}
              aria-label="Previous metric"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-line)] text-muted transition-colors hover:border-accent hover:text-accent"
            >
              <ChevronLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next metric"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-line)] text-muted transition-colors hover:border-accent hover:text-accent"
            >
              <ChevronRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
            </button>
            <span className="label text-[0.625rem]">
              {String(active + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
            </span>
          </div>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {current.prefix}
        {current.value}
        {current.suffix} {current.label}
      </p>
    </div>
  );
}
