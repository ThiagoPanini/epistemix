import type { MetadataRoute } from "next";
import { getCatalog } from "@/lib/catalog";
import { buildPostUrl, buildSectionUrl, buildSourceUrl, SITE_URL } from "@/lib/site/meta";

export default function sitemap(): MetadataRoute.Sitemap {
  const catalog = getCatalog();
  const routes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1.0 },
    { url: `${SITE_URL}/timeline`, changeFrequency: "weekly", priority: 0.5 },
    { url: `${SITE_URL}/graph`, changeFrequency: "weekly", priority: 0.5 },
  ];

  for (const section of catalog.getSections()) {
    routes.push({ url: buildSectionUrl(section.slug), changeFrequency: "weekly", priority: 0.8 });

    if (section.kind === "with_sources") {
      for (const source of catalog.getSources(section.slug)) {
        routes.push({
          url: buildSourceUrl(section.slug, source.slug),
          changeFrequency: "weekly",
          priority: 0.7,
        });
        for (const post of catalog.getPosts(section.slug, source.slug)) {
          routes.push({
            url: buildPostUrl(section.slug, source.slug, post.slug),
            lastModified: new Date(`${post.date}T00:00:00Z`),
            changeFrequency: "monthly",
            priority: 0.9,
          });
        }
      }
    } else {
      for (const post of catalog.getDirectPosts(section.slug)) {
        routes.push({
          url: buildPostUrl(section.slug, "", post.slug),
          lastModified: new Date(`${post.date}T00:00:00Z`),
          changeFrequency: "monthly",
          priority: 0.9,
        });
      }
    }
  }

  return routes;
}
