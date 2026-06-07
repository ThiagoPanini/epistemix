// URL pública de um asset (capa, avatar) colocado no diretório de um Source em
// content/<section>/<source>/. O arquivo é servido pelo route handler em
// app/content-assets/[...segments]/route.ts — o Next só serve public/ como
// estático, então imagens colocadas junto ao conteúdo precisam desta ponte.
//
// Módulo puro (sem deps de node) para poder ser importado em qualquer componente,
// inclusive client components.
export function contentAssetUrl(sectionSlug: string, sourceSlug: string, file: string): string {
  return `/content-assets/${sectionSlug}/${sourceSlug}/${file}`;
}

// Conveniência: URL do avatar do autor de um Source, ou undefined se não houver.
export function sourceAuthorAvatarUrl(source: {
  sectionSlug: string;
  slug: string;
  authorAvatar?: string;
}): string | undefined {
  return source.authorAvatar
    ? contentAssetUrl(source.sectionSlug, source.slug, source.authorAvatar)
    : undefined;
}
