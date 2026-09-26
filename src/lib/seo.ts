import "server-only";

import { headers } from "next/headers";

import type { Locale } from "@/lib/cms/types";

/** Absolute origin: NEXT_PUBLIC_SITE_URL, else the request's own host. */
export async function getSiteUrl(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (configured) return configured;
  const list = await headers();
  const host = list.get("x-forwarded-host") ?? list.get("host") ?? "localhost:3000";
  const proto = list.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export function absoluteUrl(base: string, value: string): string {
  if (!value) return "";
  try {
    return new URL(value, `${base}/`).toString();
  } catch {
    return "";
  }
}

/** The page path forwarded by middleware.ts, and whether ?lang= was explicit. */
export async function currentPath(): Promise<{ path: string; explicitLocale: boolean }> {
  const list = await headers();
  return { path: list.get("x-pathname") || "/", explicitLocale: Boolean(list.get("x-locale")) };
}

export function languageUrl(path: string, locale: Locale): string {
  return `${path}?lang=${locale}`;
}

/** JSON for a <script type="application/ld+json">, safe against </script>. */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
