import { ContentForm } from "@/components/admin/ContentForm";
import { getAdminStrings } from "@/i18n/admin";
import { getAdminLocale } from "@/lib/admin-locale";
import { listAdmin } from "@/lib/cms/admin";
import { seedData } from "@/lib/cms/defaults";
import type { SiteContentBlock } from "@/lib/cms/types";

export const dynamic = "force-dynamic";

export default async function ContentPage() {
  const [blocks, locale] = await Promise.all([
    listAdmin("site_content") as Promise<SiteContentBlock[]>,
    getAdminLocale(),
  ]);
  const t = getAdminStrings(locale);

  // Copy keys added in a later version are not in an older database yet; show
  // their defaults so they can be edited (saving creates them).
  const storedKeys = new Set(blocks.map((block) => block.key));
  const missing = seedData().site_content.filter((block) => !storedKeys.has(block.key));
  for (const block of missing) blocks.push(block);

  const grouped = new Map<string, SiteContentBlock[]>();
  for (const block of blocks) {
    const key = block.group || "General";
    grouped.set(key, [...(grouped.get(key) ?? []), block]);
  }

  return (
    <div>
      <header className="mb-8">
        <p className="label">{t.groupSite}</p>
        <h1 className="display mt-2 text-3xl">{t.contentTitle}</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">{t.contentIntro}</p>
      </header>
      <ContentForm groups={[...grouped.entries()]} t={t} />
    </div>
  );
}
