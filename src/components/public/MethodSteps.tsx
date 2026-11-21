"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useState } from "react";

import { useAutoAdvance, useDirection, usePageVisible } from "@/hooks/useAutoAdvance";
import { useSwipe } from "@/hooks/useSwipe";
import { cn } from "@/lib/utils";

export type MethodStep = { title: string; body: string };

/**
 * The method, one step at a time.
 *
 * A step holds the stage for four seconds and then hands over to the next,
 * so the sequence plays itself instead of sitting on the page as a list. The
 * rail of step numbers doubles as the control; hovering, focusing or dragging
 * pauses the run, and it mirrors itself in RTL.
 */
export function MethodSteps({ steps, label }: { steps: MethodStep[]; label: string }) {
  const [active, setActive] = useState(0);
  const [held, setHeld] = useState(false);
  const direction = useDirection();
  const visible = usePageVisible();
  const count = steps.length;

  const go = useCallback(
    (next: number) => {
      if (count === 0) return;
      setActive(((next % count) + count) % count);
    },
    [count],
  );
  const next = useCallback(() => go(active + 1), [active, go]);
  const previous = useCallback(() => go(active - 1), [active, go]);

  useAutoAdvance(next, {
    interval: 4000,
    paused: held || !visible || count < 2,
    resetKey: active,
  });

  const swipe = useSwipe({
    onNext: () => (direction === 1 ? next() : previous()),
    onPrevious: () => (direction === 1 ? previous() : next()),
    axis: "x",
    threshold: 40,
  });

  if (count === 0) return null;

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label={label}
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") {
          event.preventDefault();
          if (direction === 1) next();
          else previous();
        } else if (event.key === "ArrowLeft") {
          event.preventDefault();
          if (direction === 1) previous();
          else next();
        }
      }}
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={() => setHeld(false)}
      onPointerDown={(event) => {
        setHeld(true);
        swipe.onPointerDown(event);
      }}
      onPointerUp={(event) => {
        swipe.onPointerUp(event);
        setHeld(false);
      }}
      onPointerCancel={() => {
        swipe.onPointerCancel();
        setHeld(false);
      }}
      className="select-none focus-visible:outline-none"
    >
      {/* Step rail: the whole sequence stays visible, the live one is lime. */}
      <ol className="flex items-stretch gap-2 overflow-x-auto pb-1">
        {steps.map((step, index) => (
          <li key={step.title} className="flex-1 basis-0">
            <button
              type="button"
              onClick={() => go(index)}
              aria-label={step.title}
              aria-current={index === active}
              className="group block w-full text-start focus-visible:outline-none"
            >
              <span
                aria-hidden
                className={cn(
                  "block h-0.5 w-full transition-colors duration-500",
                  index === active
                    ? "bg-accent"
                    : index < active
                      ? "bg-[var(--color-line-strong)]"
                      : "bg-[var(--color-line)]",
                )}
              />
              <span
                className={cn(
                  "mt-3 block text-[0.625rem] uppercase tracking-[0.22em] tabular-nums transition-colors duration-500",
                  index === active ? "text-accent" : "text-dim group-hover:text-muted",
                )}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
            </button>
          </li>
        ))}
      </ol>

      <div className="relative mt-8 min-h-[190px] sm:min-h-[170px]">
        {steps.map((step, index) => (
          <article
            key={step.title}
            aria-hidden={index !== active}
            className={cn(
              "transition-all duration-500",
              index === active
                ? "relative opacity-100 blur-0"
                : "pointer-events-none absolute inset-0 translate-y-3 opacity-0 blur-[2px]",
            )}
            style={{ transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)" }}
          >
            <div className="flex items-start gap-5 sm:gap-8">
              <span
                aria-hidden
                className="display shrink-0 text-[clamp(3rem,9vw,6rem)] leading-[0.85] tabular-nums"
                style={{ color: "transparent", WebkitTextStroke: "1px var(--accent)" }}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="pt-1">
                <h3 className="display text-[clamp(1.25rem,2.6vw,2rem)]">{step.title}</h3>
                {step.body ? (
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">{step.body}</p>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={previous}
          aria-label={`${label} — previous`}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-line)] text-muted transition-colors hover:border-accent hover:text-accent"
        >
          <ChevronLeft className="h-4 w-4 rtl:-scale-x-100" aria-hidden />
        </button>
        <button
          type="button"
          onClick={next}
          aria-label={`${label} — next`}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-line)] text-muted transition-colors hover:border-accent hover:text-accent"
        >
          <ChevronRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden />
        </button>
        <span className="text-xs tabular-nums text-dim">
          {active + 1} / {count}
        </span>
      </div>

      <p className="sr-only" aria-live="polite">
        {steps[active].title}
      </p>
    </div>
  );
}
