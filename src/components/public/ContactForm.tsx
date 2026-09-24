"use client";

import { ArrowRight, Check, Loader2 } from "lucide-react";
import { useState } from "react";

import type { UiStrings } from "@/i18n/strings";

type Status = "idle" | "sending" | "sent" | "error";

/**
 * Project inquiry form. Only name and phone are required — everything else is
 * optional so the form stays a low-friction conversion point.
 */
export function ContactForm({
  strings,
  services,
  successMessage,
}: {
  strings: UiStrings;
  services: string[];
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
    if (data.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      nextErrors.email = strings.formInvalidEmail;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setStatus("sending");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("request failed");
      setStatus("sent");
      form.reset();
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="relative flex min-h-[420px] flex-col items-center justify-center gap-5 overflow-hidden border border-[var(--color-line)] bg-ink p-10 text-center">
        <div className="grid-field pointer-events-none absolute inset-0 opacity-40" aria-hidden />
        <span className="animate-rise relative flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-ink">
          <Check className="h-6 w-6" aria-hidden />
        </span>
        <p
          className="animate-rise relative max-w-sm text-base leading-relaxed text-offwhite"
          style={{ animationDelay: "0.12s" }}
          role="status"
        >
          {successMessage}
        </p>
        <span
          className="accent-rule animate-rise relative h-px w-16"
          style={{ animationDelay: "0.2s" }}
          aria-hidden
        />
      </div>
    );
  }

  const field = (
    name: string,
    label: string,
    type: "text" | "email" | "tel" = "text",
    required = false,
  ) => (
    <div>
      <label className="admin-label" htmlFor={`contact-${name}`}>
        {label}
        {required ? (
          <span className="text-accent"> *</span>
        ) : (
          <span className="text-dim"> ({strings.formOptional})</span>
        )}
      </label>
      <input
        id={`contact-${name}`}
        name={name}
        type={type}
        required={required}
        aria-invalid={Boolean(errors[name])}
        aria-describedby={errors[name] ? `contact-${name}-error` : undefined}
        className="admin-input"
      />
      {errors[name] ? (
        <p id={`contact-${name}-error`} className="mt-1.5 text-xs text-accent">
          {errors[name]}
        </p>
      ) : null}
    </div>
  );

  return (
    <form onSubmit={onSubmit} noValidate className="border border-[var(--color-line)] bg-ink p-6 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        {field("name", strings.formName, "text", true)}
        {field("phone", strings.formPhone, "tel", true)}
        {field("email", strings.formEmail, "email")}
        {field("company", strings.formCompany)}
        <div>
          <label className="admin-label" htmlFor="contact-service">
            {strings.formService} <span className="text-dim">({strings.formOptional})</span>
          </label>
          <select id="contact-service" name="service" className="admin-input" defaultValue="">
            <option value="">{strings.formSelect}</option>
            {services.map((service) => (
              <option key={service} value={service}>
                {service}
              </option>
            ))}
          </select>
        </div>
        {field("budget", strings.formBudget)}
      </div>

      <div className="mt-5">
        <label className="admin-label" htmlFor="contact-brief">
          {strings.formBrief} <span className="text-dim">({strings.formOptional})</span>
        </label>
        <textarea id="contact-brief" name="brief" rows={5} className="admin-input resize-y" />
      </div>

      {status === "error" ? (
        <p role="alert" className="mt-5 text-sm text-accent">
          {strings.formError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === "sending"}
        className="btn-shine btn-accent mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full px-8 py-4 text-xs font-medium uppercase tracking-[0.18em] disabled:opacity-60 sm:w-auto"
      >
        {status === "sending" ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
        )}
        {status === "sending" ? strings.formSending : strings.formSubmit}
      </button>
    </form>
  );
}
