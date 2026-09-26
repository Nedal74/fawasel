"use client";

import { Languages } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { LOCALE_COOKIE } from "@/lib/locale";
import type { Locale } from "@/lib/cms/types";
import { cn } from "@/lib/utils";

/** Switches locale by writing the preference cookie and re-rendering the tree. */
export function LanguageToggle({
  locale,
  label,
  className,
}: {
  locale: Locale;
  label: string;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const switchTo = locale === "en" ? "ar" : "en";

  return (
    <button
      type="button"
      disabled={pending}
      aria-label={`Switch language to ${switchTo === "ar" ? "Arabic" : "English"}`}
      onClick={() => {
        document.cookie = `${LOCALE_COOKIE}=${switchTo}; path=/; max-age=31536000; samesite=lax`;
        // A ?lang= URL pins its language, so move to the other language's URL.
        if (searchParams.has("lang")) {
          const params = new URLSearchParams(searchParams.toString());
          params.set("lang", switchTo);
          startTransition(() => router.replace(`${pathname}?${params.toString()}`));
          return;
        }
        startTransition(() => router.refresh());
      }}
      className={cn(
        "inline-flex items-center gap-1.5 text-[0.6875rem] uppercase tracking-[0.18em] text-muted transition-colors hover:text-offwhite disabled:opacity-60",
        className,
      )}
    >
      <Languages className="h-3.5 w-3.5" aria-hidden />
      {label}
    </button>
  );
}
