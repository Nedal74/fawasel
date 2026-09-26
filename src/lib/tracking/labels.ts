import type { Locale } from "@/lib/cms/types";

/** Display names for traffic-source buckets (see sources.ts). */
const SOURCE_NAMES: Record<string, { en: string; ar: string }> = {
  direct: { en: "Direct", ar: "مباشر" },
  google: { en: "Google", ar: "جوجل" },
  whatsapp: { en: "WhatsApp", ar: "واتساب" },
  linkedin: { en: "LinkedIn", ar: "لينكدإن" },
  facebook: { en: "Facebook", ar: "فيسبوك" },
  instagram: { en: "Instagram", ar: "إنستغرام" },
  x: { en: "X (Twitter)", ar: "إكس (تويتر)" },
  tiktok: { en: "TikTok", ar: "تيك توك" },
  snapchat: { en: "Snapchat", ar: "سناب شات" },
  youtube: { en: "YouTube", ar: "يوتيوب" },
  bing: { en: "Bing", ar: "بينج" },
  search: { en: "Other search engines", ar: "محركات بحث أخرى" },
  behance: { en: "Behance", ar: "بيهانس" },
  ai: { en: "AI assistants", ar: "مساعدات الذكاء الاصطناعي" },
  email: { en: "Email", ar: "البريد الإلكتروني" },
  other: { en: "Other apps", ar: "تطبيقات أخرى" },
};

export function sourceName(key: string, locale: Locale): string {
  return SOURCE_NAMES[key]?.[locale] ?? key;
}

const PLACEMENTS: Record<string, { en: string; ar: string }> = {
  floating: { en: "Floating button", ar: "الزر العائم" },
  contact: { en: "Contact section", ar: "قسم التواصل" },
  footer: { en: "Footer", ar: "الفوتر" },
  chatbot: { en: "Chatbot", ar: "الشات بوت" },
  site: { en: "Other links", ar: "روابط أخرى" },
};

export function placementName(key: string, locale: Locale): string {
  return PLACEMENTS[key]?.[locale] ?? key;
}

export function countryName(code: string, locale: Locale): string {
  if (!/^[A-Z]{2}$/.test(code)) return code;
  try {
    return new Intl.DisplayNames([locale === "ar" ? "ar" : "en"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}
