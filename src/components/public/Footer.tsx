import Link from "next/link";

import { SocialIcons } from "@/components/public/SocialIcons";
import { DataTicks, TechLabel } from "@/components/ui/Decor";
import type { UiStrings } from "@/i18n/strings";
import type { Locale, NavigationItem, SiteSettings, SocialLink } from "@/lib/cms/types";
import { pick } from "@/lib/locale";
import { whatsappLink } from "@/lib/utils";

export function Footer({
  settings,
  navigation,
  socials,
  locale,
  copy,
  strings,
}: {
  settings: SiteSettings;
  navigation: NavigationItem[];
  socials: SocialLink[];
  locale: Locale;
  copy: (key: string) => string;
  strings: UiStrings;
}) {
  return (
    <footer className="grain relative border-t border-[var(--color-line)] bg-void">
      <div className="mx-auto grid w-full max-w-[1400px] gap-12 px-5 py-16 sm:px-8 lg:grid-cols-12 lg:px-12">
        <div className="lg:col-span-5">
          <p className="display text-[clamp(1.75rem,4vw,2.75rem)]">{copy("hero.name")}</p>
          <p className="label mt-2 text-accent">{copy("hero.title")}</p>
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-muted">
            {copy("footer.statement")}
          </p>
          <SocialIcons socials={socials} locale={locale} className="mt-8" />
        </div>

        <nav aria-label="Footer" className="lg:col-span-3">
          <TechLabel>{strings.navigation}</TechLabel>
          <ul className="mt-4 space-y-2">
            {navigation.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="text-sm text-muted transition-colors hover:text-accent"
                >
                  {pick(item.label, locale)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="lg:col-span-4">
          <TechLabel>{strings.connect}</TechLabel>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <a
                href={`mailto:${settings.email}`}
                className="text-muted transition-colors hover:text-accent"
              >
                {settings.email}
              </a>
            </li>
            <li>
              <a
                href={whatsappLink(settings.whatsapp)}
                target="_blank"
                rel="noreferrer noopener"
                dir="ltr"
                className="text-muted transition-colors hover:text-accent"
              >
                {settings.whatsapp}
              </a>
            </li>
          </ul>
          <DataTicks className="mt-8 h-4" />
        </div>
      </div>

      <div className="border-t border-[var(--color-line)]">
        <div className="mx-auto flex w-full max-w-[1400px] flex-wrap items-center justify-between gap-3 px-5 py-5 sm:px-8 lg:px-12">
          <TechLabel>
            © {new Date().getFullYear()} {copy("hero.name")} · {strings.rights}
          </TechLabel>
          <TechLabel className="flex items-center gap-2">
            <span className="animate-tick inline-block h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
            {strings.systemStatus}
          </TechLabel>
        </div>
      </div>
    </footer>
  );
}
