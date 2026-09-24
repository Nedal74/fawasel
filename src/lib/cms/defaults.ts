import type { CollectionMap, CollectionName, Localized } from "./types";

/**
 * Seed content.
 *
 * Everything here comes from the brand brief. Nothing is invented: collections
 * the brief did not supply (projects, experience, testimonials, tools) ship
 * empty and render as empty states until the dashboard is populated.
 */

const L = (en: string, ar: string): Localized => ({ en, ar });
const EMPTY = L("", "");

const now = "2026-01-01T00:00:00.000Z";

function stamp<K extends CollectionName>(
  id: string,
  doc: Omit<CollectionMap[K], "id" | "createdAt" | "updatedAt">,
): CollectionMap[K] {
  return { ...doc, id, createdAt: now, updatedAt: now } as CollectionMap[K];
}

const serviceSeed: [string, string, string, string, string][] = [
  ["marketing-strategy", "Marketing Strategy", "استراتيجية التسويق", "Business-first marketing plans built on market, offer and audience analysis.", "خطط تسويقية تبدأ من فهم النشاط التجاري والسوق والجمهور والعرض."],
  ["brand-strategy", "Brand Strategy", "استراتيجية العلامة", "Positioning, messaging and identity direction that make the brand defensible.", "التموضع والرسائل واتجاه الهوية بما يمنح العلامة تميزًا حقيقيًا."],
  ["digital-marketing", "Digital Marketing", "التسويق الرقمي", "Full-funnel digital programs across search, social and owned channels.", "برامج رقمية متكاملة عبر البحث والسوشيال والقنوات المملوكة."],
  ["social-media", "Social Media", "السوشيال ميديا", "Channel strategy, content systems and community growth.", "استراتيجية القنوات وأنظمة المحتوى وبناء المجتمع."],
  ["performance-marketing", "Performance Marketing", "تسويق الأداء", "Paid acquisition engineered around cost per qualified lead.", "حملات مدفوعة مبنية على تكلفة العميل المؤهل لا على الانطباعات."],
  ["content-strategy", "Content Strategy", "استراتيجية المحتوى", "Content pillars, editorial calendars and production workflows.", "ركائز المحتوى والتقويم التحريري وسير عمل الإنتاج."],
  ["creative-direction", "Creative Direction", "الإدارة الإبداعية", "Art direction and creative systems that keep every asset on-brand.", "توجيه فني وأنظمة إبداعية تحافظ على اتساق كل عمل مع الهوية."],
  ["branding", "Branding", "بناء العلامة التجارية", "Identity systems, brand books and rollout across touchpoints.", "أنظمة الهوية ودليل العلامة وتطبيقها على كل نقاط التواصل."],
  ["graphic-design", "Graphic Design", "التصميم الجرافيكي", "Campaign design, key visuals and marketing collateral.", "تصاميم الحملات والمرئيات الأساسية والمواد التسويقية."],
  ["real-estate-marketing", "Real Estate Marketing", "التسويق العقاري", "Project launches, unit sell-through and broker-grade lead engines.", "إطلاق المشاريع وتصريف الوحدات وبناء محركات عملاء محتملين."],
  ["campaign-management", "Campaign Management", "إدارة الحملات", "End-to-end campaign planning, delivery, optimization and reporting.", "تخطيط الحملات وتنفيذها وتحسينها ورفع تقاريرها كاملة."],
  ["lead-generation", "Lead Generation", "توليد العملاء المحتملين", "Offer design, landing experiences and lead qualification flows.", "تصميم العروض وصفحات الهبوط ومسارات تأهيل العملاء."],
  ["marketing-consulting", "Marketing Consulting", "الاستشارات التسويقية", "Diagnostics and advisory for teams that need direction, not noise.", "تشخيص واستشارات للفرق التي تحتاج اتجاهًا واضحًا لا ضجيجًا."],
  ["website-development", "Website Development", "تطوير المواقع", "Conversion-focused websites and landing pages.", "مواقع وصفحات هبوط مصممة للتحويل."],
  ["ai-marketing", "AI Marketing", "التسويق بالذكاء الاصطناعي", "AI-assisted research, content and creative workflows.", "أبحاث ومحتوى وسير عمل إبداعي بمساعدة الذكاء الاصطناعي."],
  ["media-buying", "Media Buying", "شراء الوسائط", "Budget allocation and placement strategy across paid platforms.", "توزيع الميزانيات واستراتيجية المواضع عبر المنصات المدفوعة."],
];

const skillSeed: [string, string, string, string][] = [
  ["Strategy", "الاستراتيجية", "Marketing Strategy", "استراتيجية التسويق"],
  ["Strategy", "الاستراتيجية", "Brand Strategy", "استراتيجية العلامة"],
  ["Strategy", "الاستراتيجية", "Growth Strategy", "استراتيجية النمو"],
  ["Strategy", "الاستراتيجية", "Content Strategy", "استراتيجية المحتوى"],
  ["Strategy", "الاستراتيجية", "Marketing Consulting", "الاستشارات التسويقية"],
  ["Performance", "الأداء", "Performance Marketing", "تسويق الأداء"],
  ["Performance", "الأداء", "Media Buying", "شراء الوسائط"],
  ["Performance", "الأداء", "Lead Generation", "توليد العملاء المحتملين"],
  ["Performance", "الأداء", "Campaign Management", "إدارة الحملات"],
  ["Performance", "الأداء", "Conversion Optimization", "تحسين معدل التحويل"],
  ["Creative", "الإبداع", "Creative Direction", "الإدارة الإبداعية"],
  ["Creative", "الإبداع", "Branding", "بناء العلامة"],
  ["Creative", "الإبداع", "Graphic Design", "التصميم الجرافيكي"],
  ["Creative", "الإبداع", "Content Creation", "صناعة المحتوى"],
  ["Video", "الفيديو", "Drone Videography", "تصوير الدرون"],
  ["Digital", "الرقمي", "Digital Marketing", "التسويق الرقمي"],
  ["Digital", "الرقمي", "Social Media", "السوشيال ميديا"],
  ["Digital", "الرقمي", "Website Development", "تطوير المواقع"],
  ["Digital", "الرقمي", "Analytics", "التحليلات"],
  ["Digital", "الرقمي", "Automation", "الأتمتة"],
  ["AI", "الذكاء الاصطناعي", "AI Marketing", "التسويق بالذكاء الاصطناعي"],
  ["AI", "الذكاء الاصطناعي", "AI-assisted Content", "المحتوى بمساعدة الذكاء الاصطناعي"],
  ["AI", "الذكاء الاصطناعي", "AI Creative Workflows", "سير العمل الإبداعي بالذكاء الاصطناعي"],
  ["AI", "الذكاء الاصطناعي", "Marketing Automation", "أتمتة التسويق"],
];

const metricSeed: [string, number, string, string, string, boolean][] = [
  ["years", 5, "+", "Years Experience", "سنوات خبرة", true],
  ["clients", 100, "+", "Clients", "عميل", true],
  ["brands", 50, "+", "Brands", "علامة تجارية", true],
  ["campaigns", 120, "+", "Campaigns", "حملة تسويقية", false],
  ["ad-spend", 10, "M+ SAR", "Ad Spend Managed", "إنفاق إعلاني مُدار", true],
  ["leads", 30, "K+", "Leads Generated", "عميل محتمل", false],
  ["social-growth", 200, "K+", "Social Growth", "نمو في المتابعين", false],
];

const socialSeed: [string, string, string, string][] = [
  ["linkedin", "LinkedIn", "لينكدإن", "https://www.linkedin.com/in/nedal-elabid-93a831411/"],
  ["facebook", "Facebook", "فيسبوك", "https://www.facebook.com/ne.d.ro.425322/"],
  ["instagram", "Instagram", "إنستغرام", "https://www.instagram.com/ned_rooo/"],
  ["tiktok", "TikTok", "تيك توك", "https://www.tiktok.com/@nedal_marketing"],
  ["behance", "Behance", "بيهانس", "https://www.behance.net/nedotito"],
  ["whatsapp", "WhatsApp", "واتساب", "https://wa.me/966573728884"],
];

const navSeed: [string, string, string, string][] = [
  ["home", "Home", "الرئيسية", "/"],
  ["work", "Work", "الأعمال", "/projects"],
  ["services", "Services", "الخدمات", "/services"],
  ["about", "About", "نبذة", "/about"],
  ["articles", "Articles", "مقالات", "/articles"],
  ["clients", "Clients", "العملاء", "/clients"],
  ["contact", "Contact", "تواصل", "/contact"],
];

const clientSeed: [string, string, string, string][] = [
  ["almugheeb", "Al Mugheeb Real Estate Development", "المغيب للتطوير العقاري", "Real Estate"],
  ["healthy-clinics", "Healthy Clinics", "عيادات هيلثي", "Healthcare"],
  ["umam", "Umam Real Estate Company", "شركة أمم العقارية", "Real Estate"],
  ["adwaa-nemar", "Adwaa Nemar Clinic", "عيادة أضواء نمار", "Healthcare"],
  ["sky-house", "Sky House Real Estate Marketing", "شركة سكاي هاوس للتسويق العقاري", "Real Estate"],
];

const contentSeed: [string, string, string, string, string][] = [
  ["hero.eyebrow", "Hero", "Marketing Intelligence · Riyadh, KSA", "ذكاء تسويقي · الرياض، السعودية", ""],
  ["hero.name", "Hero", "NEDAL ELABID", "نضال الأبيض", ""],
  ["hero.title", "Hero", "MARKETING MANAGER", "مدير تسويق", ""],
  ["hero.descriptor", "Hero", "Digital Marketing Manager | Real Estate & E-Commerce Growth | Content, Ads & Drone Videography · 5+ Years", "مدير تسويق رقمي | نمو العقار والتجارة الإلكترونية | محتوى وإعلانات وتصوير درون · +5 سنوات", ""],
  ["hero.philosophy", "Hero", "Marketing does not start with advertising… rather, it starts with understanding the business.", "التسويق لا يبدأ بالإعلان… بل يبدأ بفهم النشاط التجاري.", ""],
  ["hero.cta", "Hero", "Let's Work", "لنعمل معًا", ""],
  ["hero.ctaSecondary", "Hero", "View Work", "استعرض الأعمال", ""],
  ["hero.scroll", "Hero", "Scroll", "مرّر", ""],
  ["about.eyebrow", "About", "About", "نبذة", ""],
  ["about.heading", "About", "THE PERSON BEHIND THE STRATEGY", "الشخص خلف الاستراتيجية", ""],
  ["about.lead", "About", "I don't start with an ad. I start with the business — its margins, its offer, its buyer, and the gap between what it sells and what the market believes.", "لا أبدأ بالإعلان. أبدأ بالنشاط التجاري — هوامشه وعرضه ومشتريه، والفجوة بين ما يبيعه وما يصدّقه السوق.", ""],
  ["about.body", "About", "Over 5+ years and 100+ clients across real estate, healthcare and e-commerce, I've worked as the single point where strategy, performance media, creative direction, content and production meet. That combination is the point: a strategy nobody can execute is a document, and creative nobody measured is decoration.", "خلال أكثر من 5 سنوات ومع أكثر من 100 عميل في العقار والرعاية الصحية والتجارة الإلكترونية، عملت كنقطة التقاء واحدة بين الاستراتيجية وإعلانات الأداء والإدارة الإبداعية والمحتوى والإنتاج. هذا الدمج هو جوهر العمل: استراتيجية لا يمكن تنفيذها مجرد مستند، وإبداع لا يُقاس مجرد زينة.", ""],
  ["about.body2", "About", "I plan the campaign, direct the creative, buy the media, read the numbers, and take responsibility for the result end to end.", "أخطط الحملة، وأدير الإبداع، وأشتري الوسائط، وأقرأ الأرقام، وأتحمّل مسؤولية النتيجة من البداية إلى النهاية.", ""],
  ["about.ctaPrimary", "About", "View My Work", "استعرض أعمالي", ""],
  ["about.ctaPrimaryUrl", "About", "/projects", "/projects", ""],
  ["about.ctaSecondary", "About", "Start a Project", "ابدأ مشروعًا", ""],
  ["about.ctaSecondaryUrl", "About", "/contact", "/contact", ""],
  ["articles.eyebrow", "Articles", "Articles", "مقالات", ""],
  ["articles.heading", "Articles", "MY ARTICLES", "مقالاتي وآرائي", ""],
  ["articles.intro", "Articles", "Notes on marketing strategy, performance and creative direction.", "ملاحظات في استراتيجية التسويق والأداء والإدارة الإبداعية.", ""],
  ["articles.empty", "Articles", "Articles will appear here once published from the dashboard.", "ستظهر المقالات هنا بعد نشرها من لوحة التحكم.", ""],
  ["services.eyebrow", "Services", "Services", "الخدمات", ""],
  ["services.heading", "Services", "WHAT I RUN", "ما الذي أديره", ""],
  ["services.intro", "Services", "Engagements are scoped around a business outcome, not a deliverable list.", "يتم تحديد نطاق العمل بناءً على نتيجة تجارية، لا على قائمة مخرجات.", ""],
  ["skills.eyebrow", "Skills", "Capabilities", "القدرات", ""],
  ["skills.heading", "Skills", "SKILLS", "المهارات", ""],
  ["skills.intro", "Skills", "Strategy, performance, creative and technology under one operator.", "استراتيجية وأداء وإبداع وتقنية تحت إدارة واحدة.", ""],
  ["work.eyebrow", "Work", "Selected Work", "أعمال مختارة", ""],
  ["work.heading", "Work", "MY WORK", "أعمالي", ""],
  ["work.intro", "Work", "Campaign work, launches and growth programs — documented as case studies.", "حملات وإطلاقات وبرامج نمو — موثقة كدراسات حالة.", ""],
  ["work.empty", "Work", "Case studies are being prepared. Published projects will appear here.", "دراسات الحالة قيد الإعداد. ستظهر المشاريع المنشورة هنا.", ""],
  ["clients.eyebrow", "Clients", "Clients", "العملاء", ""],
  ["clients.heading", "Clients", "CLIENTS WHO TRUSTED ME", "عملاء وثقوا بي", ""],
  ["clients.intro", "Clients", "Brands I've worked with across real estate, healthcare and retail.", "علامات عملت معها في العقار والرعاية الصحية والتجزئة.", ""],
  ["clients.empty", "Clients", "Client records will appear here once added from the dashboard.", "ستظهر بيانات العملاء هنا بعد إضافتها من لوحة التحكم.", ""],
  ["experience.eyebrow", "Experience", "Experience", "الخبرة", ""],
  ["experience.heading", "Experience", "CAREER TIMELINE", "المسار المهني", ""],
  ["experience.intro", "Experience", "Roles and responsibilities over the last five years.", "الأدوار والمسؤوليات خلال السنوات الخمس الماضية.", ""],
  ["experience.empty", "Experience", "Timeline entries will appear here once added from the dashboard.", "ستظهر محطات المسار المهني هنا بعد إضافتها من لوحة التحكم.", ""],
  ["intelligence.eyebrow", "Intelligence", "Marketing Intelligence", "ذكاء تسويقي", ""],
  ["intelligence.heading", "Intelligence", "MARKETING NUMBERS", "أرقام التسويق", ""],
  ["intelligence.intro", "Intelligence", "Confirmed volume across five years of campaign management.", "أرقام مؤكدة عبر خمس سنوات من إدارة الحملات.", ""],
  ["testimonials.eyebrow", "Testimonials", "Testimonials", "آراء العملاء", ""],
  ["testimonials.heading", "Testimonials", "WHAT CLIENTS SAY", "آراء العملاء", ""],
  ["testimonials.empty", "Testimonials", "Client testimonials will appear here once added from the dashboard.", "ستظهر آراء العملاء هنا بعد إضافتها من لوحة التحكم.", ""],
  ["contact.eyebrow", "Contact", "Contact", "تواصل", ""],
  ["contact.heading", "Contact", "START A PROJECT", "ابدأ مشروعًا", ""],
  ["contact.intro", "Contact", "Tell me about the business first — the campaign comes after.", "حدثني عن النشاط التجاري أولًا — الحملة تأتي بعد ذلك.", ""],
  ["contact.success", "Contact", "Received. I'll reply from nedotito74@gmail.com within one business day.", "تم الاستلام. سأرد من nedotito74@gmail.com خلال يوم عمل واحد.", ""],
  ["footer.statement", "Footer", "Marketing manager and creative director building growth systems for real estate, healthcare and e-commerce brands in Saudi Arabia.", "مدير تسويق ومدير إبداعي يبني أنظمة نمو لعلامات العقار والرعاية الصحية والتجارة الإلكترونية في السعودية.", ""],
];

/**
 * Copy that V1 shipped and V2 renamed. A stored block still holding the exact
 * V1 wording is an untouched default, so it follows the rename; anything the
 * admin edited is left alone.
 */
export const LEGACY_COPY: Record<string, Localized> = {
  "work.heading": L("CASE STUDIES", "دراسات الحالة"),
  "skills.heading": L("CAPABILITY MATRIX", "مصفوفة القدرات"),
  "clients.heading": L("TRUSTED BY", "موضع ثقة"),
  "testimonials.heading": L("IN THEIR WORDS", "بكلماتهم"),
  "intelligence.heading": L("THE NUMBERS BEHIND THE WORK", "الأرقام خلف العمل"),
};

export function seedData(): { [K in CollectionName]: CollectionMap[K][] } {
  return {
    projects: [],
    articles: [],
    experience: [],
    testimonials: [],
    tools: [],
    media_assets: [],
    inquiries: [],
    admins: [],
    services: serviceSeed.map(([id, en, ar, den, dar], i) =>
      stamp<"services">(`svc-${id}`, {
        title: L(en, ar),
        shortDescription: L(den, dar),
        longDescription: EMPTY,
        icon: id,
        category: L("Marketing", "التسويق"),
        ctaLabel: L("Explore service", "تفاصيل الخدمة"),
        ctaUrl: "/contact",
        featured: i < 6,
        published: true,
        order: i,
      }),
    ),
    skills: skillSeed.map(([cen, car, sen, sar], i) =>
      stamp<"skills">(`skl-${sen.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, {
        name: L(sen, sar),
        category: L(cen, car),
        description: EMPTY,
        published: true,
        order: i,
      }),
    ),
    clients: clientSeed.map(([id, en, ar, industry], i) =>
      stamp<"clients">(`cli-${id}`, {
        name: L(en, ar),
        logo: "",
        industry: L(industry, industry === "Real Estate" ? "عقارات" : "رعاية صحية"),
        description: EMPTY,
        website: "",
        featured: true,
        published: true,
        order: i,
      }),
    ),
    metrics: metricSeed.map(([id, value, suffix, en, ar, hero], i) =>
      stamp<"metrics">(`mtr-${id}`, {
        label: L(en, ar),
        value,
        prefix: "",
        suffix,
        description: EMPTY,
        showInHero: hero,
        published: true,
        order: i,
      }),
    ),
    social_links: socialSeed.map(([platform, en, ar, url], i) =>
      stamp<"social_links">(`soc-${platform}`, {
        platform,
        label: L(en, ar),
        url,
        published: true,
        order: i,
      }),
    ),
    navigation_items: navSeed.map(([id, en, ar, href], i) =>
      stamp<"navigation_items">(`nav-${id}`, {
        label: L(en, ar),
        href,
        published: true,
        order: i,
      }),
    ),
    site_content: contentSeed.map(([key, group, en, ar], i) =>
      stamp<"site_content">(`cnt-${key}`, {
        key,
        group,
        label: key,
        value: L(en, ar),
        order: i,
      }),
    ),
    site_settings: [
      stamp<"site_settings">("default", {
        siteTitle: L("NEDAL ELABID — Marketing Manager", "نضال الأبيض — مدير تسويق"),
        siteDescription: L(
          "Marketing manager, growth marketer and creative director. Real estate and e-commerce growth, performance media, content and drone videography.",
          "مدير تسويق ومسوّق نمو ومدير إبداعي. نمو العقار والتجارة الإلكترونية، إعلانات الأداء، المحتوى وتصوير الدرون.",
        ),
        keywords:
          "marketing manager, digital marketing, real estate marketing, performance marketing, Riyadh, Saudi Arabia, نضال الأبيض, تسويق عقاري",
        ogImage: "/images/og-image.svg",
        favicon: "/favicon.ico",
        defaultLocale: "en",
        email: "nedotito74@gmail.com",
        whatsapp: "+966573728884",
        accentFrom: "#bef532",
        accentTo: "#bef532",
        visualIntensity: 70,
        heroImage: "/images/portrait-hero.svg",
        heroRevealImage: "",
        aboutImage: "/images/portrait-about.svg",
        sections: {
          about: true,
          services: true,
          work: true,
          skills: true,
          intelligence: true,
          clients: true,
          testimonials: true,
          articles: true,
          contact: true,
        },
      }),
    ],
  };
}
