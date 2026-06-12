export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://epistemix.dev";
export const SITE_NAME = "epistemix";
export const SITE_AUTHOR = "Thiago Panini";
export const SITE_TWITTER = "@thiago_panini";

export function buildPostUrl(sectionSlug: string, sourceSlug: string, postSlug: string): string {
  if (sourceSlug) {
    return `${SITE_URL}/${sectionSlug}/${sourceSlug}/${postSlug}`;
  }
  return `${SITE_URL}/${sectionSlug}/${postSlug}`;
}

export function buildSourceUrl(sectionSlug: string, sourceSlug: string): string {
  return `${SITE_URL}/${sectionSlug}/${sourceSlug}`;
}

export function buildSectionUrl(sectionSlug: string): string {
  return `${SITE_URL}/${sectionSlug}`;
}

export function articleJsonLd(opts: {
  title: string;
  summary: string;
  date: string;
  url: string;
}): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: opts.title,
    ...(opts.summary ? { description: opts.summary } : {}),
    datePublished: opts.date,
    url: opts.url,
    author: { "@type": "Person", name: SITE_AUTHOR },
    publisher: { "@type": "Person", name: SITE_AUTHOR },
  });
}
