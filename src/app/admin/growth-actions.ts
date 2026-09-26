"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import type { ActionState } from "@/app/admin/actions";
import { requireSession } from "@/lib/auth";
import { seedData } from "@/lib/cms/defaults";
import { getStore } from "@/lib/cms/store";
import type { ChatbotConfig } from "@/lib/cms/types";
import { getTrackingStore } from "@/lib/tracking/store";

/* Leads, conversations, unanswered questions and the chatbot config. */

/* ----------------------------------------------------------------- leads -- */

export async function setLeadHandledAction(id: string, handled: boolean): Promise<void> {
  await requireSession();
  await (await getTrackingStore()).updateLead(id, { handled });
  revalidatePath("/admin/analytics");
}

export async function deleteLeadAction(id: string): Promise<void> {
  await requireSession();
  await (await getTrackingStore()).removeLead(id);
  revalidatePath("/admin/analytics");
}

/* --------------------------------------------------------- conversations -- */

export async function setConversationLeadAction(id: string, isLead: boolean): Promise<void> {
  await requireSession();
  await (await getTrackingStore()).updateConversation(id, { isLead });
  revalidatePath("/admin/conversations");
  revalidatePath(`/admin/conversations/${id}`);
}

export async function deleteConversationAction(id: string, backToList = false): Promise<void> {
  await requireSession();
  await (await getTrackingStore()).removeConversation(id);
  revalidatePath("/admin/conversations");
  if (backToList) redirect("/admin/conversations");
}

/* ------------------------------------------------------------ unanswered -- */

/** Resolves (or reopens) every open copy of the same question at once. */
export async function setUnansweredResolvedAction(ids: string[], resolved: boolean): Promise<void> {
  await requireSession();
  const store = await getTrackingStore();
  await Promise.all(ids.map((id) => store.updateUnanswered(id, { resolved })));
  revalidatePath("/admin/unanswered");
}

export async function deleteUnansweredAction(ids: string[]): Promise<void> {
  await requireSession();
  const store = await getTrackingStore();
  await Promise.all(ids.map((id) => store.removeUnanswered(id)));
  revalidatePath("/admin/unanswered");
}

/* --------------------------------------------------------------- chatbot -- */

const localized = z.object({
  en: z.string().trim().max(2000),
  ar: z.string().trim().max(2000),
});

const chatbotSchema = z.object({
  enabled: z.boolean(),
  delaySeconds: z.number().int().min(1).max(120),
  botName: localized,
  teaser: localized,
  startStepId: z.string().min(1).max(64),
  askPrompt: localized,
  noAnswer: localized,
  leadPrompt: localized,
  leadThanks: localized,
  whatsappMessage: localized,
  synonyms: z.array(z.string().trim().max(2000)).max(200),
  steps: z
    .array(
      z.object({
        id: z.string().regex(/^[a-zA-Z0-9_-]{1,64}$/),
        name: z.string().trim().max(120),
        message: localized,
        options: z
          .array(
            z.object({
              id: z.string().regex(/^[a-zA-Z0-9_-]{1,64}$/),
              label: localized,
              action: z.enum(["step", "ask", "lead", "whatsapp", "link", "end"]),
              target: z.string().trim().max(500),
            }),
          )
          .max(12),
      }),
    )
    .min(1)
    .max(60),
});

export async function saveChatbotAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireSession();
  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("config") ?? ""));
  } catch {
    return { error: "Invalid data." };
  }
  const parsed = chatbotSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { error: `Invalid ${issue?.path.join(".") || "data"}: ${issue?.message ?? ""}` };
  }

  const config = parsed.data;
  const stepIds = new Set(config.steps.map((step) => step.id));
  if (stepIds.size !== config.steps.length) return { error: "Two steps share the same id." };
  if (!stepIds.has(config.startStepId)) config.startStepId = config.steps[0].id;
  for (const step of config.steps) {
    step.options = step.options
      .filter((option) => option.label.en || option.label.ar)
      .map((option) => ({
        ...option,
        // A choice pointing at a deleted step falls back to the first step.
        target:
          option.action === "step"
            ? stepIds.has(option.target)
              ? option.target
              : config.startStepId
            : option.action === "link"
              ? option.target
              : "",
      }));
  }
  config.synonyms = config.synonyms.filter(Boolean);

  const store = await getStore();
  const current = (await store.list("chatbot"))[0];
  if (current) await store.update("chatbot", current.id, config as Partial<ChatbotConfig>);
  else {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, createdAt, updatedAt, ...defaults } = seedData().chatbot[0];
    await store.create("chatbot", { ...defaults, ...config });
  }

  revalidatePath("/", "layout");
  return { ok: true };
}
