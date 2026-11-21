"use client";

import { ArrowRight, Check, Loader2 } from "lucide-react";
import { useState } from "react";

import type { UiStrings } from "@/i18n/strings";
import { track, visitMeta } from "@/lib/track-client";

type Status = "idle" | "sending" | "sent" | "error";

/**
 * The shortest form on the site: a name and a phone number.
 *
 * It posts to the same endpoint as the main contact form, tagged with the
 * service page it came from, so a lead from an ad lands in the dashboard
 * knowing which page earned it.
 */
export function LandingLeadForm({
  strings,
  service,
  slug,
  buttonLabel,
  successMessage,
}: {
  strings: UiStrings;
  service: string;
  slug: string;
  buttonLabel: string;
  successMessage: string;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form)) as Record<string, string>;

    const nextErrors: Record<string, string> = {};
    if (!data.name?.trim()) nextErrors.name = strings.formRequired;
    if (!data.phone?.trim()) nextErrors.phone = strings.formRequired;
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setStatus("sending");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, service, meta: visitMeta() }),
      });
      if (!response.ok) throw new Error("request failed");
      track("form_submit", `landing:${slug}`);
      setStatus("sent");
      form.reset();
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="flex min-h-[132px] items-center justify-center gap-3 border border-accent/40 bg-accent/5 p-6 text-center">
        <Check className="h-5 w-5 shrink-0 text-accent" aria-hidden />
        <p className="text-sm text-offwhite">{successMessage}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
      <div>
        <label className="sr-only" htmlFor="lead-name">
          {strings.formName}
        </label>
        <input
          id="lead-name"
          name="name"
          autoComplete="name"
          placeholder={strings.formName}
          aria-invalid={Boolean(errors.name)}
          className="h-12 w-full border border-[var(--color-line)] bg-void px-4 text-sm text-offwhite outline-none transition-colors placeholder:text-dim focus:border-accent"
        />
        {errors.name ? <p className="mt-1.5 text-xs text-accent">{errors.name}</p> : null}
      </div>

      <div>
        <label className="sr-only" htmlFor="lead-phone">
          {strings.formPhone}
        </label>
        <input
          id="lead-phone"
          name="phone"
          type="tel"
          inputMode="tel"
          dir="ltr"
          autoComplete="tel"
          placeholder={strings.formPhone}
          aria-invalid={Boolean(errors.phone)}
          className="h-12 w-full border border-[var(--color-line)] bg-void px-4 text-sm text-offwhite outline-none transition-colors placeholder:text-dim focus:border-accent"
        />
        {errors.phone ? <p className="mt-1.5 text-xs text-accent">{errors.phone}</p> : null}
      </div>

      <div>
        <button
          type="submit"
          disabled={status === "sending"}
          className="group flex h-12 w-full items-center justify-center gap-2 bg-accent px-7 text-sm font-medium text-accent-ink transition-transform duration-300 hover:-translate-y-0.5 disabled:opacity-60 sm:w-auto"
        >
          {status === "sending" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              {strings.formSending}
            </>
          ) : (
            <>
              {buttonLabel || strings.formSubmit}
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 rtl:-scale-x-100" aria-hidden />
            </>
          )}
        </button>
        {status === "error" ? (
          <p className="mt-1.5 text-xs text-accent sm:absolute">{strings.formError}</p>
        ) : null}
      </div>
    </form>
  );
}
