import Link from "next/link";

import { cn } from "@/lib/utils";

type Variant = "accent" | "outline" | "ghost";

const base =
  "btn-shine inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-xs font-medium uppercase tracking-[0.18em] transition-transform duration-300 hover:scale-[1.02] active:scale-[0.99] disabled:opacity-50 disabled:hover:scale-100";

const variants: Record<Variant, string> = {
  accent:
    "btn-accent shadow-[0_0_28px_-10px_var(--accent)]",
  outline:
    "border border-[var(--color-line-strong)] text-offwhite transition-colors hover:border-accent hover:text-accent",
  ghost: "text-muted hover:text-offwhite",
};

export function Button({
  variant = "accent",
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button className={cn(base, variants[variant], className)} {...props}>
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = "accent",
  className,
  children,
  external,
  ...props
}: {
  href: string;
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
  external?: boolean;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  const classes = cn(base, variants[variant], className);
  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer noopener" className={classes} {...props}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={classes} {...props}>
      {children}
    </Link>
  );
}
