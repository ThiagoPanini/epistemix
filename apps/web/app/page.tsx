import { getCatalog } from "@/lib/catalog";
import { getReadTime, getSiteModel } from "@/lib/site/model";
import { AppShell } from "./_components/app-shell";
import { type HomePost, HomeView } from "./_components/home-view";

export const metadata = { title: "epistemix" };

export default function Home() {
  const catalog = getCatalog();
  const model = getSiteModel();

  const withSourcesPosts: HomePost[] = model.posts.map((p) => ({
    slug: p.slug,
    sectionSlug: p.sectionSlug,
    sourceSlug: p.sourceSlug,
    title: p.title,
    date: p.date,
    summary: p.summary,
    readTime: p.readTime,
  }));

  const directPosts: HomePost[] = catalog
    .getSections()
    .filter((s) => s.kind === "direct")
    .flatMap((s) =>
      catalog.getDirectPosts(s.slug).map((p) => ({
        slug: p.slug,
        sectionSlug: p.sectionSlug,
        sourceSlug: "",
        title: p.title,
        date: p.date,
        summary: p.summary,
        readTime: getReadTime(p.body),
      })),
    );

  const allPosts = [...withSourcesPosts, ...directPosts].sort((a, b) =>
    b.date.localeCompare(a.date),
  );

  const featured = allPosts[0] ?? null;
  const latest = allPosts.slice(1, 6);

  const catalogSlugs = new Set(catalog.getSections().map((s) => s.slug));
  const sections = model.sections.map((s) => {
    let count = 0;
    if (catalogSlugs.has(s.slug)) {
      count =
        s.kind === "with_sources"
          ? catalog.getSources(s.slug).length
          : catalog.getDirectPosts(s.slug).length;
    }
    return { slug: s.slug, title: s.title, description: s.description, count };
  });

  return (
    <AppShell>
      <HomeView featured={featured} latest={latest} sections={sections} />
    </AppShell>
  );
}
