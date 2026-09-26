"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export type RevealDirection = "up" | "down" | "left" | "right" | "blur" | "mask";

/**
 * Reveals children once, when they first enter the viewport.
 *
 * `from` picks the entrance direction so each section can move differently
 * instead of the whole page fading in the same way.
 */
export function Reveal({
  children,
  delay = 0,
  from = "up",
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  from?: RevealDirection;
  className?: string;
  as?: "div" | "li" | "article" | "section" | "header" | "figure";
}) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      const frame = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(frame);
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as React.Ref<never>}
      className={cn("reveal", className)}
      data-from={from}
      data-visible={visible}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}

/**
 * Word-by-word reveal for headlines. Falls back to a single block under
 * reduced motion because each word carries its own delay.
 */
export function RevealWords({
  text,
  delay = 0,
  step = 45,
  className,
  as: Tag = "h2",
}: {
  text: string;
  delay?: number;
  step?: number;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p";
}) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      const frame = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(frame);
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const words = text.split(" ").filter(Boolean);

  return (
    <Tag ref={ref as React.Ref<never>} className={className}>
      {words.map((word, index) => (
        <span key={`${word}-${index}`} className="word-mask inline-block overflow-hidden align-bottom">
          <span
            className="reveal inline-block"
            data-from="up"
            data-visible={visible}
            style={{ transitionDelay: `${delay + index * step}ms` }}
          >
            {word}
            {index < words.length - 1 ? " " : null}
          </span>
        </span>
      ))}
    </Tag>
  );
}
