import type { Metadata } from "next";

import { PageHeader } from "@/components/public/PageHeader";
import { ProjectsExplorer } from "@/components/public/ProjectsExplorer";
import { Container } from "@/components/ui/Container";
import { getStrings } from "@/i18n/strings";
import { getContentMap, getProjects } from "@/lib/cms/queries";
import { getLocale, makeCopy } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo-pages";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("/projects");
}

export default async function ProjectsPage() {
  const locale = await getLocale();
  const [content, projects] = await Promise.all([getContentMap(), getProjects()]);
  const copy = makeCopy(content, locale);
  const strings = getStrings(locale);

  return (
    <>
      <PageHeader
        eyebrow={copy("work.eyebrow")}
        title={copy("work.heading")}
        intro={copy("work.intro")}
        meta={`${projects.length} PROJECT${projects.length === 1 ? "" : "S"}`}
      />
      <Container as="section" className="pb-28">
        <ProjectsExplorer
          projects={projects}
          locale={locale}
          strings={strings}
          emptyMessage={copy("work.empty")}
        />
      </Container>
    </>
  );
}
