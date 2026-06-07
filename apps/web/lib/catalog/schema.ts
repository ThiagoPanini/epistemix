import { z } from "zod";

export const sectionKindSchema = z.enum(["direct", "with_sources"]);

export const sectionSchema = z.object({
  slug: z.string(),
  title: z.string(),
  kind: sectionKindSchema,
  order: z.number(),
  description: z.string(),
});

export const sectionsFileSchema = z.array(sectionSchema);

// `source.yml` usa snake_case; mapeamos para o domínio em camelCase.
export const sourceFileSchema = z.object({
  name: z.string(),
  external_url: z.string(),
  author: z.string(),
  description: z.string(),
  // Imagens opcionais colocadas no diretório do Source e servidas via
  // app/content-assets/[...segments]. Use caminhos relativos, como _assets/capa.webp.
  cover: z.string().optional(),
  author_avatar: z.string().optional(),
});

export const tagSchema = z.object({
  slug: z.string(),
  label: z.string(),
});

export const tagsFileSchema = z.array(tagSchema);

export const postStatusSchema = z.enum(["draft", "published"]);

// YAML sem aspas parseia `2026-06-05` como Date; aceitamos ambos e
// normalizamos para a data ISO (YYYY-MM-DD).
const isoDateSchema = z
  .union([z.string(), z.date()])
  .transform((value) => (value instanceof Date ? value.toISOString().slice(0, 10) : value));

export const postFrontmatterSchema = z.object({
  title: z.string(),
  date: isoDateSchema,
  status: postStatusSchema,
  tags: z.array(z.string()),
  summary: z.string(),
});
