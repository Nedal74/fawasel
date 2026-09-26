import { Mail } from "lucide-react";

import { ContactForm } from "@/components/public/ContactForm";
import { SocialIcons } from "@/components/public/SocialIcons";
import { Container } from "@/components/ui/Container";
import { DataTicks, TechLabel } from "@/components/ui/Decor";
import { WhatsAppIcon } from "@/components/ui/BrandIcons";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { UiStrings } from "@/i18n/strings";
import type { Locale, Service, SiteSettings, SocialLink } from "@/lib/cms/types";
import { pick } from "@/lib/locale";
import { whatsappLink } from "@/lib/utils";

/** Conversion close: contact rail on one side, inquiry form on the other. */
export function ContactSection({
  settings,
  services,
  socials,
  locale,
  copy,
  strings,
}: {
  settings: SiteSettings;
  services: Service[];
  socials: SocialLink[];
  locale: Locale;
  copy: (key: string) => string;
  strings: UiStrings;
}) {
  return (
    <Container
      as="section"
      id="contact"
      className="border-t border-[var(--color-line)] py-24 lg:py-32"
    >
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <SectionHeading
            index="10"
            eyebrow={copy("contact.eyebrow")}
            title={copy("contact.heading")}
            intro={copy("contact.intro")}
            from="left"
          />

          <Reveal from="up" delay={120} className="mt-10 space-y-px border-y border-[var(--color-line)]">
            <a
              href={`mailto:${settings.email}`}
              className="group flex items-center gap-4 border-b border-[var(--color-line)] py-5 transition-colors hover:text-accent"
            >
              <Mail className="h-4 w-4 text-accent" aria-hidden />
              <span>
                <TechLabel>{strings.email}</TechLabel>
                <span className="block text-sm">{settings.email}</span>
              </span>
            </a>
            <a
              href={whatsappLink(settings.whatsapp)}
              data-track-label="contact"
              target="_blank"
              rel="noreferrer noopener"
              className="group flex items-center gap-4 py-5 transition-colors hover:text-accent"
            >
              <WhatsAppIcon className="h-4 w-4 text-accent" />
              <span>
                <TechLabel>{strings.whatsapp}</TechLabel>
                <span className="block text-sm" dir="ltr">
                  {settings.whatsapp}
                </span>
              </span>
            </a>
          </Reveal>

          <Reveal from="left" delay={200} className="mt-8">
            <SocialIcons socials={socials} locale={locale} />
            <DataTicks className="mt-10 h-4" />
          </Reveal>
        </div>

        <Reveal from="right" delay={120} className="lg:col-span-7">
          <ContactForm
            strings={strings}
            successMessage={copy("contact.success")}
            services={services.map((service) => pick(service.title, locale))}
          />
        </Reveal>
      </div>
    </Container>
  );
}
