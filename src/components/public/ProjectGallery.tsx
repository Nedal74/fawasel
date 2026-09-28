"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type { Locale } from "@/lib/cms/types";
import { cn } from "@/lib/utils";

/**
 * Project gallery: one fixed-ratio stage (every image shown whole with
 * object-contain, so portrait, landscape and square uploads all sit evenly),
 * a thumbnail strip, and a full-screen lightbox. Circular navigation by
 * arrows, thumbnails, keyboard (mirrored in RTL) and touch swipe.
 */

const SWIPE_THRESHOLD = 45;

type Labels = {
  previous: string;
  next: string;
  close: string;
  enlarge: string;
  image: string;
};

const navButton =
  "absolute top-1/2 z-10 flex h-[46px] w-[46px] -translate-y-1/2 items-center justify-center border border-[var(--color-line)] bg-black/55 text-offwhite backdrop-blur-md transition-colors duration-200 hover:border-accent hover:bg-accent hover:text-black focus-visible:border-accent focus-visible:outline-none";

export function ProjectGallery({
  images,
  name,
  locale,
  labels,
}: {
  images: string[];
  name: string;
  locale: Locale;
  labels: Labels;
}) {
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const count = images.length;
  const rtl = locale === "ar";

  const strip = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const stageButton = useRef<HTMLButtonElement>(null);
  const touchStart = useRef<number | null>(null);
  /** A swipe must not also count as a click that opens the lightbox. */
  const swipedAt = useRef(0);
  const firstRender = useRef(true);

  const go = useCallback((next: number) => setIndex(((next % count) + count) % count), [count]);
  const next = useCallback(() => setIndex((current) => (current + 1) % count), [count]);
  const previous = useCallback(() => setIndex((current) => (current - 1 + count) % count), [count]);

  // Keep the active thumbnail centred in the strip. Skipped while the
  // lightbox is open so the page behind it never jumps.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (open) return;
    const thumb = strip.current?.children[index] as HTMLElement | undefined;
    thumb?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [index, open]);

  // Keyboard: arrows move (left/right swap in RTL so they follow the screen),
  // Esc closes the lightbox. Typing in a field is never hijacked.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
      if (event.key === "Escape" && open) {
        setOpen(false);
        return;
      }
      if (event.key === "ArrowRight") (rtl ? previous : next)();
      else if (event.key === "ArrowLeft") (rtl ? next : previous)();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, rtl, next, previous]);

  // Lightbox: lock page scroll and move focus in; hand focus back on close.
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    closeButton.current?.focus();
    const stage = stageButton.current;
    return () => {
      root.style.overflow = previousOverflow;
      stage?.focus({ preventScroll: true });
    };
  }, [open]);

  const swipe = {
    onTouchStart: (event: React.TouchEvent) => {
      touchStart.current = event.touches[0]?.clientX ?? null;
    },
    onTouchEnd: (event: React.TouchEvent) => {
      const start = touchStart.current;
      touchStart.current = null;
      if (start === null) return;
      const delta = (event.changedTouches[0]?.clientX ?? start) - start;
      if (Math.abs(delta) <= SWIPE_THRESHOLD) return;
      swipedAt.current = Date.now();
      if (delta > 0) previous();
      else next();
    },
  };

  const Previous = rtl ? ChevronRight : ChevronLeft;
  const Next = rtl ? ChevronLeft : ChevronRight;

  if (count === 0) return null;

  return (
    <div>
      <div className="relative">
        <div
          className="relative aspect-[4/5] overflow-hidden border border-[var(--color-line)] bg-[#0a0a0a] min-[760px]:aspect-[16/10]"
          {...swipe}
        >
          {images.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`${src}-${i}`}
              src={src}
              alt={`${name} — ${labels.image} ${i + 1}`}
              loading={i < 2 ? "eager" : "lazy"}
              decoding="async"
              draggable={false}
              aria-hidden={i !== index}
              className={cn(
                "absolute inset-0 h-full w-full object-contain transition-opacity duration-[350ms] ease-out",
                i === index ? "opacity-100" : "opacity-0",
              )}
            />
          ))}

          {/* The whole stage opens the lightbox; the arrows sit above it. */}
          <button
            ref={stageButton}
            type="button"
            onClick={() => {
              if (Date.now() - swipedAt.current < 400) return;
              setOpen(true);
            }}
            aria-label={`${labels.enlarge} — ${labels.image} ${index + 1} / ${count}`}
            className="absolute inset-0 cursor-zoom-in focus-visible:outline focus-visible:outline-1 focus-visible:-outline-offset-2 focus-visible:outline-accent"
          />

          {count > 1 ? (
            <>
              <button type="button" onClick={previous} aria-label={labels.previous} className={cn(navButton, "start-3")}>
                <Previous className="h-5 w-5" aria-hidden />
              </button>
              <button type="button" onClick={next} aria-label={labels.next} className={cn(navButton, "end-3")}>
                <Next className="h-5 w-5" aria-hidden />
              </button>
            </>
          ) : null}

          <p
            className="pointer-events-none absolute bottom-3 start-3 z-10 border border-[var(--color-line)] bg-black/60 px-[11px] py-[5px] text-xs tabular-nums tracking-[0.08em] text-offwhite"
            aria-live="polite"
            data-gallery-counter
          >
            <span dir="ltr">
              <span className="font-semibold text-accent">{index + 1}</span> / {count}
            </span>
          </p>
          <p className="pointer-events-none absolute bottom-3 end-3 z-10 border border-[var(--color-line)] bg-black/60 px-[11px] py-[5px] text-[0.6875rem] text-offwhite/55">
            {labels.enlarge}
          </p>
        </div>

        {/* Lime corner brackets */}
        <span aria-hidden className="pointer-events-none absolute -top-px start-[-1px] h-3 w-3 border-s border-t border-accent opacity-80" />
        <span aria-hidden className="pointer-events-none absolute -bottom-px end-[-1px] h-3 w-3 border-b border-e border-accent opacity-80" />
      </div>

      {count > 1 ? (
        <div
          ref={strip}
          className="gallery-strip flex gap-2 overflow-x-auto px-0.5 pb-1 pt-2.5"
          role="group"
          aria-label={labels.image}
        >
          {images.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => go(i)}
              aria-label={`${labels.image} ${i + 1}`}
              aria-current={i === index ? "true" : undefined}
              className={cn(
                "h-[68px] w-[68px] shrink-0 overflow-hidden border bg-[#0a0a0a] p-0 transition-[opacity,border-color,box-shadow] duration-200 min-[760px]:h-[84px] min-[760px]:w-[84px]",
                i === index
                  ? "border-accent opacity-100 shadow-[0_0_0_1px_var(--accent)]"
                  : "border-[var(--color-line)] opacity-50 hover:opacity-85",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" loading="lazy" decoding="async" draggable={false} className="block h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}

      {/* Portalled to <body>: the Reveal wrapper's transform would otherwise
          trap this fixed overlay under the navbar and floating buttons. */}
      {open
        ? createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-label={name}
              className="fixed inset-0 z-[90] flex items-center justify-center bg-black/94 px-4 py-11"
              onClick={(event) => {
                if (event.target === event.currentTarget) setOpen(false);
              }}
              {...swipe}
              data-gallery-lightbox
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={images[index]}
                alt={`${name} — ${labels.image} ${index + 1}`}
                draggable={false}
                className="max-h-full max-w-full object-contain"
              />
              <button
                ref={closeButton}
                type="button"
                onClick={() => setOpen(false)}
                aria-label={labels.close}
                className="absolute end-3.5 top-3.5 flex h-[42px] w-[42px] items-center justify-center border border-[var(--color-line)] text-offwhite transition-colors hover:bg-accent hover:text-black focus-visible:border-accent focus-visible:outline-none"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
              {count > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={previous}
                    aria-label={labels.previous}
                    className={cn(navButton, "start-3.5 h-[50px] w-[50px] bg-black/50 backdrop-blur-none")}
                  >
                    <Previous className="h-6 w-6" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={next}
                    aria-label={labels.next}
                    className={cn(navButton, "end-3.5 h-[50px] w-[50px] bg-black/50 backdrop-blur-none")}
                  >
                    <Next className="h-6 w-6" aria-hidden />
                  </button>
                </>
              ) : null}
              <p dir="ltr" className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 text-xs tabular-nums text-offwhite/55">
                {index + 1} / {count}
              </p>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
