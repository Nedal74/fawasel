"use client";

import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { useCallback, useState } from "react";

import { useAutoAdvance } from "@/hooks/useAutoAdvance";
import { useSwipe } from "@/hooks/useSwipe";
import { cn } from "@/lib/utils";

export type TestimonialSlide = {
  id: string;
  name: string;
  role: string;
  company: string;
  quote: string;
  photo: string;
};

/** Image-led testimonial slider: portrait on one side, large quote on the other. */
export function TestimonialsSlider({ testimonials }: { testimonials: TestimonialSlide[] }) {
  const [active, setActive] = useState(0);
  const [engaged, setEngaged] = useState(false);
  const count = testimonials.length;

  const go = useCallback(
    (next: number, manual = true) => {
      if (manual) setEngaged(true);
      setActive(((next % count) + count) % count);
    },
    [count],
  );

  const next = useCallback(() => go(active + 1), [active, go]);
  const previous = useCallback(() => go(active - 1), [active, go]);

  useAutoAdvance(
    useCallback(() => setActive((current) => (current + 1) % Math.max(count, 1)), [count]),
    { paused: engaged || count < 2, interval: 6000 },
  );

  const swipe = useSwipe({ onNext: next, onPrevious: previous, axis: "x" });
  const current = testimonials[active];

  if (count === 0) return null;

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label="Client testimonials"
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
      onMouseEnter={() => setEngaged(true)}
      {...swipe}
      className="grid select-none gap-8 focus-visible:outline-none lg:grid-cols-12 lg:gap-12"
    >
      <div className="lg:col-span-4">
        <div className="relative aspect-[4/5] overflow-hidden border border-[var(--color-line)] bg-graphite">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.id}
              aria-hidden={index !== active}
              className="absolute inset-0 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{
                opacity: index === active ? 1 : 0,
                transform: `scale(${index === active ? 1 : 1.06})`,
              }}
            >
              {testimonial.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={testimonial.photo}
                  alt={testimonial.name}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="grid-field flex h-full w-full items-center justify-center">
                  <span className="display text-5xl text-dim">
                    {testimonial.name.slice(0, 1) || "—"}
                  </span>
                </div>
              )}
            </div>
          ))}
          <span className="absolute inset-x-0 bottom-0 h-16 bg-[linear-gradient(to_top,var(--color-void),transparent)]" aria-hidden />
        </div>
      </div>

      <div className="flex flex-col justify-between lg:col-span-8">
        <div key={current.id} className="animate-rise">
          <Quote className="h-7 w-7 text-accent" aria-hidden />
          <blockquote className="mt-6 text-[clamp(1.15rem,2.6vw,2rem)] leading-[1.35] text-offwhite">
            {current.quote}
          </blockquote>
          <div className="mt-8">
            <p className="text-sm font-medium">{current.name}</p>
            <p className="label mt-1 text-[0.625rem]">
              {[current.role, current.company].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>

        <div className="mt-10 flex items-center gap-3">
          <button
            type="button"
            onClick={previous}
            aria-label="Previous testimonial"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-line)] text-muted transition-colors hover:border-accent hover:text-accent"
          >
            <ChevronLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next testimonial"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-line)] text-muted transition-colors hover:border-accent hover:text-accent"
          >
            <ChevronRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
          </button>
          <ul className="ms-2 flex items-center gap-1.5">
            {testimonials.map((testimonial, index) => (
              <li key={testimonial.id}>
                <button
                  type="button"
                  onClick={() => go(index)}
                  aria-label={`Testimonial ${index + 1}`}
                  className={cn(
                    "h-1 rounded-full transition-all duration-500",
                    index === active ? "w-6 bg-accent" : "w-1.5 bg-[var(--color-line-strong)]",
                  )}
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
