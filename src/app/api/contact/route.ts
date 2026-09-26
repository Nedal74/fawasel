import { NextResponse } from "next/server";
import { z } from "zod";

import { getStore } from "@/lib/cms/store";
import { cleanPath, requestContext } from "@/lib/tracking/request";
import { cleanSource } from "@/lib/tracking/sources";
import { safely } from "@/lib/tracking/store";

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  company: z.string().trim().max(160).optional().default(""),
  // Only name and phone are required on the public form.
  email: z.union([z.string().trim().email().max(160), z.literal("")]).optional().default(""),
  phone: z.string().trim().min(5).max(60),
  service: z.string().trim().max(160).optional().default(""),
  budget: z.string().trim().max(80).optional().default(""),
  brief: z.string().trim().max(4000).optional().default(""),
  // Where the visitor converted from (see src/lib/track-client.ts). Optional so
  // older clients and plain API calls keep working.
  meta: z
    .object({
      sessionId: z.string().regex(/^[a-zA-Z0-9_-]{8,64}$/).optional(),
      source: z.string().max(80).optional(),
      page: z.string().max(500).optional(),
      locale: z.enum(["en", "ar"]).optional(),
    })
    .optional(),
});

/** Strips tags and control characters so stored text is safe to render back. */
function sanitize(value: string): string {
  const withoutTags = value.replace(/<[^>]*>/g, "");
  return Array.from(withoutTags)
    .filter((char) => {
      const code = char.codePointAt(0) ?? 0;
      return char === "\n" || (code >= 32 && code !== 127);
    })
    .join("")
    .trim();
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 422 });
  }

  const data = parsed.data;
  const store = await getStore();
  await store.create("inquiries", {
    name: sanitize(data.name),
    company: sanitize(data.company),
    email: sanitize(data.email),
    phone: sanitize(data.phone),
    service: sanitize(data.service),
    budget: sanitize(data.budget),
    brief: sanitize(data.brief),
    handled: false,
  });

  // Lead list + conversion event. Never fails the submission itself.
  const meta = data.meta ?? {};
  const context = await requestContext();
  const page = cleanPath(meta.page);
  const source = cleanSource(meta.source ?? "direct");
  await safely("contact lead", (tracking) =>
    tracking.createLead({
      name: sanitize(data.name),
      phone: sanitize(data.phone),
      email: sanitize(data.email),
      message: sanitize([data.service, data.budget, data.brief].filter(Boolean).join(" · ")),
      page,
      source,
      origin: "contact_form",
      conversationId: null,
      handled: false,
    }),
  );
  if (meta.sessionId && !context.bot) {
    await safely("contact event", (tracking) =>
      tracking.recordEvent({
        sessionId: meta.sessionId!,
        type: "form_submit",
        path: page,
        source,
        referrer: "",
        device: context.device,
        locale: meta.locale ?? "",
        country: context.country,
        label: "contact_form",
      }),
    );
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
