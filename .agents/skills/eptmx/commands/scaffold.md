# scaffold — cria o andaime do catálogo, sem escrever Post

Cria a plumbing do catálogo — uma **Section**, um **Source**, ou **tags** — de forma isolada,
sem produzir nenhum `.mdx`. Útil quando o autor quer preparar o terreno ("cria a seção de
cursos", "cadastra esse livro", "adiciona a tag coolify") antes ou independente de escrever.

Tudo aqui é regido pelo schema em `references/catalog-model.md` e pela regra de ouro: **propor
antes de gravar, sempre**. Nada entra em silêncio.

## Section

Destino: uma entrada nova em `content/sections.yml`. Decida e proponha:

- `slug` — kebab-case, único, **não-reservado** (`authors`, `about`, `api`, `_next`,
  `favicon.ico`, `robots.txt`, `sitemap.xml`).
- `title`, `description` (frase curta).
- `kind` — `direct` (Posts ligados direto, ex.: Blog) ou `with_sources` (Posts agrupados por
  Source, ex.: Courses/Books/Certifications). Pergunte se não estiver claro pelo nome.
- `order` — inteiro que não colida e faça sentido na navegação (olhe os `order` existentes).

Se `kind: with_sources`, ofereça já criar o primeiro Source na sequência.

## Source (só dentro de Section `with_sources`)

Destino: `content/<section>/<source-slug>/source.yml`. O `slug` do Source é o **nome do
diretório** (kebab-case), não um campo do arquivo. Campos do `source.yml` (snake_case, todos
obrigatórios): `name`, `external_url`, `author`, `description`. Confirme a Section pai existe e
é `with_sources`; se não existir, faça a Section primeiro.

## Tags (gate fechado — ADR-0008)

Destino: `content/tags.yml`. Para cada tag pedida, separe **já existe** de **seria adição**,
proponha `slug` (kebab) + `label`, e só grave **após OK explícito**. Lembre que tag em
frontmatter fora desta lista **quebra a build** — a curadoria fechada é intencional.

## Fluxo

1. Identifique o que criar (Section / Source / tags — pode ser mais de um numa tacada).
2. **Proponha** a estrutura exata (caminhos + conteúdo dos arquivos). Espere confirmação.
3. Grave só o que foi aprovado.
4. **Self-verify**: `cd apps/web && pnpm vitest run lib/catalog` — verde antes de declarar
   pronto. Sem `pnpm`, confira à mão contra o schema.
5. Entregue: o que foi criado e onde. Ofereça seguir para [write](write.md) ou
   [outline](outline.md) agora que o terreno existe.
