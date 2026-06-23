# Skill operacional: design system

Leia este arquivo quando for mexer no frontend, prototipar tela ou revisar UI.

## Regra curta

O contrato visual vivo é `docs/design/`. O código as-built vence o bundle
congelado. O bundle em `.claude/design/` só serve para procedência ou specs futuras
explicitamente marcadas.

## Antes de editar UI

1. Leia `docs/design/README.md`.
2. Leia `docs/design/design-spec.md` e `docs/design/layout.md`.
3. Leia o contrato do componente em `docs/design/components/`.
4. Confira `docs/CONTEXT.md` se a mudança toca linguagem de domínio.

## Durante a edição

- Use tokens de `apps/web/app/globals.css`.
- Não copie literais do bundle.
- Não reintroduza nomes/copy antigos.
- Preserve foco visível, teclado, reduced-motion e estados vazios.
- Atualize o contrato de design no mesmo PR quando a forma mudar.

## Ao finalizar

Rode verificações frontend proporcionais:

```bash
pnpm exec biome check apps/web
pnpm --filter @ethitorial/web typecheck
pnpm --filter @ethitorial/web build
```

Se houver lógica interativa, rode também:

```bash
pnpm --filter @ethitorial/web test
```
