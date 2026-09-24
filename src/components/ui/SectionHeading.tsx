import { Reveal, RevealWords, type RevealDirection } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";

/** Editorial section head: index tick, eyebrow, oversized title, thin rule. */
export function SectionHeading({
  eyebrow,
  title,
  intro,
  index,
  align = "start",
  from = "up",
  className,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  index?: string;
  align?: "start" | "center";
  from?: RevealDirection;
  className?: string;
}) {
  return (
    <div className={cn("max-w-3xl", align === "center" && "mx-auto text-center", className)}>
      <Reveal from={from}>
        <div className={cn("flex items-center gap-3", align === "center" && "justify-center")}>
          {index ? <span className="label text-accent">{index}</span> : null}
          {eyebrow ? <span className="label">{eyebrow}</span> : null}
          <span className="accent-rule h-px w-16" aria-hidden />
        </div>
      </Reveal>
      <RevealWords
        as="h2"
        text={title}
        delay={90}
        className="display mt-5 text-[clamp(2rem,5vw,3.75rem)]"
      />
      {intro ? (
        <Reveal from="up" delay={220}>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted">{intro}</p>
        </Reveal>
      ) : null}
    </div>
  );
}
