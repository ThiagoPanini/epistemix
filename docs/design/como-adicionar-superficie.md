# Como adicionar ou estender uma superfície

Use este fluxo para nova tela, novo bloco de home, nova listagem ou extensão de componente.

## 1. Nomeie o domínio antes da forma

Leia `docs/CONTEXT.md` e identifique se a superfície fala de `Section`, `Source`, `Artifact`, `Post`, `Presentation`, `Tag`, `Timeline`, `Knowledge Graph` ou `Now Learning`. Se a ideia exigir termo novo ou quebrar invariante, pare e proponha mudança de domínio antes de desenhar.

## 2. Escolha a família visual

- Navegação/shell: `components/app-shell-navigation.md`.
- Home/descoberta: `components/home.md`.
- Catálogo: `components/catalog-listings.md`.
- Leitura: `components/reading.md`.
- Dados derivados: `components/timeline.md` ou `components/knowledge-graph.md`.
- Overlay/interação: `components/command-palette.md` ou `components/presentation-player.md`.
- Identidade/auth: `components/auth-account-author.md`.

Não invente uma estética paralela. Estenda hairlines, mono labels, serif prosa, acento laranja e densidade existentes.

## 3. Modele dados e estados

Liste no PR:

- estado carregado;
- vazio;
- erro, se houver fetch client-side;
- pending/disabled, se houver ação;
- autenticado vs anônimo, se houver engagement;
- mobile e teclado.

Para catálogo, a rota deve derivar do contrato `Catalog` (`apps/web/lib/catalog/catalog.ts` interface `Catalog`) ou do modelo de site (`apps/web/lib/site/model.ts` `getSiteModel`), não de mock local.

## 4. Use tokens

Use `var(--*)`. Literal só entra se for runtime/ajuste ótico e for catalogado em `design-spec.md`. Keyframes novas devem ter reduced-motion no mesmo componente.

## 5. Atualize contrato junto do código

Cada nova fronteira visual precisa:

- arquivo de componente ou seção CSS;
- item em `docs/design/components/` ou atualização do contrato existente;
- nota em `procedencia-e-deltas.md` se contrariar bundle, docs antigos ou intenção;
- teste/verificação proporcional ao risco.

## 6. Verifique

Para mudança frontend comum:

```bash
pnpm exec biome check apps/web
pnpm --filter @ethitorial/web typecheck
pnpm --filter @ethitorial/web build
```

Se mexer em testes ou lógica interativa, rode também:

```bash
pnpm --filter @ethitorial/web test
```
