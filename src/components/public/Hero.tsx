"use client";

import { ArrowDown } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";

import { CountUp } from "@/components/ui/CountUp";
import { Crosshair, DataTicks, TechLabel } from "@/components/ui/Decor";

export type HeroMetric = { id: string; label: string; value: number; prefix: string; suffix: string };

export type HeroCopy = {
  eyebrow: string;
  name: string;
  title: string;
  descriptor: string;
  philosophy: string;
  cta: string;
  ctaSecondary: string;
  scroll: string;
};

/**
 * 100dvh cinematic hero.
 *
 * All pointer-driven motion (grid parallax + the spotlight that reveals the
 * secondary portrait) runs in ONE requestAnimationFrame loop and is skipped
 * entirely on touch devices and under `prefers-reduced-motion`.
 *
 * Interface is black/white/lime; the photograph keeps its own warm lighting —
 * the contrast between the two is intentional.
 */
export function Hero({
  copy,
  metrics,
  image,
  revealImage,
  imageAlt,
}: {
  copy: HeroCopy;
  metrics: HeroMetric[];
  image: string;
  revealImage: string;
  imageAlt: string;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const revealRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const grid = gridRef.current;
    if (!section || !grid) return;

    const coarsePointer = matchMedia("(pointer: coarse)").matches;
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (coarsePointer || reducedMotion) return;

    // Cursor starts off-canvas so nothing is revealed before the first move.
    let cursorX = -999;
    let cursorY = -999;
    let smoothX = -999;
    let smoothY = -999;
    let gridX = 0;
    let gridY = 0;
    let targetGridX = 0;
    let targetGridY = 0;
    let frame = 0;
    let running = true;

    const onPointerMove = (event: PointerEvent) => {
      const rect = section.getBoundingClientRect();
      cursorX = event.clientX - rect.left;
      cursorY = event.clientY - rect.top;
      targetGridX = (cursorX / rect.width - 0.5) * 16;
      targetGridY = (cursorY / rect.height - 0.5) * 16;
    };

    const onPointerLeave = () => {
      cursorX = -999;
      cursorY = -999;
      targetGridX = 0;
      targetGridY = 0;
    };

    const tick = () => {
      if (!running) return;
      gridX += (targetGridX - gridX) * 0.06;
      gridY += (targetGridY - gridY) * 0.06;
      grid.style.transform = `translate3d(${gridX.toFixed(2)}px, ${gridY.toFixed(2)}px, 0)`;

      const reveal = revealRef.current;
      if (reveal) {
        smoothX += (cursorX - smoothX) * 0.1;
        smoothY += (cursorY - smoothY) * 0.1;
        const mask = `radial-gradient(260px circle at ${smoothX.toFixed(1)}px ${smoothY.toFixed(
          1,
        )}px, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 40%, rgba(0,0,0,0.75) 60%, rgba(0,0,0,0.4) 75%, rgba(0,0,0,0.12) 88%, rgba(0,0,0,0) 100%)`;
        reveal.style.setProperty("mask-image", mask);
        reveal.style.setProperty("-webkit-mask-image", mask);
      }
      frame = requestAnimationFrame(tick);
    };

    // Don't burn frames while the tab is hidden.
    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(frame);
      } else if (!running) {
        running = true;
        frame = requestAnimationFrame(tick);
      }
    };

    section.addEventListener("pointermove", onPointerMove);
    section.addEventListener("pointerleave", onPointerLeave);
    document.addEventListener("visibilitychange", onVisibility);
    frame = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(frame);
      section.removeEventListener("pointermove", onPointerMove);
      section.removeEventListener("pointerleave", onPointerLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="grain relative flex min-h-[100dvh] w-full items-center overflow-hidden bg-void"
    >
      {/* Layer 0 — parallax grid */}
      <div ref={gridRef} className="pointer-events-none absolute -inset-8 will-change-transform" aria-hidden>
        <svg className="h-full w-full opacity-[0.22]" aria-hidden>
          <defs>
            <pattern id="hero-grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M48 0H0V48" fill="none" stroke="#ffffff" strokeWidth="0.6" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-grid)" />
        </svg>
      </div>

      {/* Restrained lime halo behind the portrait — interface, not photography */}
      <div
        aria-hidden
        className="pointer-events-none absolute end-0 top-1/2 h-[80vmin] w-[80vmin] -translate-y-1/2 translate-x-1/3 rounded-full opacity-[calc(0.16*var(--visual-intensity))] blur-[110px]"
        style={{ background: "radial-gradient(circle, var(--accent) 0%, transparent 68%)" }}
      />

      <div className="relative z-10 mx-auto grid w-full max-w-[1400px] grid-cols-1 items-center gap-10 px-5 pb-24 pt-32 sm:px-8 lg:grid-cols-12 lg:gap-6 lg:px-12 lg:pb-16">
        {/* Copy */}
        <div className="lg:col-span-7">
          <div className="animate-drop flex items-center gap-3">
            <span className="animate-tick block h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
            <span className="label">{copy.eyebrow}</span>
          </div>

          <h1 className="mt-6">
            <span
              className="animate-mask-up display block text-[clamp(2.75rem,9vw,7.5rem)]"
              style={{ animationDelay: "0.15s" }}
            >
              {copy.name}
            </span>
            <span
              className="animate-slide-start mt-3 block text-[clamp(1rem,2.4vw,1.85rem)] tracking-[0.24em] text-accent"
              style={{ animationDelay: "0.35s" }}
            >
              {copy.title}
            </span>
          </h1>

          <div className="animate-rise mt-7 max-w-xl" style={{ animationDelay: "0.55s" }}>
            <p className="text-sm leading-relaxed text-muted">{copy.descriptor}</p>
            <p className="mt-5 border-s-2 border-accent ps-4 text-base leading-relaxed text-offwhite/90">
              {copy.philosophy}
            </p>
          </div>

          <div
            className="animate-rise mt-9 flex flex-wrap items-center gap-3"
            style={{ animationDelay: "0.72s" }}
          >
            <Link
              href="/contact"
              className="btn-shine btn-accent rounded-full px-8 py-3.5 text-xs font-medium uppercase tracking-[0.18em] shadow-[0_0_40px_-16px_var(--accent)] transition-transform duration-300 hover:scale-[1.02]"
            >
              {copy.cta}
            </Link>
            <Link
              href="/projects"
              className="rounded-full border border-[var(--color-line-strong)] px-8 py-3.5 text-xs uppercase tracking-[0.18em] text-offwhite transition-colors duration-300 hover:border-accent hover:text-accent"
            >
              {copy.ctaSecondary}
            </Link>
          </div>

          {metrics.length > 0 ? (
            <dl
              className="animate-rise mt-12 grid max-w-2xl grid-cols-2 gap-px overflow-hidden border border-[var(--color-line)] bg-[var(--color-line)] sm:grid-cols-4"
              style={{ animationDelay: "0.88s" }}
            >
              {metrics.map((metric) => (
                <div key={metric.id} className="bg-void px-4 py-4">
                  <dt className="label text-[0.5625rem]">{metric.label}</dt>
                  <dd className="mt-1.5 text-xl font-semibold text-accent">
                    <CountUp value={metric.value} prefix={metric.prefix} suffix={metric.suffix} />
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>

        {/* Portrait + HUD */}
        <div className="relative lg:col-span-5">
          <figure className="relative mx-auto aspect-[4/5] w-full max-w-[520px] overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image}
                alt={imageAlt}
                className="animate-ken-burns h-full w-full object-cover object-top"
                fetchPriority="high"
                decoding="async"
              />
              {revealImage ? (
                <div ref={revealRef} className="absolute inset-0" aria-hidden>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={revealImage} alt="" className="h-full w-full object-cover object-top" />
                </div>
              ) : null}
            </div>

            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,var(--color-void)_2%,transparent_45%)]"
            />

            <Crosshair className="-left-1.5 -top-1.5" />
            <Crosshair className="-right-1.5 -top-1.5" />
            <Crosshair className="-bottom-1.5 -left-1.5" />
            <Crosshair className="-bottom-1.5 -right-1.5" />

            <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between p-4">
              <TechLabel>ID · NE—01</TechLabel>
              <DataTicks className="h-4" />
            </figcaption>
          </figure>

          {/* Marketing-intelligence HUD */}
          <div className="pointer-events-none absolute -start-2 top-8 hidden lg:block">
            <div className="glass rounded-md px-3 py-2">
              <TechLabel>SIGNAL</TechLabel>
              <div className="mt-1.5 flex items-end gap-[3px]" aria-hidden>
                {[9, 14, 7, 18, 11, 22, 16].map((height, i) => (
                  <span key={i} className="w-1 bg-accent" style={{ height }} />
                ))}
              </div>
            </div>
          </div>
          <div className="pointer-events-none absolute -end-2 bottom-16 hidden lg:block">
            <div className="glass rounded-md px-3 py-2">
              <TechLabel>RIYADH · 24.71°N 46.67°E</TechLabel>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute inset-x-0 bottom-6 flex justify-center">
        <span className="label flex items-center gap-2 text-[0.625rem]">
          {copy.scroll}
          <ArrowDown className="h-3 w-3 animate-tick text-accent" aria-hidden />
        </span>
      </div>
    </section>
  );
}
