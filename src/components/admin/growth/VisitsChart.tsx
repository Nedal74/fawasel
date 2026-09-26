"use client";

import { useState } from "react";

type Point = { key: string; label: string; pageviews: number; sessions: number };

/**
 * Single-series column chart (visits per hour/day) with a hover/focus tooltip.
 * One series, so no legend: the section title names it.
 */
export function VisitsChart({
  points,
  visitsLabel,
  sessionsLabel,
  emptyLabel,
}: {
  points: Point[];
  visitsLabel: string;
  sessionsLabel: string;
  emptyLabel: string;
}) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(1, ...points.map((point) => point.pageviews));
  const ticks = niceTicks(max);
  const top = ticks[ticks.length - 1];
  const total = points.reduce((sum, point) => sum + point.pageviews, 0);
  const labelEvery = Math.ceil(points.length / 8);

  return (
    <div className="relative">
      <div className="flex gap-3">
        {/* y axis */}
        <div className="relative h-48 w-8 shrink-0 text-[0.625rem] tabular-nums text-dim" aria-hidden>
          {ticks.map((tick) => (
            <span key={tick} className="absolute end-0 translate-y-1/2" style={{ bottom: `${(tick / top) * 100}%` }}>
              {tick}
            </span>
          ))}
        </div>

        <div className="relative h-48 flex-1">
          {/* recessive grid */}
          {ticks.map((tick) => (
            <span
              key={tick}
              className="absolute inset-x-0 border-t border-[var(--color-line)] opacity-60"
              style={{ bottom: `${(tick / top) * 100}%` }}
              aria-hidden
            />
          ))}
          <div className="absolute inset-0 flex items-end gap-[2px]" onMouseLeave={() => setActive(null)}>
            {points.map((point, i) => (
              <button
                key={point.key}
                type="button"
                className="group relative flex h-full flex-1 items-end focus:outline-none"
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                aria-label={`${point.label}: ${point.pageviews} ${visitsLabel}, ${point.sessions} ${sessionsLabel}`}
              >
                <span
                  className={`block w-full rounded-t-[4px] transition-opacity ${
                    active === null || active === i ? "bg-accent" : "bg-accent opacity-40"
                  }`}
                  style={{ height: point.pageviews ? `max(3px, ${(point.pageviews / top) * 100}%)` : "0" }}
                />
              </button>
            ))}
          </div>

          {active !== null ? (
            <div
              className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded border border-[var(--color-line)] bg-ink px-3 py-2 text-xs shadow-lg rtl:translate-x-1/2"
              style={{ insetInlineStart: `${((active + 0.5) / points.length) * 100}%` }}
            >
              <p className="text-dim">{points[active].label}</p>
              <p className="mt-1 tabular-nums">
                <span className="text-offwhite">{points[active].pageviews}</span>{" "}
                <span className="text-muted">{visitsLabel}</span>
              </p>
              <p className="tabular-nums">
                <span className="text-offwhite">{points[active].sessions}</span>{" "}
                <span className="text-muted">{sessionsLabel}</span>
              </p>
            </div>
          ) : null}

          {total === 0 ? (
            <p className="absolute inset-0 flex items-center justify-center text-sm text-dim">{emptyLabel}</p>
          ) : null}
        </div>
      </div>

      {/* x axis */}
      <div className="ms-11 mt-2 flex gap-[2px] text-[0.625rem] tabular-nums text-dim" aria-hidden>
        {points.map((point, i) => (
          <span key={point.key} className="flex-1 truncate text-center">
            {i % labelEvery === 0 ? point.label : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

function niceTicks(max: number): number[] {
  const rough = max / 3;
  const power = 10 ** Math.floor(Math.log10(Math.max(1, rough)));
  const step = [1, 2, 5, 10].map((m) => m * power).find((candidate) => candidate >= rough) ?? power * 10;
  const top = Math.max(step, Math.ceil(max / step) * step);
  const ticks: number[] = [];
  for (let value = 0; value <= top; value += step) ticks.push(value);
  return ticks;
}
