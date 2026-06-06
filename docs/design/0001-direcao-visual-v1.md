---
numero: 0001
titulo: Direção visual e UX da V1 — decisões para prototipação de alta fidelidade
status: draft
data: 2026-06-05
escopo: apps/web (Fase 1+)
origem: sessão grill-with-docs de 2026-06-05
---

# Direção visual e UX — V1 (epistemix)

> **Propósito.** Documento de decisões prontas para alimentar uma ferramenta de
> prototipação de alta fidelidade (**Claude Design** — Anthropic Labs). Não é spec
> de implementação nem ADR: é direção visual **provisória e refinável**. As
> escolhas abaixo foram destiladas para dar norte forte ao protótipo; tokens
> concretos são **ponto de partida**, não contrato.
>
> Âncora de referência: **Linear** — em especial `linear.app/developers`
> (dark refinado, bordas hairline, gradientes leves, tipografia crisp, microanimações
> contidas). Referência herdada da VISION: `codewiki.google` (estrutura, mono nos acentos).
>
> Restrições não-negociáveis (de [VISION.md](../VISION.md)): **dark-first**,
> **SEO** (conteúdo público crawlável, server-render), **WCAG AA**, **performance
> percebida** acima da estética.

---

## 1. Princípios visuais

1. **Híbrido técnico-editorial.** Chrome técnico (sidebar, cards, bordas sutis,
   mono nos acentos) + páginas de leitura arejadas e confortáveis. Nem "ferramenta
   crua" (codewiki puro), nem "revista" (editorial puro): o sabor **Linear**.
2. **Dark-first, calmo.** Fundo quase-preto levemente frio, hierarquia por
   luminância e por hairlines, não por blocos de cor saturada. Cor é escassa e
   intencional.
3. **Sobriedade animada.** Movimento serve à leitura e à orientação, nunca ao
   espetáculo. "Elegante sem extravagância" (VISION). Tudo respeita
   `prefers-reduced-motion`.
4. **Conteúdo é o produto.** Layout cede o centro do palco ao Artifact. Nada de
   conteúdo atrás de login (honra SEO e o read-only da Fase 1).
5. **Honestidade de fase.** O que ainda não existe se apresenta como WIP on-brand,
   nunca como página quebrada nem como funcionalidade falsa.

---

## 2. Sistema base (ponto de partida — refinar no protótipo)

### 2.1 Paleta (dark-first)

| Token | Valor sugerido | Uso |
|---|---|---|
| `--bg` | `#08090A` | fundo do app |
| `--surface` | `#101113` | sidebar, cards |
| `--surface-raised` | `#16181B` | hover de card, popovers, code header |
| `--border` | `rgba(255,255,255,0.08)` | hairlines (bordas, divisores) |
| `--text` | `#EDEEF0` | texto primário |
| `--text-muted` | `#8A8F98` | metadados, autor, labels |
| `--accent` | `#7A5CFF` (violeta) | links, foco, botões, ativo na nav |
| `--accent-hover` | `#8E76FF` | hover do acento |
| `--accent-soft` | `rgba(122,92,255,0.12)` | realces/chips ativos |
| `--gradient-brand` | violeta → indigo → cyan (sutil) | wordmark, hero |
| `--success` | `#3FB68B` | status online, confirmações |
| `--danger` | `#F0616D` | erros, status offline |

- **Acento único de marca** (violeta). Sections **não** têm cor própria — diferenciam-se
  por ícone + label, não por cor (evita "arco-íris"; mantém coesão Linear).

### 2.2 Tipografia

- **Sans (UI + prosa):** Inter (ou equivalente "Geist"/"Inter Variable"). Mesma família
  na nav, nos cards **e no corpo de leitura** — coeso, técnico, sabor Linear.
- **Mono (código):** JetBrains Mono / Geist Mono / `ui-monospace`. Hub técnico → render
  de código é cidadão de primeira classe (Shiki, header com filename, botão copiar).
- **Escala de leitura:** corpo da prosa ~17px / `line-height` ~1.7, medida ~68ch
  (coluna ~680–720px). Headings com `letter-spacing` levemente negativo (tracking tight).

### 2.3 Espaçamento, raio, elevação

- **Grid base 4px** (escala 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64).
- **Raio:** cards 12px · botões/inputs 8px · pills full.
- **Elevação:** sem sombras pesadas. Profundidade por `--surface` + hairline; sombra
  só sutil em popovers/overlays.

### 2.4 Motion

- **Micro-interações:** 120–200ms, `ease-out`. Hover/focus de links, botões, cards.
- **Reveals de scroll:** 400–600ms, `fade + translateY` curto (~8–16px). Discreto.
- **Interativo (Framer Motion):** springs suaves em elementos que respondem ao usuário.
- **Assinatura única na home:** aurora/gradiente violeta que "respira" lento (~20s loop)
  atrás do hero + entrada escalonada do wordmark/tagline. Gerado por código (sem GIF/asset
  pesado); escala em qualquer tela.
- **Sempre** honrar `prefers-reduced-motion: reduce` (corta reveals e o loop da aurora).

---

## 3. Inventário de telas / rotas e estado

**Estado de design no protótipo:** todas as telas abaixo são desenhadas por completo
agora (cobrir a visão inteira). **Estado de implementação real** indica o que já é
funcional na Fase 1 vs. o que renderiza como WIP/placeholder.

| Tela / rota | Design no protótipo | Implementação real |
|---|---|---|
| **Home / landing** (`/`) | Completo | **Fase 1** — landing pública (hero, tagline, aurora). Botão "entrar" visível porém **WIP** (auth é Fase 2). |
| **App shell** (sidebar + header + footer) | Completo | **Fase 1** — sidebar de Sections, header com busca (⌘K) e "entrar", footer mínimo (link do repo OSS, about). |
| **Section `with_sources`** (`/courses`) | Completo | **Fase 1 pronto** — grid de cards de Source (Courses real). |
| **Source** (`/courses/aihero`) | Completo | **Fase 1 pronto** — cover, autor, link externo, descrição + lista de Posts. |
| **Post (leitura)** (`/courses/aihero/<slug>`) | Completo | **Fase 1 pronto** — app-shell + prosa MDX + TOC. Experiência central. |
| **Section `direct` / Blog** (`/blog`) | Completo | **Fase 1 (fatia futura)** — grid de cards de Post direto (sem camada Source). |
| **Player de Presentation** (`/presentations/<slug>`) | Completo | **Fase 1 (fatia futura, slide-kit)** — chrome do player: navegação, progresso, teclado. |
| **Busca + filtros por tag** (overlay ⌘K) | Completo | **Fase 1 (a fazer)** — busca + filtro por tags curadas. |
| **Engagement no Post** (votar + comentários) | Completo (estado visual) | **Fase 2** — render desabilitado/"em breve" na Fase 1. |
| **Perfil de autor** (`/authors/<username>`) | Completo (leve) | **Fase 2** — persona, bio, lista de Artifacts. |
| **Template WIP** (Sections/rotas não prontas) | Completo | **Fase 1** — ícone + nome da Section + "estou construindo isto" + voltar + teaser opcional. |
| **404 / draft-404** | Completo | **Fase 1** — Post `draft` → 404; rota inexistente → 404 on-brand. |

> **Tag "soon" na nav:** Sections não prontas (Books, Certifications, Blog,
> Presentations) aparecem normalmente na sidebar com tag sutil `soon`; ao abrir, caem
> no **template WIP**, não em página quebrada.

---

## 4. Componentes-chave e padrões de layout

### 4.1 App shell (Linear docs)

```
┌─ sidebar ─┬──────── header (logo · ⌘K busca · entrar) ────────┐
│ Sections  │                                                   │
│  ◆ Courses│                  conteúdo                         │
│  ◆ Books  │             (Section / Source /                   │
│    ·soon· │              Post + TOC à direita)                │
│  ◆ Blog   │                                                   │
│    ·soon· │                                                   │
│  ◆ Certs  ├───────────────── footer mínimo ───────────────────┤
│  ◆ Present│   repo OSS · about · © epistemix                  │
└───────────┴───────────────────────────────────────────────────┘
```

- **Sidebar** ~240–260px, persistente (inclusive na leitura do Post), item ativo com
  acento violeta. **Mobile:** vira drawer/hambúrguer.
- **Header:** wordmark (gradiente de marca), busca ⌘K, botão "entrar" (WIP na Fase 1).
- **TOC** (só no Post) ~220px à direita, sticky, highlight do heading ativo. Some no mobile.

### 4.2 Card de Source

```
┌──────────────────────┐
│  ▓▓▓ cover (16:9) ▓▓▓ │  ← cover.png OU fallback (gradiente + inicial)
├──────────────────────┤
│ AI Hero              │  ← name
│ Matt Pocock          │  ← author (muted)
│ Curso sobre construir│  ← description (clamp 2 linhas)
│ aplicações de IA…    │
├──────────────────────┤
│ 3 posts · 0 views · 0│  ← indicadores
└──────────────────────┘
```

- **Cover:** campo `cover:` no `source.yml` (asset local em `content/`). Ausente →
  **fallback gerado**: gradiente determinístico + inicial/monograma da Source.
- **Indicadores:** `N posts` é **real na Fase 1** (derivado do MDX). `views` e `votes`
  são desenhados mas ficam em **estado WIP/zero até a Fase 2** (precisam de Postgres).
  Termo é **votes** (upvote), nunca "reactions" — emoji reactions estão fora de escopo
  permanente ([CONTEXT.md](../CONTEXT.md), invariante 11).

### 4.3 Card de Post (Blog `direct` e lista dentro do Source)

- Título + data + tags (chips) + summary (clamp). Sem cover por padrão (mais sóbrio que
  o card de Source); pode ganhar acento sutil no hover.

### 4.4 Leitura do Post

- Coluna ~680–720px, prosa sans, headings com âncora, TOC sticky à direita.
- **Code blocks:** Shiki, header com filename, botão copiar, mono. Callouts/admonitions
  on-brand. Imagens com borda hairline e raio.
- Cabeçalho do Post: título, data, tags, autor (display via `identity` na Fase 2).
- Rodapé: barra de **engagement** (votar + comentários) — desenhada, desabilitada na Fase 1.

### 4.5 Engagement (estado visual; funcional na Fase 2)

- **Votar:** botão com contador, toggle otimista (1 voto por par User·Artifact — invariante 3).
- **Comentários:** lista **flat** (sem replies aninhadas — invariante 10), cada item com
  avatar, display name, timestamp; menções `@usuario` como referência humana.
- Sem reactions/emoji (invariante 11). Na Fase 1 o bloco aparece com overlay "em breve".

### 4.6 Player de Presentation (slide-kit)

- Palco do slide centralizado, chrome mínimo: progresso (n/total), prev/next, navegação
  por teclado (← → · Esc), barra que some em idle. Render via `slide-kit`
  ([ADR-0012](../adr/0012-slide-kit-base-plus-extensoes-locais.md)). Navegável por teclado (WCAG).

### 4.7 Busca (⌘K)

- Overlay centralizado estilo command palette (Linear). Resultados agrupados por Section;
  filtro por **tags curadas** ([ADR-0008](../adr/0008-tags-curadas.md)); navegável por teclado.

### 4.8 Template WIP & 404

- Centralizado, on-brand: ícone, nome da Section/rota, frase ("estou construindo isto"),
  CTA de volta (ex.: para Courses), teaser opcional do que vem.

---

## 5. Implicações que saem desta direção

- **Campo novo `cover` no `source.yml`** (opcional). Emenda o schema da
  [spec 0001](../specs/0001-cadeia-with-sources-aihero.md) e a definição de **Source** em
  [CONTEXT.md](../CONTEXT.md) (atualizada nesta sessão). Fallback gerado cobre Sources sem cover.
- **Indicadores views/votes** são UI desenhada na Fase 1 mas só ganham dado real na
  **Fase 2** (Postgres + engagement). O protótipo deve mostrá-los explicitamente como
  placeholder/zero para não prometer o que não existe.
- **Botão "entrar" / auth** é Fase 2: presente no chrome, inativo/WIP na Fase 1.

## 6. Próximo passo

Enviar este documento ao **Claude Design** para gerar o protótipo de alta fidelidade.
Como o Claude Design lê o codebase para montar o design system, vale apontá-lo para
`apps/web` (estado atual) + este doc. O protótipo é insumo de refinamento, não decisão
final — itens marcados "ponto de partida" são para iterar.
