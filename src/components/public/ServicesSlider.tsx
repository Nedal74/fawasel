"use client";

import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";

import { useAutoAdvance, useDirection, usePageVisible } from "@/hooks/useAutoAdvance";
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

/** Distance between neighbouring cards, as a share of the card's own width. */
const STEP = 104;

/**
 * Horizontal service carousel.
 *
 * The active card sits centred and filled with lime; the previous and next
 * cards stay visible on either side so the sequence reads at a glance. It moves
 * on its own every three seconds, pausing only while the visitor is hovering,
 * focusing or dragging it, and it mirrors itself in RTL.
 */
export function ServicesSlider({
  services,
  brand,
}: {
  services: ServiceSlide[];
  brand: string;
}) {
  const [active, setActive] = useState(0);
  const [held, setHeld] = useState(false);
  const direction = useDirection();
  const visible = usePageVisible();
  const count = services.length;

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
    interval: 3000,
    paused: held || !visible || count < 2,
    resetKey: active,
  });

  // A swipe toward the start of the line means "next" in both directions.
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
      aria-label="Services"
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
      className="relative select-none focus-visible:outline-none"
    >
      <div className="relative h-[430px] overflow-hidden sm:h-[400px]">
        {services.map((service, index) => {
          // Shortest path around the loop, so the first and last cards are neighbours.
          let offset = index - active;
          if (offset > count / 2) offset -= count;
          if (offset < -count / 2) offset += count;

          const distance = Math.abs(offset);
          const isActive = offset === 0;
          if (distance > 2) return null;

          return (
            <article
              key={service.id}
              aria-hidden={!isActive}
              aria-roledescription="slide"
              onClick={() => !isActive && go(index)}
              className={cn(
                // `left-1/2` is physical on purpose: centring is the same in both
                // directions, and only the neighbour offset flips with `direction`.
                "absolute inset-y-0 left-1/2 w-[86%] overflow-hidden rounded-2xl transition-all duration-[700ms] sm:w-[62%] lg:w-[52%]",
                isActive
                  ? "z-10 bg-[linear-gradient(150deg,#d6ff7a_0%,#bef532_55%,#a9e024_100%)] text-accent-ink shadow-[0_40px_90px_-45px_var(--accent)]"
                  : "z-0 cursor-pointer border border-[var(--color-line)] bg-[radial-gradient(120%_120%_at_20%_0%,#141a10_0%,#0a0a0a_60%)] text-offwhite",
              )}
              style={{
                transform: `translate3d(calc(-50% + ${offset * STEP * direction}%), 0, 0) scale(${
                  isActive ? 1 : 0.88
                })`,
                opacity: isActive ? 1 : Math.max(0.3, 0.62 - (distance - 1) * 0.25),
                filter: isActive ? "none" : `blur(${distance}px)`,
                transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
                pointerEvents: distance > 1 ? "none" : "auto",
              }}
            >
              {/* Hatched header strip */}
              <span
                aria-hidden
                className="block h-4 w-full"
                style={{
                  backgroundImage: isActive
                    ? "repeating-linear-gradient(115deg, #0a0a0a 0 8px, transparent 8px 16px)"
                    : "repeating-linear-gradient(115deg, var(--accent) 0 8px, transparent 8px 16px)",
                  opacity: isActive ? 0.85 : 0.5,
                }}
              />

              <div
                className={cn(
                  "relative m-3 h-[calc(100%-1.75rem)] rounded-xl border p-5 sm:p-7",
                  isActive ? "border-black/15" : "border-[var(--color-line)]",
                )}
              >
                {/* Oversized outlined index, like a print watermark */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute bottom-2 start-4 text-[7.5rem] font-bold leading-none tabular-nums sm:text-[9rem]"
                  style={{
                    color: "transparent",
                    WebkitTextStroke: `1px ${isActive ? "rgba(0,0,0,0.14)" : "rgba(255,255,255,0.08)"}`,
                  }}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>

                <div className="relative flex items-center gap-3">
                  <span
                    className={cn(
                      "shrink-0 text-[0.625rem] uppercase tracking-[0.22em]",
                      isActive ? "text-accent-ink/70" : "text-muted",
                    )}
                  >
                    {service.category}
                  </span>
                  <span
                    aria-hidden
                    className={cn(
                      "h-px flex-1",
                      isActive ? "bg-black/20" : "bg-[var(--color-line-strong)]",
                    )}
                  />
                  <span
                    className={cn(
                      "shrink-0 text-[0.625rem] uppercase tracking-[0.22em]",
                      isActive ? "text-accent-ink/70" : "text-dim",
                    )}
                  >
                    {brand}
                  </span>
                </div>

                <h3
                  className={cn(
                    "display relative mt-8 text-[clamp(1.6rem,3.4vw,2.6rem)]",
                    isActive ? "text-accent-ink" : "text-offwhite",
                  )}
                >
                  {service.title}
                </h3>

                {service.description ? (
                  <p
                    className={cn(
                      "relative mt-4 max-w-md text-sm leading-relaxed",
                      isActive ? "text-accent-ink/80" : "text-muted",
                    )}
                  >
                    {service.description}
                  </p>
                ) : null}

                {isActive && service.ctaLabel ? (
                  <Link
                    href={service.ctaUrl || "/contact"}
                    className="relative mt-7 inline-flex items-center gap-2 rounded-full bg-accent-ink px-5 py-2.5 text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-accent transition-transform duration-300 hover:scale-[1.03]"
                  >
                    {service.ctaLabel}
                    <ArrowUpRight className="h-3.5 w-3.5 rtl:-scale-x-100" aria-hidden />
                  </Link>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-8 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={previous}
          aria-label="Previous service"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-line)] text-muted transition-colors hover:border-accent hover:text-accent"
        >
          <ChevronLeft className="h-4 w-4 rtl:-scale-x-100" aria-hidden />
        </button>

        <ul className="flex max-w-[55vw] flex-wrap items-center justify-center gap-1.5">
          {services.map((service, index) => (
            <li key={service.id}>
              <button
                type="button"
                onClick={() => go(index)}
                aria-label={service.title}
                className={cn(
                  "h-1 rounded-full transition-all duration-500",
                  index === active ? "w-7 bg-accent" : "w-1.5 bg-[var(--color-line-strong)]",
                )}
              />
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={next}
          aria-label="Next service"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-line)] text-muted transition-colors hover:border-accent hover:text-accent"
        >
          <ChevronRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden />
        </button>
      </div>

      <p className="sr-only" aria-live="polite">
        {services[active].title}
      </p>
    </div>
  );
}
