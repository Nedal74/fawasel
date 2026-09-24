import { Facebook, Globe, Instagram, Linkedin } from "lucide-react";

import { BehanceIcon, TikTokIcon, WhatsAppIcon } from "@/components/ui/BrandIcons";
import type { Locale, SocialLink } from "@/lib/cms/types";
import { pick } from "@/lib/locale";
import { cn } from "@/lib/utils";

const glyphs: Record<string, React.ComponentType<{ className?: string }>> = {
  linkedin: Linkedin,
  facebook: Facebook,
  instagram: Instagram,
  tiktok: TikTokIcon,
  behance: BehanceIcon,
  whatsapp: WhatsAppIcon,
};

/** Small icon buttons; label stays available to assistive tech. */
export function SocialIcons({
  socials,
  locale,
  className,
  tone = "dark",
}: {
  socials: SocialLink[];
  locale: Locale;
  className?: string;
  tone?: "dark" | "light";
}) {
  if (socials.length === 0) return null;

  return (
    <ul className={cn("flex flex-wrap items-center gap-2", className)}>
      {socials.map((social) => {
        const Icon = glyphs[social.platform.toLowerCase()] ?? Globe;
        const label = pick(social.label, locale) || social.platform;
        return (
          <li key={social.id}>
            <a
              href={social.url}
              target="_blank"
              rel="noreferrer noopener"
              aria-label={label}
              title={label}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full border transition-colors duration-300",
                tone === "dark"
                  ? "border-[var(--color-line)] text-muted hover:border-accent hover:bg-accent hover:text-accent-ink"
                  : "border-black/15 text-black/60 hover:border-transparent hover:bg-accent hover:text-accent-ink",
              )}
            >
              <Icon className="h-4 w-4" />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
