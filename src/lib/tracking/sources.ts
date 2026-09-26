/**
 * Pure helpers shared by the browser tracker and the /api/track endpoint.
 * No Node or DOM APIs here.
 */

const HOST_SOURCES: [RegExp, string][] = [
  [/(^|\.)google\./, "google"],
  [/(^|\.)bing\.com$/, "bing"],
  [/(^|\.)(duckduckgo\.com|yahoo\.com|yandex\.[a-z]+|ecosia\.org)$/, "search"],
  [/(^|\.)(linkedin\.com|lnkd\.in)$/, "linkedin"],
  [/(^|\.)(whatsapp\.com|wa\.me)$/, "whatsapp"],
  [/(^|\.)(facebook\.com|fb\.com|fb\.me|messenger\.com)$/, "facebook"],
  [/(^|\.)instagram\.com$/, "instagram"],
  [/(^|\.)(t\.co|twitter\.com|x\.com)$/, "x"],
  [/(^|\.)tiktok\.com$/, "tiktok"],
  [/(^|\.)snapchat\.com$/, "snapchat"],
  [/(^|\.)(youtube\.com|youtu\.be)$/, "youtube"],
  [/(^|\.)behance\.net$/, "behance"],
  [/(^|\.)(chatgpt\.com|openai\.com|perplexity\.ai|claude\.ai|gemini\.google\.com)$/, "ai"],
];

/** Android apps report themselves as android-app://<package>. */
const APP_SOURCES: [RegExp, string][] = [
  [/^com\.whatsapp/, "whatsapp"],
  [/^com\.linkedin/, "linkedin"],
  [/^com\.google\.android\.(gm|googlequicksearchbox)/, "google"],
  [/^com\.facebook/, "facebook"],
  [/^com\.instagram/, "instagram"],
  [/^com\.twitter/, "x"],
  [/^com\.zhiliaoapp|^com\.ss\.android/, "tiktok"],
  [/^com\.snapchat/, "snapchat"],
];

const UTM_ALIASES: Record<string, string> = {
  wa: "whatsapp",
  whatsapp: "whatsapp",
  linkedin: "linkedin",
  li: "linkedin",
  google: "google",
  fb: "facebook",
  facebook: "facebook",
  ig: "instagram",
  instagram: "instagram",
  twitter: "x",
  x: "x",
  tiktok: "tiktok",
  snapchat: "snapchat",
  snap: "snapchat",
  email: "email",
  newsletter: "email",
};

export function cleanSource(value: string): string {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return UTM_ALIASES[slug] ?? (slug || "direct");
}

/** Returns the referring host (lowercased, no www.) or "" if none/unparseable. */
export function referrerHost(referrer: string): string {
  if (!referrer) return "";
  try {
    const url = new URL(referrer);
    if (url.protocol === "android-app:") return `app:${url.hostname}`;
    return url.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

/**
 * Buckets a landing into a traffic source.
 *
 * utm_source wins (it is the only reliable signal for links shared in
 * WhatsApp, which usually strips the referrer), then ad click ids, then the
 * referring host. Visits from the site itself or with no referrer are direct.
 */
export function classifySource(
  referrer: string,
  params: URLSearchParams,
  ownHost: string,
): string {
  const utm = params.get("utm_source") || params.get("ref") || params.get("source");
  if (utm) return cleanSource(utm);
  if (params.get("gclid") || params.get("gbraid") || params.get("wbraid")) return "google";
  if (params.get("fbclid")) return "facebook";
  if (params.get("li_fat_id")) return "linkedin";
  if (params.get("ttclid")) return "tiktok";
  if (params.get("ScCid")) return "snapchat";

  const host = referrerHost(referrer);
  if (!host) return "direct";
  if (host.startsWith("app:")) {
    const app = host.slice(4);
    return APP_SOURCES.find(([pattern]) => pattern.test(app))?.[1] ?? "other";
  }
  const own = ownHost.toLowerCase().replace(/^www\./, "");
  if (own && host === own) return "direct";
  return HOST_SOURCES.find(([pattern]) => pattern.test(host))?.[1] ?? host.slice(0, 40);
}

export function deviceFromUserAgent(ua: string): "mobile" | "tablet" | "desktop" {
  const agent = ua.toLowerCase();
  if (/ipad|tablet|kindle|silk|playbook|(android(?!.*mobile))/.test(agent)) return "tablet";
  if (/mobi|iphone|ipod|android|blackberry|opera mini|iemobile/.test(agent)) return "mobile";
  return "desktop";
}

export function isBot(ua: string): boolean {
  if (!ua) return true;
  return /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|headless|lighthouse|pingdom|monitor|curl|wget|python|axios|node-fetch|vercel-screenshot/i.test(
    ua,
  );
}
