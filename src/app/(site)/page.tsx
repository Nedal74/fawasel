import { ContactSection } from "@/components/public/ContactSection";
import { Hero } from "@/components/public/Hero";
import {
  AboutSection,
  ArticlesSection,
  ClientsSection,
  IntelligenceSection,
  ServicesSection,
  SkillsSection,
  TestimonialsSection,
  WorkSection,
} from "@/components/public/Sections";
import { getStrings } from "@/i18n/strings";
import {
  getClients,
  getContentMap,
  getFeaturedArticles,
  getFeaturedProjects,
  getMetrics,
  getServices,
  getSettings,
  getSkills,
  getSocialLinks,
  getTestimonials,
} from "@/lib/cms/queries";
import { getLocale, makeCopy, pick } from "@/lib/i18n";

export default async function HomePage() {
  const locale = await getLocale();
  const [
    settings,
    content,
    metrics,
    services,
    skills,
    projects,
    clients,
    testimonials,
    articles,
    socials,
  ] = await Promise.all([
    getSettings(),
    getContentMap(),
    getMetrics(),
    getServices(),
    getSkills(),
    getFeaturedProjects(),
    getClients(),
    getTestimonials(),
    getFeaturedArticles(),
    getSocialLinks(),
  ]);

  const strings = getStrings(locale);
  const copy = makeCopy(content, locale);
  const sections = settings.sections ?? {};
  const enabled = (key: string) => sections[key] !== false;

  return (
    <>
      {/* 01 — HERO */}
      <Hero
        image={settings.heroImage}
        revealImage={settings.heroRevealImage}
        imageAlt={copy("hero.name")}
        copy={{
          eyebrow: copy("hero.eyebrow"),
          name: copy("hero.name"),
          title: copy("hero.title"),
          descriptor: copy("hero.descriptor"),
          philosophy: copy("hero.philosophy"),
          cta: copy("hero.cta"),
          ctaSecondary: copy("hero.ctaSecondary"),
          scroll: copy("hero.scroll"),
        }}
        metrics={metrics
          .filter((metric) => metric.showInHero)
          .slice(0, 4)
          .map((metric) => ({
            id: metric.id,
            label: pick(metric.label, locale),
            value: metric.value,
            prefix: metric.prefix,
            suffix: metric.suffix,
          }))}
      />

      {/* 02 — ABOUT */}
      {enabled("about") ? (
        <AboutSection copy={copy} strings={strings} image={settings.aboutImage} />
      ) : null}

      {/* 03 — SERVICES */}
      {enabled("services") ? (
        <ServicesSection services={services} locale={locale} copy={copy} strings={strings} />
      ) : null}

      {/* 04 — MY WORK */}
      {enabled("work") ? (
        <WorkSection
          projects={projects}
          clients={clients}
          services={services}
          locale={locale}
          copy={copy}
          strings={strings}
        />
      ) : null}

      {/* 05 — SKILLS */}
      {enabled("skills") ? <SkillsSection skills={skills} locale={locale} copy={copy} /> : null}

      {/* 06 — MARKETING NUMBERS */}
      {enabled("intelligence") ? (
        <IntelligenceSection metrics={metrics} locale={locale} copy={copy} />
      ) : null}

      {/* 07 — CLIENTS */}
      {enabled("clients") ? (
        <ClientsSection clients={clients} locale={locale} copy={copy} />
      ) : null}

      {/* 08 — TESTIMONIALS */}
      {enabled("testimonials") ? (
        <TestimonialsSection testimonials={testimonials} locale={locale} copy={copy} />
      ) : null}

      {/* 09 — ARTICLES */}
      {enabled("articles") ? (
        <ArticlesSection articles={articles} locale={locale} copy={copy} strings={strings} />
      ) : null}

      {/* 10 — START A PROJECT */}
      {enabled("contact") ? (
        <ContactSection
          settings={settings}
          services={services}
          socials={socials}
          locale={locale}
          copy={copy}
          strings={strings}
        />
      ) : null}
    </>
  );
}
