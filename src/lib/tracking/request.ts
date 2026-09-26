import "server-only";

import { headers } from "next/headers";

import { getSession } from "@/lib/auth";

import { deviceFromUserAgent, isBot } from "./sources";

/** Request facts the server derives itself rather than trusting the browser. */
export async function requestContext() {
  const list = await headers();
  const ua = list.get("user-agent") ?? "";
  return {
    ua,
    bot: isBot(ua),
    device: deviceFromUserAgent(ua),
    // Set by Vercel's edge from the visitor IP; the IP itself is never stored.
    country: (list.get("x-vercel-ip-country") ?? "").slice(0, 2).toUpperCase(),
    /** The site owner's own visits stay out of the numbers. */
    isAdmin: Boolean(await getSession().catch(() => null)),
  };
}

/** Keeps only a path (no query string, no host) and caps its length. */
export function cleanPath(value: string | undefined): string {
  if (!value) return "/";
  const pathOnly = value.split(/[?#]/)[0] || "/";
  return (pathOnly.startsWith("/") ? pathOnly : `/${pathOnly}`).slice(0, 200);
}
