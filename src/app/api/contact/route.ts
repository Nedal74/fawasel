import { NextResponse } from "next/server";
import { z } from "zod";

import { getStore } from "@/lib/cms/store";

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  company: z.string().trim().max(160).optional().default(""),
  // Only name and phone are required on the public form.
  email: z.union([z.string().trim().email().max(160), z.literal("")]).optional().default(""),
  phone: z.string().trim().min(5).max(60),
  service: z.string().trim().max(160).optional().default(""),
  budget: z.string().trim().max(80).optional().default(""),
  brief: z.string().trim().max(4000).optional().default(""),
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

  return NextResponse.json({ ok: true }, { status: 201 });
}
