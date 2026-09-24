import { FloatingWhatsApp } from "@/components/public/FloatingWhatsApp";
import { Footer } from "@/components/public/Footer";
import { Navbar } from "@/components/public/Navbar";
import { getStrings } from "@/i18n/strings";
import {
  getContentMap,
  getNavigation,
  getSettings,
  getSocialLinks,
} from "@/lib/cms/queries";
import { getLocale, makeCopy, pick } from "@/lib/i18n";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const [settings, navigation, socials, content] = await Promise.all([
    getSettings(),
    getNavigation(),
    getSocialLinks(),
    getContentMap(),
  ]);

  const strings = getStrings(locale);
  const copy = makeCopy(content, locale);

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-offwhite focus:px-4 focus:py-2 focus:text-xs focus:text-void"
      >
        {strings.skipToContent}
      </a>

      <Navbar
        locale={locale}
        languageLabel={strings.languageToggle}
        menuLabel={strings.menu}
        closeLabel={strings.close}
        ctaLabel={strings.letsWork}
        brand={copy("hero.name")}
        items={navigation.map((item) => ({
          id: item.id,
          href: item.href,
          label: pick(item.label, locale),
        }))}
      />

      <main id="main">{children}</main>

      <FloatingWhatsApp
        phone={settings.whatsapp}
        label={strings.letsTalk}
        message={`${copy("hero.name")} — ${strings.startProject}`}
      />

      <Footer
        settings={settings}
        navigation={navigation}
        socials={socials}
        locale={locale}
        copy={copy}
        strings={strings}
      />
    </>
  );
}
