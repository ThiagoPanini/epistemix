export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ethitorial.panlabs.tech";
export const SITE_NAME = "ethitorial";
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
  // SEC-4: JSON.stringify does not escape `<`, so a title/summary containing
  // `</script>` would break the surrounding <script> tag. Escape after stringify.
  const raw = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: opts.title,
    ...(opts.summary ? { description: opts.summary } : {}),
    datePublished: opts.date,
    url: opts.url,
    author: { "@type": "Person", name: SITE_AUTHOR },
    publisher: { "@type": "Person", name: SITE_AUTHOR },
  });
  return raw.replace(/</g, "\\u003c");
}
