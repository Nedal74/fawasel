"use client";

import { ArrowDown, ArrowUp, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { useActionState, useState } from "react";

import type { ActionState } from "@/app/admin/actions";
import { saveChatbotAction } from "@/app/admin/growth-actions";
import type { AdminStrings } from "@/i18n/admin";
import type { ChatActionType, ChatbotConfig, ChatOption, ChatStep, Localized } from "@/lib/cms/types";

type Editable = Omit<ChatbotConfig, "id" | "createdAt" | "updatedAt">;

const small = "inline-flex h-8 w-8 items-center justify-center rounded border border-[var(--color-line)] text-dim transition-colors hover:text-offwhite disabled:opacity-30";

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function move<T>(list: T[], index: number, delta: number): T[] {
  const target = index + delta;
  if (target < 0 || target >= list.length) return list;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

/** Edits the whole chatbot document and saves it as one JSON payload. */
export function ChatbotEditor({ initial, t }: { initial: Editable; t: AdminStrings }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(saveChatbotAction, {});
  const [config, setConfig] = useState<Editable>(initial);
  const [synonyms, setSynonyms] = useState(initial.synonyms.join("\n"));

  const set = <K extends keyof Editable>(key: K, value: Editable[K]) => setConfig((current) => ({ ...current, [key]: value }));
  const setStep = (index: number, step: ChatStep) =>
    setConfig((current) => ({ ...current, steps: current.steps.map((item, i) => (i === index ? step : item)) }));

  const actions: { value: ChatActionType; label: string }[] = [
    { value: "step", label: t.actionStep },
    { value: "ask", label: t.actionAsk },
    { value: "lead", label: t.actionLead },
    { value: "whatsapp", label: t.actionWhatsapp },
    { value: "link", label: t.actionLink },
    { value: "end", label: t.actionEnd },
  ];

  const payload = JSON.stringify({
    ...config,
    delaySeconds: Math.round(Number(config.delaySeconds) || 7),
    synonyms: synonyms.split("\n").map((line) => line.trim()).filter(Boolean),
  });

  return (
    <form action={formAction} className="space-y-10 pb-24">
      <input type="hidden" name="config" value={payload} />

      <section>
        <h2 className="admin-label border-b border-[var(--color-line)] pb-2">{t.chatbotGeneral}</h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <label className="flex items-center gap-3 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(event) => set("enabled", event.target.checked)}
              className="h-4 w-4 accent-[var(--accent)]"
            />
            {t.chatbotEnabled}
          </label>
          <div>
            <label className="admin-label" htmlFor="chatbot-delay">
              {t.chatbotDelay}
            </label>
            <input
              id="chatbot-delay"
              type="number"
              min={1}
              max={120}
              value={config.delaySeconds}
              onChange={(event) => set("delaySeconds", Number(event.target.value))}
              className="admin-input max-w-[8rem]"
            />
            <p className="mt-1 text-xs text-dim">{t.chatbotDelayHelp}</p>
          </div>
          <div>
            <label className="admin-label" htmlFor="chatbot-start">
              {t.chatbotStart}
            </label>
            <select
              id="chatbot-start"
              value={config.startStepId}
              onChange={(event) => set("startStepId", event.target.value)}
              className="admin-input"
            >
              {config.steps.map((step) => (
                <option key={step.id} value={step.id}>
                  {step.name || step.id}
                </option>
              ))}
            </select>
          </div>
          <LocalizedInput id="botName" label={t.chatbotName} value={config.botName} onChange={(value) => set("botName", value)} t={t} />
          <LocalizedInput id="teaser" label={t.chatbotTeaser} value={config.teaser} onChange={(value) => set("teaser", value)} t={t} />
        </div>
      </section>

      <section>
        <h2 className="admin-label border-b border-[var(--color-line)] pb-2">{t.chatbotFlow}</h2>
        <p className="mt-3 max-w-3xl text-sm text-dim">{t.chatbotFlowHelp}</p>
        <ol className="mt-5 space-y-5">
          {config.steps.map((step, index) => (
            <li key={step.id} className="rounded border border-[var(--color-line)] bg-ink p-4 sm:p-5" data-step={step.id}>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded bg-graphite px-2 py-1 text-[0.625rem] uppercase tracking-[0.14em] text-muted">
                  {t.stepLabel} {index + 1}
                  {step.id === config.startStepId ? " · ★" : ""}
                </span>
                <input
                  aria-label={t.stepName}
                  value={step.name}
                  onChange={(event) => setStep(index, { ...step, name: event.target.value })}
                  placeholder={t.stepName}
                  className="admin-input max-w-xs"
                />
                <div className="ms-auto flex gap-1.5">
                  <button type="button" className={small} aria-label={t.moveUp} disabled={index === 0} onClick={() => set("steps", move(config.steps, index, -1))}>
                    <ArrowUp className="h-3.5 w-3.5" aria-hidden />
                  </button>
                  <button
                    type="button"
                    className={small}
                    aria-label={t.moveDown}
                    disabled={index === config.steps.length - 1}
                    onClick={() => set("steps", move(config.steps, index, 1))}
                  >
                    <ArrowDown className="h-3.5 w-3.5" aria-hidden />
                  </button>
                  <button
                    type="button"
                    className={`${small} hover:border-accent hover:text-accent`}
                    aria-label={t.removeStep}
                    title={t.removeStep}
                    disabled={config.steps.length === 1}
                    onClick={() => {
                      if (!confirm(`${t.removeStep}?`)) return;
                      const steps = config.steps.filter((_, i) => i !== index);
                      setConfig((current) => ({
                        ...current,
                        steps,
                        startStepId: current.startStepId === step.id ? steps[0].id : current.startStepId,
                      }));
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </div>
              </div>

              <div className="mt-4">
                <LocalizedInput
                  id={`${step.id}-message`}
                  label={t.stepMessage}
                  value={step.message}
                  onChange={(value) => setStep(index, { ...step, message: value })}
                  t={t}
                  area
                />
              </div>

              <p className="admin-label mt-5">{t.choicesLabel}</p>
              <ul className="mt-2 space-y-3">
                {step.options.map((option, optionIndex) => {
                  const setOption = (next: ChatOption) =>
                    setStep(index, { ...step, options: step.options.map((item, i) => (i === optionIndex ? next : item)) });
                  return (
                    <li key={option.id} className="rounded border border-[var(--color-line)] bg-void p-3">
                      <div className="grid gap-3 lg:grid-cols-[1fr_1fr_12rem_12rem_auto] lg:items-end">
                        <div>
                          <label className="admin-label" htmlFor={`${option.id}-en`}>
                            {t.choiceLabel} · {t.english}
                          </label>
                          <input
                            id={`${option.id}-en`}
                            value={option.label.en}
                            onChange={(event) => setOption({ ...option, label: { ...option.label, en: event.target.value } })}
                            className="admin-input"
                          />
                        </div>
                        <div>
                          <label className="admin-label" htmlFor={`${option.id}-ar`}>
                            {t.choiceLabel} · {t.arabic}
                          </label>
                          <input
                            id={`${option.id}-ar`}
                            dir="rtl"
                            value={option.label.ar}
                            onChange={(event) => setOption({ ...option, label: { ...option.label, ar: event.target.value } })}
                            className="admin-input"
                          />
                        </div>
                        <div>
                          <label className="admin-label" htmlFor={`${option.id}-action`}>
                            {t.choiceAction}
                          </label>
                          <select
                            id={`${option.id}-action`}
                            value={option.action}
                            onChange={(event) =>
                              setOption({
                                ...option,
                                action: event.target.value as ChatActionType,
                                target: event.target.value === "step" ? config.steps[0].id : "",
                              })
                            }
                            className="admin-input"
                          >
                            {actions.map((action) => (
                              <option key={action.value} value={action.value}>
                                {action.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          {option.action === "step" ? (
                            <>
                              <label className="admin-label" htmlFor={`${option.id}-target`}>
                                {t.choiceTarget}
                              </label>
                              <select
                                id={`${option.id}-target`}
                                value={option.target}
                                onChange={(event) => setOption({ ...option, target: event.target.value })}
                                className="admin-input"
                              >
                                {config.steps.map((target) => (
                                  <option key={target.id} value={target.id}>
                                    {target.name || target.id}
                                  </option>
                                ))}
                              </select>
                            </>
                          ) : option.action === "link" ? (
                            <>
                              <label className="admin-label" htmlFor={`${option.id}-target`}>
                                {t.choiceUrl}
                              </label>
                              <input
                                id={`${option.id}-target`}
                                dir="ltr"
                                value={option.target}
                                placeholder="/projects"
                                onChange={(event) => setOption({ ...option, target: event.target.value })}
                                className="admin-input"
                              />
                            </>
                          ) : null}
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            className={small}
                            aria-label={t.moveUp}
                            disabled={optionIndex === 0}
                            onClick={() => setStep(index, { ...step, options: move(step.options, optionIndex, -1) })}
                          >
                            <ArrowUp className="h-3.5 w-3.5" aria-hidden />
                          </button>
                          <button
                            type="button"
                            className={small}
                            aria-label={t.moveDown}
                            disabled={optionIndex === step.options.length - 1}
                            onClick={() => setStep(index, { ...step, options: move(step.options, optionIndex, 1) })}
                          >
                            <ArrowDown className="h-3.5 w-3.5" aria-hidden />
                          </button>
                          <button
                            type="button"
                            className={`${small} hover:border-accent hover:text-accent`}
                            aria-label={t.removeChoice}
                            title={t.removeChoice}
                            onClick={() => setStep(index, { ...step, options: step.options.filter((_, i) => i !== optionIndex) })}
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden />
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <button
                type="button"
                disabled={step.options.length >= 12}
                onClick={() =>
                  setStep(index, {
                    ...step,
                    options: [
                      ...step.options,
                      { id: uid("opt"), label: { en: "", ar: t.newChoice }, action: "step", target: config.startStepId },
                    ],
                  })
                }
                className="mt-3 inline-flex items-center gap-1.5 rounded border border-[var(--color-line)] px-3 py-1.5 text-[0.6875rem] uppercase tracking-[0.12em] text-muted hover:text-offwhite disabled:opacity-40"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden />
                {t.addChoice}
              </button>
            </li>
          ))}
        </ol>
        <button
          type="button"
          onClick={() =>
            set("steps", [
              ...config.steps,
              { id: uid("step"), name: t.newStepName, message: { en: "", ar: "" }, options: [] },
            ])
          }
          className="mt-5 inline-flex items-center gap-2 rounded border border-accent px-4 py-2 text-[0.6875rem] uppercase tracking-[0.12em] text-offwhite hover:bg-accent hover:text-accent-ink"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          {t.addStep}
        </button>
      </section>

      <section>
        <h2 className="admin-label border-b border-[var(--color-line)] pb-2">{t.chatbotTexts}</h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <LocalizedInput id="askPrompt" label={t.chatbotAskPrompt} value={config.askPrompt} onChange={(value) => set("askPrompt", value)} t={t} area />
          <LocalizedInput id="noAnswer" label={t.chatbotNoAnswer} value={config.noAnswer} onChange={(value) => set("noAnswer", value)} t={t} area />
          <LocalizedInput id="leadPrompt" label={t.chatbotLeadPrompt} value={config.leadPrompt} onChange={(value) => set("leadPrompt", value)} t={t} area />
          <LocalizedInput id="leadThanks" label={t.chatbotLeadThanks} value={config.leadThanks} onChange={(value) => set("leadThanks", value)} t={t} area />
          <LocalizedInput
            id="whatsappMessage"
            label={t.chatbotWhatsappMessage}
            value={config.whatsappMessage}
            onChange={(value) => set("whatsappMessage", value)}
            t={t}
            area
          />
        </div>
      </section>

      <section>
        <h2 className="admin-label border-b border-[var(--color-line)] pb-2">{t.chatbotSynonyms}</h2>
        <p className="mt-3 max-w-3xl text-sm text-dim">{t.chatbotSynonymsHelp}</p>
        <textarea
          aria-label={t.chatbotSynonyms}
          value={synonyms}
          onChange={(event) => setSynonyms(event.target.value)}
          rows={10}
          dir="auto"
          className="admin-input mt-3 font-mono text-xs leading-relaxed"
        />
      </section>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--color-line)] bg-ink/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-5 py-3 lg:ps-[17rem] lg:pe-8">
          <p className="text-xs" role="status">
            {state.error ? (
              <span className="text-accent">{state.error}</span>
            ) : state.ok ? (
              <span className="text-emerald-400">{t.chatbotSaved}</span>
            ) : (
              <span className="text-dim">{t.chatbotNote}</span>
            )}
          </p>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 rounded btn-accent px-5 py-2 text-[0.6875rem] font-medium uppercase tracking-[0.12em] disabled:opacity-60"
          >
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Save className="h-3.5 w-3.5" aria-hidden />}
            {t.saveChatbot}
          </button>
        </div>
      </div>
    </form>
  );
}

function LocalizedInput({
  id,
  label,
  value,
  onChange,
  t,
  area = false,
}: {
  id: string;
  label: string;
  value: Localized;
  onChange: (value: Localized) => void;
  t: AdminStrings;
  area?: boolean;
}) {
  const Tag = area ? "textarea" : "input";
  return (
    <fieldset className="sm:col-span-1">
      <legend className="admin-label">{label}</legend>
      <div className="grid gap-2">
        <Tag
          id={`${id}-en`}
          aria-label={`${label} · ${t.english}`}
          value={value.en}
          rows={area ? 2 : undefined}
          placeholder={t.english}
          onChange={(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange({ ...value, en: event.target.value })}
          className="admin-input"
        />
        <Tag
          id={`${id}-ar`}
          aria-label={`${label} · ${t.arabic}`}
          dir="rtl"
          value={value.ar}
          rows={area ? 2 : undefined}
          placeholder={t.arabic}
          onChange={(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange({ ...value, ar: event.target.value })}
          className="admin-input"
        />
      </div>
    </fieldset>
  );
}
