"use client";

import { ArrowDown, ArrowUpRight, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";

import { useAutoAdvance } from "@/hooks/useAutoAdvance";
import { useSwipe } from "@/hooks/useSwipe";
import { cn } from "@/lib/utils";

export type ServiceSlide = {
  id: string;
  title: string;
  description: string;
  category: string;
  ctaLabel: string;
  ctaUrl: string;
};

/**
 * Vertical service carousel.
 *
 * A fixed arrow anchors the active slot; cards translate through it. The active
 * card inverts to lime-on-black, everything else stays black-on-white-text.
 * Driven by click, keyboard (arrow/page keys), swipe and a slow auto-advance
 * that stops as soon as the visitor interacts.
 */
export function ServicesSlider({ services }: { services: ServiceSlide[] }) {
  const [active, setActive] = useState(0);
  const [engaged, setEngaged] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const count = services.length;

  const go = useCallback(
    (next: number, manual = true) => {
      if (count === 0) return;
      if (manual) setEngaged(true);
      setActive(((next % count) + count) % count);
    },
    [count],
  );

  const next = useCallback(() => go(active + 1), [active, go]);
  const previous = useCallback(() => go(active - 1), [active, go]);

  useAutoAdvance(
    useCallback(() => setActive((current) => (current + 1) % Math.max(count, 1)), [count]),
    { paused: engaged || count < 2, interval: 4600 },
  );

  const swipe = useSwipe({ onNext: next, onPrevious: previous, axis: "y", threshold: 40 });

  if (count === 0) return null;

  return (
    <div
      ref={stageRef}
      role="group"
      aria-roledescription="carousel"
      aria-label="Services"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "ArrowDown" || event.key === "PageDown" || event.key === "ArrowRight") {
          event.preventDefault();
          next();
        } else if (
          event.key === "ArrowUp" ||
          event.key === "PageUp" ||
          event.key === "ArrowLeft"
        ) {
          event.preventDefault();
          previous();
        }
      }}
      onMouseEnter={() => setEngaged(true)}
      {...swipe}
      className="relative select-none focus-visible:outline-none"
    >
      {/* Anchored indicator: the active card always sits beneath it. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center">
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-line-strong)] bg-void">
          <ArrowDown className="h-4 w-4 text-accent" aria-hidden />
        </span>
      </div>

      {/*
        The stage is clipped and masked at both edges, so neighbouring cards
        fade out as they travel through the anchored arrow instead of colliding
        with the section heading.
      */}
      <div className="relative mx-auto h-[420px] max-w-3xl overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_16%,black_84%,transparent)] sm:h-[400px]">
        {services.map((service, index) => {
          const offset = index - active;
          const distance = Math.abs(offset);
          const isActive = offset === 0;
          if (distance > 2) return null;

          return (
            <article
              key={service.id}
              aria-hidden={!isActive}
              aria-roledescription="slide"
              className={cn(
                "absolute inset-x-0 top-[88px] mx-auto w-full origin-top rounded-lg border p-6 transition-all duration-[650ms] sm:p-8",
                isActive
                  ? "z-10 border-transparent bg-accent text-accent-ink shadow-[0_30px_80px_-40px_var(--accent)]"
                  : "z-0 border-[var(--color-line)] bg-ink text-offwhite",
              )}
              style={{
                transform: `translate3d(0, ${offset * 92}px, 0) scale(${1 - distance * 0.06})`,
                opacity: isActive ? 1 : Math.max(0.28, 0.6 - distance * 0.18),
                filter: isActive ? "none" : `blur(${distance * 1.4}px)`,
                transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
                pointerEvents: distance > 1 ? "none" : "auto",
              }}
              onClick={() => !isActive && go(index)}
            >
              <div className="flex items-center justify-between gap-4">
                <span
                  className={cn(
                    "text-[0.625rem] uppercase tracking-[0.2em]",
                    isActive ? "text-accent-ink/70" : "text-dim",
                  )}
                >
                  {service.category}
                </span>
                <span
                  className={cn(
                    "text-[0.625rem] tabular-nums tracking-[0.2em]",
                    isActive ? "text-accent-ink/70" : "text-dim",
                  )}
                >
                  {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
                </span>
              </div>

              <h3
                className={cn(
                  "display mt-5 text-[clamp(1.5rem,3.4vw,2.5rem)] transition-colors",
                  isActive ? "text-accent-ink" : "text-offwhite",
                )}
              >
                {service.title}
              </h3>

              {service.description ? (
                <p
                  className={cn(
                    "mt-4 max-w-xl text-sm leading-relaxed",
                    isActive ? "text-accent-ink/80" : "text-muted",
                  )}
                >
                  {service.description}
                </p>
              ) : null}

              {isActive && service.ctaLabel ? (
                <Link
                  href={service.ctaUrl || "/contact"}
                  className="mt-6 inline-flex items-center gap-2 border-b border-current pb-1 text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-accent-ink"
                >
                  {service.ctaLabel}
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              ) : null}
            </article>
          );
        })}
      </div>

      {/* Vertical controls keep a fixed up/down order, so they don't mirror. */}
      <div dir="ltr" className="-mt-2 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={previous}
          aria-label="Previous service"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-line)] text-muted transition-colors hover:border-accent hover:text-accent"
        >
          <ChevronUp className="h-4 w-4" aria-hidden />
        </button>

        <ul className="flex items-center gap-1.5" aria-hidden>
          {services.map((service, index) => (
            <li key={service.id}>
              <button
                type="button"
                tabIndex={-1}
                onClick={() => go(index)}
                className={cn(
                  "h-1 rounded-full transition-all duration-500",
                  index === active ? "w-6 bg-accent" : "w-1.5 bg-[var(--color-line-strong)]",
                )}
              />
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={next}
          aria-label="Next service"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-line)] text-muted transition-colors hover:border-accent hover:text-accent"
        >
          <ChevronDown className="h-4 w-4" aria-hidden />
        </button>
      </div>

      {/* Screen readers get the plain list; the visual carousel is decorative. */}
      <p className="sr-only" aria-live="polite">
        {services[active].title}
      </p>
    </div>
  );
}
