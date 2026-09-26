import type { CollectionName } from "./types";

/**
 * Admin form/table configuration.
 *
 * The dashboard renders every collection from these descriptors, so adding a
 * field to the content model is a one-line change here — not a new form.
 */

export type FieldType =
  | "text"
  | "textarea"
  | "localized"
  | "localizedArea"
  | "number"
  | "boolean"
  | "image"
  | "images"
  | "tags"
  | "slug"
  | "reference"
  | "references"
  | "keyMetrics"
  | "color"
  | "range"
  | "select";

export type Field = {
  name: string;
  label: string;
  /** Arabic label, shown when the dashboard is set to Arabic. */
  labelAr: string;
  type: FieldType;
  help?: string;
  helpAr?: string;
  reference?: CollectionName;
  options?: { value: string; label: string }[];
  /** Layout hint: full-width row in the form grid. */
  wide?: boolean;
};

export type CollectionConfig = {
  name: CollectionName;
  label: string;
  labelAr: string;
  singular: string;
  singularAr: string;
  /** Field whose value titles a row in listings. */
  titleField: string;
  fields: Field[];
  /** Extra columns rendered in the list table. */
  columns?: { field: string; label: string; labelAr: string }[];
  readOnly?: boolean;
};

const publishFields: Field[] = [
  { name: "published", label: "Published", labelAr: "منشور", type: "boolean" },
  { name: "order", label: "Sort order", labelAr: "الترتيب", type: "number" },
];

export const collections: Record<string, CollectionConfig> = {
  projects: {
    name: "projects",
    label: "Projects",
    labelAr: "المشاريع",
    singular: "Project",
    singularAr: "مشروع",
    titleField: "name",
    columns: [
      { field: "category", label: "Category", labelAr: "التصنيف" },
      { field: "year", label: "Year", labelAr: "السنة" },
    ],
    fields: [
      { name: "name", label: "Project name", labelAr: "اسم المشروع", type: "localized" },
      { name: "slug", label: "Slug", labelAr: "الرابط", type: "slug", help: "Used in /projects/<slug>. Must be unique.", helpAr: "يظهر في /projects/الرابط ويجب ألا يتكرر." },
      { name: "clientId", label: "Client", labelAr: "العميل", type: "reference", reference: "clients" },
      { name: "industry", label: "Industry", labelAr: "القطاع", type: "localized" },
      { name: "year", label: "Year / date", labelAr: "السنة", type: "text" },
      { name: "category", label: "Category", labelAr: "التصنيف", type: "localized" },
      { name: "tags", label: "Tags", labelAr: "الوسوم", type: "tags", help: "Comma separated.", helpAr: "افصل بينها بفاصلة." },
      { name: "summary", label: "Short summary", labelAr: "ملخص قصير", type: "localizedArea", wide: true },
      { name: "challenge", label: "The challenge", labelAr: "التحدي", type: "localizedArea", wide: true },
      { name: "objective", label: "Business objective", labelAr: "الهدف التجاري", type: "localizedArea", wide: true },
      { name: "strategy", label: "Strategic approach", labelAr: "المقاربة الاستراتيجية", type: "localizedArea", wide: true },
      { name: "creativeDirection", label: "Creative direction", labelAr: "الاتجاه الإبداعي", type: "localizedArea", wide: true },
      { name: "execution", label: "Execution", labelAr: "التنفيذ", type: "localizedArea", wide: true },
      { name: "results", label: "Results", labelAr: "النتائج", type: "localizedArea", wide: true },
      { name: "keyMetrics", label: "Key metrics", labelAr: "أبرز المؤشرات", type: "keyMetrics", wide: true },
      { name: "serviceIds", label: "Services delivered", labelAr: "الخدمات المقدَّمة", type: "references", reference: "services", wide: true },
      { name: "coverImage", label: "Cover image", labelAr: "صورة الغلاف", type: "image" },
      { name: "gallery", label: "Gallery", labelAr: "معرض الصور", type: "images", wide: true },
      { name: "videoUrl", label: "Video embed URL", labelAr: "رابط تضمين الفيديو", type: "text" },
      { name: "externalUrl", label: "External URL", labelAr: "رابط خارجي", type: "text" },
      { name: "featured", label: "Featured", labelAr: "مميّز", type: "boolean" },
      { name: "pinned", label: "Pinned", labelAr: "مثبّت", type: "boolean" },
      ...publishFields,
      { name: "seoTitle", label: "SEO title", labelAr: "عنوان SEO", type: "localized" },
      { name: "seoDescription", label: "SEO description", labelAr: "وصف SEO", type: "localizedArea", wide: true },
    ],
  },
  articles: {
    name: "articles",
    label: "Articles",
    labelAr: "المقالات",
    singular: "Article",
    singularAr: "مقال",
    titleField: "title",
    columns: [
      { field: "category", label: "Category", labelAr: "التصنيف" },
      { field: "date", label: "Date", labelAr: "التاريخ" },
    ],
    fields: [
      { name: "title", label: "Title", labelAr: "العنوان", type: "localized" },
      {
        name: "slug",
        label: "Slug",
        labelAr: "الرابط",
        type: "slug",
        help: "Used in /articles/<slug>. Must be unique.",
        helpAr: "يظهر في /articles/الرابط ويجب ألا يتكرر.",
      },
      { name: "summary", label: "Short description", labelAr: "وصف قصير", type: "localizedArea", wide: true },
      {
        name: "content",
        label: "Article body",
        labelAr: "نص المقال",
        type: "localizedArea",
        wide: true,
        help: "Leave a blank line between paragraphs. A line starting with ## becomes a heading.",
        helpAr: "اترك سطرًا فارغًا بين الفقرات. أي سطر يبدأ بـ ## يتحول إلى عنوان فرعي.",
      },
      { name: "coverImage", label: "Cover image", labelAr: "صورة الغلاف", type: "image" },
      { name: "category", label: "Category", labelAr: "التصنيف", type: "localized" },
      { name: "author", label: "Author", labelAr: "الكاتب", type: "text" },
      { name: "date", label: "Date", labelAr: "التاريخ", type: "text", help: "e.g. 2026-03-18", helpAr: "مثال: 2026-03-18" },
      { name: "featured", label: "Featured", labelAr: "مميّز", type: "boolean" },
      { name: "published", label: "Published", labelAr: "منشور", type: "boolean" },
      { name: "order", label: "Sort order", labelAr: "الترتيب", type: "number" },
      { name: "seoTitle", label: "SEO title", labelAr: "عنوان SEO", type: "localized" },
      { name: "seoDescription", label: "SEO description", labelAr: "وصف SEO", type: "localizedArea", wide: true },
    ],
  },
  clients: {
    name: "clients",
    label: "Clients",
    labelAr: "العملاء",
    singular: "Client",
    singularAr: "عميل",
    titleField: "name",
    columns: [{ field: "industry", label: "Industry", labelAr: "القطاع" }],
    fields: [
      { name: "name", label: "Client name", labelAr: "اسم العميل", type: "localized" },
      { name: "logo", label: "Logo", labelAr: "الشعار", type: "image" },
      { name: "industry", label: "Industry", labelAr: "القطاع", type: "localized" },
      { name: "description", label: "Description", labelAr: "الوصف", type: "localizedArea", wide: true },
      { name: "website", label: "Website", labelAr: "الموقع الإلكتروني", type: "text" },
      { name: "featured", label: "Featured", labelAr: "مميّز", type: "boolean" },
      ...publishFields,
    ],
  },
  services: {
    name: "services",
    label: "Services",
    labelAr: "الخدمات",
    singular: "Service",
    singularAr: "خدمة",
    titleField: "title",
    columns: [{ field: "category", label: "Category", labelAr: "التصنيف" }],
    fields: [
      { name: "title", label: "Title", labelAr: "العنوان", type: "localized" },
      { name: "shortDescription", label: "Short description", labelAr: "وصف قصير", type: "localizedArea", wide: true },
      { name: "longDescription", label: "Long description", labelAr: "وصف مفصّل", type: "localizedArea", wide: true },
      { name: "icon", label: "Icon key", labelAr: "مفتاح الأيقونة", type: "text" },
      { name: "category", label: "Category", labelAr: "التصنيف", type: "localized" },
      { name: "ctaLabel", label: "CTA label", labelAr: "نص الزر", type: "localized" },
      { name: "ctaUrl", label: "CTA link", labelAr: "رابط الزر", type: "text" },
      { name: "featured", label: "Featured", labelAr: "مميّز", type: "boolean" },
      ...publishFields,
    ],
  },
  skills: {
    name: "skills",
    label: "Skills",
    labelAr: "المهارات",
    singular: "Skill",
    singularAr: "مهارة",
    titleField: "name",
    columns: [{ field: "category", label: "Category", labelAr: "التصنيف" }],
    fields: [
      { name: "name", label: "Skill", labelAr: "المهارة", type: "localized" },
      { name: "category", label: "Category", labelAr: "التصنيف", type: "localized" },
      { name: "description", label: "Description", labelAr: "الوصف", type: "localizedArea", wide: true },
      ...publishFields,
    ],
  },
  tools: {
    name: "tools",
    label: "Tools",
    labelAr: "الأدوات",
    singular: "Tool",
    singularAr: "أداة",
    titleField: "name",
    columns: [{ field: "category", label: "Category", labelAr: "التصنيف" }],
    fields: [
      { name: "name", label: "Tool name", labelAr: "اسم الأداة", type: "text" },
      { name: "category", label: "Category", labelAr: "التصنيف", type: "localized" },
      ...publishFields,
    ],
  },
  experience: {
    name: "experience",
    label: "Experience",
    labelAr: "الخبرات",
    singular: "Experience entry",
    singularAr: "خبرة",
    titleField: "title",
    columns: [
      { field: "company", label: "Company", labelAr: "الشركة" },
      { field: "startDate", label: "From", labelAr: "من" },
    ],
    fields: [
      { name: "company", label: "Company", labelAr: "الشركة", type: "localized" },
      { name: "title", label: "Role title", labelAr: "المسمى الوظيفي", type: "localized" },
      { name: "startDate", label: "Start date", labelAr: "تاريخ البداية", type: "text", help: "e.g. 2021-03", helpAr: "مثال: 2021-03" },
      { name: "endDate", label: "End date", labelAr: "تاريخ النهاية", type: "text", help: "Leave empty for present.", helpAr: "اتركه فارغًا للوظيفة الحالية." },
      { name: "location", label: "Location", labelAr: "الموقع", type: "localized" },
      { name: "description", label: "Description", labelAr: "الوصف", type: "localizedArea", wide: true },
      { name: "achievements", label: "Achievements", labelAr: "الإنجازات", type: "localizedArea", wide: true },
      { name: "skills", label: "Skills", labelAr: "المهارات", type: "tags" },
      { name: "logo", label: "Logo", labelAr: "الشعار", type: "image" },
      ...publishFields,
    ],
  },
  testimonials: {
    name: "testimonials",
    label: "Testimonials",
    labelAr: "آراء العملاء",
    singular: "Testimonial",
    singularAr: "رأي",
    titleField: "name",
    columns: [{ field: "company", label: "Company", labelAr: "الشركة" }],
    fields: [
      { name: "name", label: "Client name", labelAr: "اسم العميل", type: "localized" },
      { name: "role", label: "Role", labelAr: "المنصب", type: "localized" },
      { name: "company", label: "Company", labelAr: "الشركة", type: "localized" },
      { name: "quote", label: "Quote", labelAr: "النص", type: "localizedArea", wide: true },
      { name: "photo", label: "Photo", labelAr: "الصورة", type: "image" },
      { name: "projectId", label: "Related project", labelAr: "المشروع المرتبط", type: "reference", reference: "projects" },
      { name: "featured", label: "Featured", labelAr: "مميّز", type: "boolean" },
      ...publishFields,
    ],
  },
  metrics: {
    name: "metrics",
    label: "Metrics",
    labelAr: "الأرقام",
    singular: "Metric",
    singularAr: "رقم",
    titleField: "label",
    columns: [{ field: "value", label: "Value", labelAr: "القيمة" }],
    fields: [
      { name: "label", label: "Label", labelAr: "الاسم", type: "localized" },
      { name: "value", label: "Value", labelAr: "القيمة", type: "number" },
      { name: "prefix", label: "Prefix", labelAr: "بادئة", type: "text" },
      { name: "suffix", label: "Suffix", labelAr: "لاحقة", type: "text", help: "e.g. + or M+ SAR", helpAr: "مثال: + أو M+ SAR" },
      { name: "description", label: "Description", labelAr: "الوصف", type: "localizedArea", wide: true },
      { name: "showInHero", label: "Show in hero", labelAr: "إظهار في الهيرو", type: "boolean" },
      ...publishFields,
    ],
  },
  social_links: {
    name: "social_links",
    label: "Social links",
    labelAr: "روابط التواصل",
    singular: "Social link",
    singularAr: "رابط",
    titleField: "platform",
    columns: [{ field: "url", label: "URL", labelAr: "الرابط" }],
    fields: [
      { name: "platform", label: "Platform key", labelAr: "مفتاح المنصة", type: "text" },
      { name: "label", label: "Label", labelAr: "الاسم", type: "localized" },
      { name: "url", label: "URL", labelAr: "الرابط", type: "text", wide: true },
      ...publishFields,
    ],
  },
  navigation_items: {
    name: "navigation_items",
    label: "Navigation",
    labelAr: "القائمة",
    singular: "Navigation item",
    singularAr: "عنصر",
    titleField: "label",
    columns: [{ field: "href", label: "URL", labelAr: "الرابط" }],
    fields: [
      { name: "label", label: "Label", labelAr: "الاسم", type: "localized" },
      { name: "href", label: "URL", labelAr: "الرابط", type: "text" },
      ...publishFields,
    ],
  },
  chat_knowledge: {
    name: "chat_knowledge",
    label: "Knowledge base",
    labelAr: "قاعدة المعرفة",
    singular: "Answer",
    singularAr: "إجابة",
    titleField: "question",
    columns: [{ field: "keywords", label: "Keywords", labelAr: "كلمات مفتاحية" }],
    fields: [
      {
        name: "question",
        label: "Question",
        labelAr: "السؤال",
        type: "localized",
        help: "How a visitor would ask it. Fill both languages for best matching.",
        helpAr: "بالطريقة التي قد يسأل بها الزائر. املأ اللغتين لأفضل مطابقة.",
      },
      { name: "answer", label: "Answer", labelAr: "الإجابة", type: "localizedArea", wide: true },
      {
        name: "keywords",
        label: "Keywords & synonyms",
        labelAr: "كلمات مفتاحية ومرادفات",
        type: "tags",
        wide: true,
        help: "Comma separated, any language or dialect: other ways people ask this (e.g. price, بكم, التكلفة كام).",
        helpAr: "افصل بينها بفاصلة، بأي لغة أو لهجة: طرق أخرى يسأل بها الناس (مثل: بكم، التكلفة كام، price).",
      },
      ...publishFields,
    ],
  },
  inquiries: {
    name: "inquiries",
    label: "Inquiries",
    labelAr: "الطلبات",
    singular: "Inquiry",
    singularAr: "طلب",
    titleField: "name",
    readOnly: true,
    columns: [
      { field: "email", label: "Email", labelAr: "البريد" },
      { field: "service", label: "Service", labelAr: "الخدمة" },
    ],
    fields: [
      { name: "name", label: "Name", labelAr: "الاسم", type: "text" },
      { name: "company", label: "Company", labelAr: "الشركة", type: "text" },
      { name: "email", label: "Email", labelAr: "البريد الإلكتروني", type: "text" },
      { name: "phone", label: "Phone", labelAr: "الهاتف", type: "text" },
      { name: "service", label: "Service", labelAr: "الخدمة", type: "text" },
      { name: "budget", label: "Budget", labelAr: "الميزانية", type: "text" },
      { name: "brief", label: "Brief", labelAr: "تفاصيل المشروع", type: "textarea", wide: true },
      { name: "handled", label: "Handled", labelAr: "تمت المعالجة", type: "boolean" },
    ],
  },
};

export const adminCollections = Object.values(collections);

/** Localized label helpers used by the dashboard UI. */
export function fieldLabel(field: Field, locale: "en" | "ar"): string {
  return locale === "ar" ? field.labelAr || field.label : field.label;
}

export function fieldHelp(field: Field, locale: "en" | "ar"): string | undefined {
  return locale === "ar" ? field.helpAr ?? field.help : field.help;
}

export function collectionLabel(config: CollectionConfig, locale: "en" | "ar"): string {
  return locale === "ar" ? config.labelAr || config.label : config.label;
}

export function collectionSingular(config: CollectionConfig, locale: "en" | "ar"): string {
  return locale === "ar" ? config.singularAr || config.singular : config.singular;
}

export function columnLabel(
  column: { label: string; labelAr: string },
  locale: "en" | "ar",
): string {
  return locale === "ar" ? column.labelAr || column.label : column.label;
}

export function getCollectionConfig(name: string): CollectionConfig | null {
  return collections[name] ?? null;
}

/** Blank document for a "new" form. */
export function emptyValues(config: CollectionConfig): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const field of config.fields) {
    switch (field.type) {
      case "localized":
      case "localizedArea":
        values[field.name] = { en: "", ar: "" };
        break;
      case "boolean":
        values[field.name] = field.name === "published";
        break;
      case "number":
        values[field.name] = 0;
        break;
      case "images":
      case "tags":
      case "references":
      case "keyMetrics":
        values[field.name] = [];
        break;
      case "reference":
        values[field.name] = null;
        break;
      default:
        values[field.name] = "";
    }
  }
  return values;
}
