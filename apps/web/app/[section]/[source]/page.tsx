import { notFound } from "next/navigation";
import { getCatalog } from "@/lib/catalog";
import { getSiteModel } from "@/lib/site/model";
import { AppShell } from "../../_components/app-shell";
import { SourceView } from "../../_components/source-view";

export const dynamicParams = false;

export function generateStaticParams() {
  const catalog = getCatalog();
  return catalog.getSections().flatMap((section) =>
    catalog.getSources(section.slug).map((source) => ({
      section: section.slug,
      source: source.slug,
    })),
  );
}

export default async function SourcePage({
  params,
}: {
  params: Promise<{ section: string; source: string }>;
}) {
  const { section: sectionSlug, source: sourceSlug } = await params;
  const catalog = getCatalog();
  const model = getSiteModel();
  const section = model.sections.find((candidate) => candidate.slug === sectionSlug);
  const source = catalog.getSource(sectionSlug, sourceSlug);
  if (!section || !source) notFound();

  const posts = catalog.getPosts(sectionSlug, sourceSlug);

  return (
    <AppShell>
      <SourceView source={source} posts={posts} sectionSlug={sectionSlug} />
    </AppShell>
  );
}
