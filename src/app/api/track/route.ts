import { z } from "zod";

import { cleanPath, requestContext } from "@/lib/tracking/request";
import { cleanSource } from "@/lib/tracking/sources";
import { safely } from "@/lib/tracking/store";
import { CLIENT_EVENT_TYPES } from "@/lib/tracking/types";

const schema = z.object({
  type: z.enum(CLIENT_EVENT_TYPES),
  sessionId: z.string().regex(/^[a-zA-Z0-9_-]{8,64}$/),
  path: z.string().max(500).optional(),
  source: z.string().max(80).optional(),
  referrer: z.string().max(200).optional(),
  locale: z.enum(["en", "ar"]).optional(),
  label: z.string().max(60).optional(),
});

/**
 * First-party analytics beacon. No cookies are read or set for visitors; the
 * session id is a random value the browser keeps in sessionStorage.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    // sendBeacon posts text/plain, so parse the raw text.
    body = JSON.parse(await request.text());
  } catch {
    return new Response(null, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return new Response(null, { status: 422 });

  const context = await requestContext();
  const data = parsed.data;
  const path = cleanPath(data.path);
  if (context.bot || context.isAdmin || path.startsWith("/admin")) {
    return new Response(null, { status: 204 });
  }

  await safely("track", (store) =>
    store.recordEvent({
      sessionId: data.sessionId,
      type: data.type,
      path,
      source: cleanSource(data.source ?? "direct"),
      referrer: (data.referrer ?? "").replace(/[^a-z0-9.:-]/gi, "").slice(0, 120),
      device: context.device,
      locale: data.locale ?? "",
      country: context.country,
      label: (data.label ?? "").replace(/[^\p{L}\p{N} _-]/gu, "").slice(0, 60),
    }),
  );
  return new Response(null, { status: 204 });
}
