import { cookies, headers } from "next/headers";

import { getSettings } from "@/lib/cms/queries";
import type { Locale } from "@/lib/cms/types";
import { LOCALE_COOKIE, isLocale } from "@/lib/locale";

export { LOCALE_COOKIE, LOCALES, dirFor, isLocale, makeCopy, pick } from "@/lib/locale";

/**
 * Reader's language: an explicit ?lang= in the URL (see middleware.ts), else
 * their cookie choice, else the dashboard default.
 */
export async function getLocale(): Promise<Locale> {
  const forced = (await headers()).get("x-locale") ?? undefined;
  if (isLocale(forced)) return forced;
  const store = await cookies();
  const chosen = store.get(LOCALE_COOKIE)?.value;
  if (isLocale(chosen)) return chosen;
  const settings = await getSettings();
  return isLocale(settings.defaultLocale) ? settings.defaultLocale : "en";
}
