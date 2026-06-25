# ADR 0001 — Monorepo com boundaries de domínio explícitos

- **Status:** Accepted
- **Data:** 2026-05-23
- **Decisores:** Thiago Panini (solo)
- **Relacionado:** [ADR-0004](0004-hexagonal-pragmatica.md) — define o estilo arquitetural interno de cada boundary

## Contexto

O `talkingpres` tem dois deployables claros desde o início: um frontend Next.js público e uma API Python (FastAPI). Eles compartilham contratos (tipos gerados via OpenAPI) e ciclo de release. Precisamos decidir entre:

1. Polyrepo (`talkingpres-web` + `talkingpres-api` separados)
2. Monorepo único

Adicionalmente, dentro da API precisamos decidir como organizar o código: por camada técnica (`models/`, `services/`, `controllers/`) ou por domínio.

## Decisão

**Adotar monorepo** com layout:

```
talkingpres/
├── apps/
│   ├── web/     # Next.js
│   └── api/     # FastAPI
├── packages/
│   ├── ui/      # shadcn components compartilhados
│   └── types/   # tipos TS gerados via OpenAPI
└── docs/
```

**Dentro de `apps/api`, organizar por boundary de domínio** (`catalog`, `identity`, `engagement`, `narration`, `shared`, `platform`), não por camada técnica. Boundaries não importam diretamente uns dos outros — comunicação via interfaces explícitas.

**Catálogo MDX-native (port de leitura).** O boundary `catalog` (Section/Source/Artifact) é servido MDX-native: `apps/web` lê `content/**/*.mdx` em RSC/build-time e materializa o domínio em TypeScript, sem passar pela API — exceção consciente à regra de que `apps/web` consome a API para operações de domínio, que vale só para o que é dinâmico (engagement, auth, upload). Não é dívida: é a primeira implementação de um port de leitura (content source); uma migração CMS futura troca o adapter (MDX → Postgres servido pela API) atrás da mesma fronteira, sem reescrever o domínio. Rejeitadas: seed MDX→Postgres e API-lê-content-em-paralelo (ambas duplo manuseio de dado read-only, sem estado dinâmico que justifique a API).

## Justificativa

**Monorepo:**
- Mudança que toca contrato API + UI vira um único PR coerente.
- Agentes de IA (Claude, Codex, Copilot) operam melhor com visão completa.
- Solo dev: zero benefício de polyrepo, todo o custo de coordenação.
- Refatorações cross-cutting são triviais.

**Boundaries de domínio:**
- Espelha como o produto é pensado, não como o framework é construído.
- Permite mover um boundary para serviço separado no futuro com baixo atrito (se algum dia o `narration` precisar escalar isolado).
- Facilita atribuir contexto específico a agentes (subagent que só toca `catalog`, por exemplo).
- Force disciplina contra acoplamento implícito.

## Consequências

### Positivas
- Onboarding mais simples (um clone, um setup)
- CI mais simples no início
- Refatorações cross-stack sem orquestrar PRs em N repos
- Boundaries de domínio sobrevivem a refatorações de framework

### Negativas
- CI pode ficar lento sem pipelines paralelos (resolver com cache de turbo ou nx quando incomodar)
- Permissões finas por subprojeto inexistem (só importa quando houver mais devs)
- Boundaries de domínio exigem disciplina; sem revisão, o time aborda atalhos (mitigar com lint custom + reviewer agent)

## Opções rejeitadas

- **Polyrepo:** custo de coordenação sem benefício para solo. Reconsiderar só se múltiplos times com domínios independentes aparecerem.
- **Organização por camada técnica na API:** legível no início, vira pasta-de-50-arquivos rapidamente; acopla tudo via imports cruzados; resiste a evoluir para serviços separados.
