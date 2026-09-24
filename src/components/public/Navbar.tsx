"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { LanguageToggle } from "@/components/public/LanguageToggle";
import type { Locale } from "@/lib/cms/types";
import { cn } from "@/lib/utils";

export type NavItem = { id: string; label: string; href: string };

export function Navbar({
  items,
  ctaLabel,
  locale,
  languageLabel,
  menuLabel,
  closeLabel,
  brand,
}: {
  items: NavItem[];
  ctaLabel: string;
  locale: Locale;
  languageLabel: string;
  menuLabel: string;
  closeLabel: string;
  brand: string;
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile sheet whenever the route changes (adjusting state during
  // render rather than in an effect avoids a second paint with the sheet open).
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50">
      <div className="animate-nav-drop pointer-events-auto mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-4 sm:px-8 lg:px-12">
        <Link
          href="/"
          className={cn(
            "glass rounded-full px-4 py-2 text-[0.6875rem] uppercase tracking-[0.22em] transition-colors lg:hidden",
            scrolled && "bg-ink/80",
          )}
        >
          {brand}
        </Link>

        {/* Desktop: centered floating pill */}
        <nav
          aria-label="Primary"
          className={cn(
            "glass mx-auto hidden items-center gap-1 rounded-full px-2 py-2 transition-all duration-500 lg:flex",
            scrolled ? "translate-y-0 shadow-[0_18px_40px_-28px_#000] backdrop-blur-2xl" : "bg-transparent",
          )}
        >
          {items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={cn(
                "relative rounded-full px-4 py-2 text-[0.6875rem] uppercase tracking-[0.18em] transition-colors",
                isActive(item.href) ? "text-accent" : "text-muted hover:text-offwhite",
              )}
            >
              {item.label}
              {isActive(item.href) ? (
                <span
                  aria-hidden
                  className="accent-rule absolute inset-x-4 bottom-1 h-px opacity-90"
                />
              ) : null}
            </Link>
          ))}
          <span className="mx-2 h-4 w-px bg-[var(--color-line-strong)]" aria-hidden />
          <LanguageToggle locale={locale} label={languageLabel} className="px-2" />
          <Link
            href="/contact"
            className="btn-shine btn-accent ms-1 rounded-full px-5 py-2 text-[0.6875rem] font-medium uppercase tracking-[0.18em]"
          >
            {ctaLabel}
          </Link>
        </nav>

        {/* Mobile trigger */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          className="glass pointer-events-auto flex items-center gap-2 rounded-full px-4 py-2 text-[0.6875rem] uppercase tracking-[0.18em] lg:hidden"
        >
          {open ? <X className="h-4 w-4" aria-hidden /> : <Menu className="h-4 w-4" aria-hidden />}
          {open ? closeLabel : menuLabel}
        </button>
      </div>

      {/* Mobile sheet */}
      <div
        id="mobile-menu"
        hidden={!open}
        className="pointer-events-auto fixed inset-0 top-0 z-40 bg-void/95 backdrop-blur-xl lg:hidden"
      >
        <nav aria-label="Mobile" className="flex h-full flex-col justify-center gap-2 px-6 pb-16">
          {items.map((item, i) => (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-baseline justify-between border-b border-[var(--color-line)] py-4 text-2xl uppercase tracking-tight transition-colors",
                isActive(item.href) ? "text-accent" : "text-offwhite",
              )}
            >
              {item.label}
              <span className="label text-[0.625rem]">{String(i + 1).padStart(2, "0")}</span>
            </Link>
          ))}
          <div className="mt-8 flex items-center justify-between">
            <LanguageToggle locale={locale} label={languageLabel} />
            <Link
              href="/contact"
              onClick={() => setOpen(false)}
              className="btn-shine btn-accent rounded-full px-6 py-3 text-[0.6875rem] font-medium uppercase tracking-[0.18em]"
            >
              {ctaLabel}
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
