import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic, JetBrains_Mono } from "next/font/google";

import { getSettings } from "@/lib/cms/queries";
import { dirFor, getLocale, pick } from "@/lib/i18n";
import { currentPath, getSiteUrl, languageUrl } from "@/lib/seo";

import "./globals.css";

const jetbrains = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

const arabic = IBM_Plex_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const [settings, locale, base, { path, explicitLocale }] = await Promise.all([
    getSettings(),
    getLocale(),
    getSiteUrl(),
    currentPath(),
  ]);
  const title = pick(settings.siteTitle, locale);
  const description = pick(settings.siteDescription, locale);

  // hreflang: every public page exists in both languages at ?lang=…; the bare
  // URL (cookie/default language) is the x-default.
  const alternates = path.startsWith("/admin")
    ? undefined
    : {
        canonical: explicitLocale ? languageUrl(path, locale) : path,
        languages: {
          en: languageUrl(path, "en"),
          ar: languageUrl(path, "ar"),
          "x-default": path,
        },
      };

  return {
    metadataBase: new URL(base),
    alternates,
    title: { default: title, template: `%s — NEDAL ELABID` },
    description,
    keywords: settings.keywords.split(",").map((k) => k.trim()).filter(Boolean),
    icons: { icon: settings.favicon || "/favicon.ico" },
    openGraph: {
      type: "profile",
      title,
      description,
      locale: locale === "ar" ? "ar_SA" : "en_US",
      alternateLocale: locale === "ar" ? "en_US" : "ar_SA",
      images: settings.ogImage ? [{ url: settings.ogImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: settings.ogImage ? [settings.ogImage] : undefined,
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#08090b",
  colorScheme: "dark",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [settings, locale] = await Promise.all([getSettings(), getLocale()]);

  return (
    <html
      lang={locale}
      dir={dirFor(locale)}
      className={`${jetbrains.variable} ${arabic.variable}`}
      style={
        {
          "--accent-from": settings.accentFrom,
          "--accent-to": settings.accentTo,
          "--accent": settings.accentTo,
          "--visual-intensity": String((settings.visualIntensity ?? 70) / 100),
        } as React.CSSProperties
      }
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  );
}
