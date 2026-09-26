"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { track } from "@/lib/track-client";

const WHATSAPP_LINK = /(^|\/\/)(wa\.me|api\.whatsapp\.com|web\.whatsapp\.com)\//i;

/**
 * Records a page view per client-side navigation, and every click on a
 * WhatsApp link anywhere on the site (floating button, contact section,
 * footer, chatbot). Links can name their placement with data-track-label.
 */
export function SiteTracker() {
  const pathname = usePathname();

  useEffect(() => {
    track("pageview");
  }, [pathname]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = event.target as Element | null;
      const link = target?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link || !WHATSAPP_LINK.test(link.href)) return;
      track("whatsapp_click", link.dataset.trackLabel || "site");
    }
    // Capture phase so it runs even if a handler stops propagation.
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
