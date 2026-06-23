import { notFound } from "next/navigation";
import { getCatalog } from "@/lib/catalog";
import { getAllStaticSectionSlugs, getSiteModel } from "@/lib/site/model";
import { AppShell } from "../_components/app-shell";
import { SectionDirectView } from "../_components/section-direct-view";
import { SectionWithSourcesView } from "../_components/section-view";
import { WipPage } from "../_components/wip-page";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllStaticSectionSlugs().map((section) => ({ section }));
}

export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section: sectionSlug } = await params;
  const model = getSiteModel();

  if (sectionSlug === "about") {
    return (
      <AppShell>
        <WipPage title="Sobre" description="Sobre o ethitorial e seu autor." />
      </AppShell>
    );
  }

  const section = model.sections.find((candidate) => candidate.slug === sectionSlug);
  if (!section) notFound();

  if (!section.ready) {
    return (
      <AppShell>
        <WipPage title={section.title} description={section.description} />
      </AppShell>
    );
  }

  const catalog = getCatalog();

  if (section.kind === "with_sources") {
    const sources = catalog.getSources(sectionSlug).map((source) => ({
      ...source,
      postCount: catalog.getPosts(sectionSlug, source.slug).length,
    }));
    return (
      <AppShell>
        <SectionWithSourcesView section={section} sources={sources} />
      </AppShell>
    );
  }

  // direct sections (blog, talks)
  if (section.kind === "direct") {
    const posts = catalog.getDirectPosts(sectionSlug);
    const tags = catalog.getTags();
    return (
      <AppShell>
        <SectionDirectView section={section} posts={posts} tags={tags} />
      </AppShell>
    );
  }

  notFound();
}
