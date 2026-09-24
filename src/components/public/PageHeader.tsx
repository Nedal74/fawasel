import { Container } from "@/components/ui/Container";
import { DataTicks, TechLabel } from "@/components/ui/Decor";

export function PageHeader({
  eyebrow,
  title,
  intro,
  meta,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  meta?: string;
}) {
  return (
    <Container as="header" className="grain relative pb-14 pt-40 lg:pb-20 lg:pt-48">
      <div className="grid-field pointer-events-none absolute inset-0 -z-10 opacity-50" aria-hidden />
      <div className="flex items-center gap-3">
        <span className="animate-tick block h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
        <span className="label">{eyebrow}</span>
        <span className="accent-rule h-px w-16 opacity-70" aria-hidden />
      </div>
      <h1 className="display animate-mask-up mt-6 text-[clamp(2.5rem,7vw,5.5rem)]" style={{ animationDelay: "0.15s" }}>
        {title}
      </h1>
      {intro ? (
        <p className="animate-rise mt-6 max-w-2xl text-sm leading-relaxed text-muted" style={{ animationDelay: "0.35s" }}>
          {intro}
        </p>
      ) : null}
      <div className="mt-10 flex items-center justify-between border-t border-[var(--color-line)] pt-4">
        <TechLabel>{meta ?? "NEDAL ELABID · MARKETING INTELLIGENCE"}</TechLabel>
        <DataTicks className="h-3" />
      </div>
    </Container>
  );
}
