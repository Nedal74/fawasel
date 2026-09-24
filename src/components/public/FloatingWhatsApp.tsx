"use client";

import { useEffect, useState } from "react";

import { WhatsAppIcon } from "@/components/ui/BrandIcons";
import { whatsappLink } from "@/lib/utils";

/**
 * Persistent WhatsApp CTA. Sits bottom-end (right in LTR, left in RTL), above
 * everything else, and expands to its label on hover/focus.
 */
export function FloatingWhatsApp({
  phone,
  label,
  message,
}: {
  phone: string;
  label: string;
  message?: string;
}) {
  const [mounted, setMounted] = useState(false);

  // Avoid competing with the hero's entrance on first paint.
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 700);
    return () => clearTimeout(timer);
  }, []);

  if (!phone) return null;

  return (
    <a
      href={whatsappLink(phone, message)}
      target="_blank"
      rel="noreferrer noopener"
      aria-label={label}
      className="group fixed bottom-5 end-5 z-[70] flex items-center gap-2 rounded-full bg-accent py-3 ps-3 pe-3 text-accent-ink shadow-[0_18px_40px_-18px_var(--accent)] transition-all duration-500 hover:pe-5 focus-visible:pe-5"
      style={{
        opacity: mounted ? 1 : 0,
        transform: mounted ? "none" : "translateY(14px)",
      }}
    >
      <span className="relative flex h-6 w-6 items-center justify-center">
        <span
          aria-hidden
          className="absolute inset-0 rounded-full bg-accent-ink/20 motion-safe:animate-[ring-pulse_2.6s_ease-out_infinite]"
        />
        <WhatsAppIcon className="relative h-5 w-5" />
      </span>
      <span className="max-w-0 overflow-hidden whitespace-nowrap text-[0.6875rem] font-medium uppercase tracking-[0.18em] opacity-0 transition-all duration-500 group-hover:max-w-[9rem] group-hover:opacity-100 group-focus-visible:max-w-[9rem] group-focus-visible:opacity-100">
        {label}
      </span>
    </a>
  );
}
