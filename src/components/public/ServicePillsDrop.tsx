"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export type PillGroup = {
  id: string;
  title: string;
  items: { id: string; label: string }[];
};

/** Stable pseudo-random in [0,1) from a string — same layout on every render. */
function hashUnit(value: string, salt: number): number {
  let hash = salt * 2654435761;
  for (let i = 0; i < value.length; i++) hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  return (hash % 1000) / 1000;
}

/**
 * Service names as pills that drop in one after another and pile up inside
 * their box, each landing at a slightly different angle and offset.
 *
 * The pile is laid out deterministically (no physics engine, no layout thrash):
 * every pill gets its resting slot, rotation and offset from a hash of its id,
 * then falls into it with a short overshoot once the box enters the viewport.
 * Under `prefers-reduced-motion` the pile is simply already in place.
 */
export function ServicePillsDrop({ groups }: { groups: PillGroup[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [dropped, setDropped] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      const frame = requestAnimationFrame(() => setDropped(true));
      return () => cancelAnimationFrame(frame);
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setDropped(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  if (groups.length === 0) return null;

  // One height for every box, set by the tallest pile, so the pair lines up.
  // The step itself is a CSS variable so phones can stack a little tighter.
  const tallest = Math.max(...groups.map((group) => group.items.length));
  const height = `max(320px, calc(112px + ${tallest} * var(--pill-step)))`;

  return (
    <div
      ref={ref}
      className="grid grid-cols-2 gap-3 [--pill-step:38px] sm:gap-4 sm:[--pill-step:46px]"
    >
      {groups.map((group, groupIndex) => {
        const lime = groupIndex % 2 === 0;

        return (
          <div
            key={group.id}
            style={{ height }}
            className={cn(
              "relative overflow-hidden rounded-2xl border p-4 sm:p-5",
              lime
                ? "border-accent/30 bg-[radial-gradient(120%_100%_at_50%_0%,rgba(190,245,50,0.14)_0%,#0a0a0a_60%)]"
                : "border-[var(--color-line)] bg-[radial-gradient(120%_100%_at_50%_0%,#181818_0%,#0a0a0a_60%)]",
            )}
          >
            <div className="grid-field pointer-events-none absolute inset-0 opacity-40" aria-hidden />

            <p
              className={cn(
                "relative text-[0.625rem] uppercase tracking-[0.18em]",
                lime ? "text-accent" : "text-muted",
              )}
            >
              {group.title}
            </p>

            <ul className="absolute inset-x-0 bottom-0 block">
              {group.items.map((item, index) => {
                const rotation = (hashUnit(item.id, 1) - 0.5) * 14;
                const shift = (hashUnit(item.id, 2) - 0.5) * 26;
                const bottom = `calc(12px + ${index} * var(--pill-step))`;

                return (
                  <li
                    key={item.id}
                    className="absolute inset-x-0 flex justify-center px-2"
                    style={{ bottom }}
                  >
                    <span
                      className={cn(
                        "whitespace-nowrap rounded-full px-3 py-1.5 text-[0.625rem] font-medium shadow-[0_10px_24px_-14px_rgba(0,0,0,0.9)] transition-all sm:px-4 sm:py-2 sm:text-xs",
                        lime
                          ? "bg-accent text-accent-ink"
                          : "border border-[var(--color-line-strong)] bg-graphite-soft text-offwhite",
                      )}
                      style={{
                        transform: dropped
                          ? `translate3d(${shift}px, 0, 0) rotate(${rotation}deg)`
                          : // Far enough above to start outside the clipped box.
                            `translate3d(${shift}px, -560px, 0) rotate(0deg)`,
                        opacity: dropped ? 1 : 0,
                        transitionDuration: "620ms",
                        // Slight overshoot, so each pill settles like it landed.
                        transitionTimingFunction: "cubic-bezier(0.34, 1.32, 0.64, 1)",
                        transitionDelay: `${index * 110}ms`,
                      }}
                    >
                      {item.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
