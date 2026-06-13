# DESIGN.md — Sistema visual do epistemix (Direção A · "Prensa")

> **Fonte de verdade visual.** Este documento destila os tokens e padrões da
> **Direção A — "Prensa"** do protótipo de alta fidelidade em
> `.claude/design/epistemix-redesenho-completo/` (Claude Design, jun 2026). O
> protótipo é **absoluto**: quando este doc e o protótipo divergirem, o protótipo
> vence e este doc deve ser corrigido. Recria-se o **resultado visual**, não a
> estrutura interna do protótipo (hash-router, mock em `data.js`).
>
> Supersede `docs/design/0001-direcao-visual-v1.md` (direção violeta/Linear,
> aposentada). Domínio em [CONTEXT.md](CONTEXT.md).

## 0. Conceito

O hub como **publicação impressa de engenharia** — um caderno público. Masthead
tipográfico, hairlines de jornal, rubricas horizontais, serif na prosa, e um
**acento quente (laranja) usado como tinta de destaque** — sinal, nunca decoração.
Dark-first, sóbrio, leitura sem fricção, navegação por teclado.

## 1. Tipografia

| Papel | Família | Uso |
|---|---|---|
| **Sans** | `Archivo` (400/500/600/700/800), fallback `system-ui` | UI, títulos, masthead, headings de prosa |
| **Serif** | `Source Serif 4` (400/600, ital), fallback `Georgia` | corpo da prosa, standfirst, descrições, itens de slide |
| **Mono** | `Spline Sans Mono` (400/500), fallback `ui-monospace` | metadados, rubricas, kickers, datas, chips, código |

Pesos altos (750–800) + `letter-spacing` negativo (-0.02 a -0.035em) nos títulos
grandes. Mono sempre com tracking positivo (0.04–0.14em) e caixa alta nos rótulos.

**Escala (clamp fluida):** masthead `clamp(64px,11vw,138px)` · h1 de página
`clamp(38px,5.5vw,62px)` · h1 de leitura `clamp(32px,4.6vw,48px)` · lead h2
`clamp(34px,4.6vw,54px)` · prosa **17.5px / line-height 1.78** · h2 de prosa 26px
· corpo de UI 14.5px/1.55.

## 2. Cor (tokens)

Todos no `:root`, `color-scheme: dark`. **Acento fixo** (painel de Tweaks do
protótipo foi descartado — não há troca de acento em produção).

```css
--bg:   #0c0b09;  --bg2: #0f0e0b;  --sf: #14120e;  --sfr: #1a1712;
--ln:        rgba(240,235,224,0.12);   /* hairline padrão */
--lns:       rgba(240,235,224,0.28);   /* hairline forte (hover/foco) */
--ln-heavy:  #f0ebe0;                  /* régua sólida (masthead, page-head) */
--ink: #f0ebe0;   --mut: #a59d8d;   --fnt: #6e6759;   /* texto: forte/médio/fraco */
--ac:      oklch(0.72 0.18 45);        /* acento laranja */
--ac-text: oklch(0.80 0.13 48);        /* acento legível sobre fundo escuro */
--ac-soft: oklch(0.72 0.18 45 / 0.12); /* realce/seleção/chip ativo */
--ac-line: oklch(0.72 0.18 45 / 0.4);  /* borda de acento */
```

Prosa em `#d9d2c4`; código em `#e3dccd` sobre `#080705`. Botão primário
(`.btn-read`): fundo `--ac`, texto `#14100b`, peso 700.

## 3. Layout & espaçamento

- **Container:** `.wrap` max-width **1180px**, padding lateral 36px (20px ≤720px).
- **Hairlines fazem a estrutura**, não sombras. Profundidade por `--bg/--sf` + borda.
  Sombra só em overlays (palette, player).
- **Densidade:** `--row-pad: 18px` (conforto). A variante `compact` (11px) era do
  painel de Tweaks → **não vai para produção**.
- **Rubricas (nav):** barra sticky no topo, `backdrop-filter: blur(10px)`, itens com
  borda-direita hairline e `border-top` de 2px que acende no acento quando ativo.
- **Leitura:** grid `minmax(0,700px) 220px`, gap 64px, centralizado; TOC sticky
  (`top:70px`) à direita, some ≤1000px.

## 4. Componentes-chave (todos no protótipo A)

- **Masthead (home):** wordmark gigante + régua sólida 3px + **uma** linha mono de
  tagline: `ESPAÇO PESSOAL DE APRENDIZADO E ESTUDO · THIAGO PANINI`. A segunda linha
  de "edição" do protótipo (`ED. Nº N — MÊS ANO`) foi **removida** (decisão 2026-06-12);
  a metáfora editorial "Prensa" vive no visual, não mais na cópia da tagline.
- **Now Learning:** faixa com label mono à esquerda (`● AGORA ESTUDANDO`, dot que
  pulsa) + cards roláveis horizontalmente; "há 2 dias" em `--ac-text`.
- **Lead grid:** destaque (kicker + h2 grande + standfirst serif + meta mono +
  `Ler o post →`) | coluna "Últimas entradas" com `cronologia →`.
- **Grid de seções:** 5 colunas, cada uma com régua sólida que acende no acento ao hover.
- **Página de seção:** `direct` (blog/talks) → `.art-row` (data | título+excerpt+tags |
  lado mono); `with_sources` (courses/books/certs) → `.src-card` + lista de notas `.note-row`.
- **Leitura (Post):** head (kicker→seção/source, h1, standfirst, meta, tags) → barra
  `.engage` (upvote toggle, leituras, comentários, `▶ Abrir slides`) → prosa serif
  (h2 com régua superior + `scroll-margin-top`, `pre`, `blockquote` com borda de acento)
  → **Discussão** (`.disc`): comentários flat (badge `AUTOR` no acento) + textarea.
- **Cronologia:** ano gigante fantasma (`--fnt`, opacity .55) + linhas
  `data | tipo | label`; tipos "quentes" (publicação/palestra/conquista) em `--ac-text`.
- **Grafo:** SVG `viewBox 0 0 1000 640`, legenda mono; tag = quadrado no acento,
  artefato = círculo (raio ∝ √leituras); hover acende vizinhança, clique navega.
- **⌘K (command palette):** scrim escuro, caixa 640px, resultados agrupados por seção,
  navegação ↑↓/↵/esc, rodapé de atalhos.
- **Player de slides:** fullscreen, barra de progresso no topo no acento, palco 16/9,
  navegação ← →/esc, resume via `localStorage`. Render via `slide-kit`
  ([ADR-0012](adr/0012-slide-kit-base-plus-extensoes-locais.md)).
- **Chips:** `.tag` (mono, caixa alta, borda hairline) e `.status-chip` (acento, p/
  "em estudo"/"slides").

## 5. Motion

- Transições de 100–240ms, `ease-out`. Hover de links/cards → `--ac-text` ou `--sf`.
- Entrada de view: `translateY(8px)→0` em 260ms.
- Dot de "agora estudando" pulsa (2.2s).
- **Tudo atrás de `prefers-reduced-motion`** (o protótipo gateia via
  `body[data-motion="on"]` + `@media (prefers-reduced-motion: no-preference)`).

## 6. Responsivo (breakpoints do protótipo)

`1020px` (seções 5→3 col) · `1000px` (TOC some) · `860px` (now-learning, lead e
seções colapsam) · `720px` (art-row e tl-row viram 1 coluna; wrap 20px) · `660px`
(seções 2 col). **Mobile e estados vazios** o protótipo deixou sub-especificados
(ver §7) — refinar com a skill `frontend-design`/`impeccable` na implementação.

## 7. Lacunas conhecidas do protótipo (resolver na implementação)

O próprio `index.html` do bundle aponta como "próximos passos": **estados vazios**,
**refino mobile** e **página de tag**. Além disso, por decisão da sessão de redesenho:

- **Nav de conta** (avatar, menu, login, perfil `/authors/<username>`) — **não existe
  no protótipo A** e foi adicionada deliberadamente para suportar engajamento
  autenticado. Desenhar no idioma editorial de A.
- **CTA de login contextual** no bloco de engajamento ("entre para votar/comentar").
- **Tela de sign-in** (resolvido 2026-06-12): **card central enriquecido** — wordmark +
  régua hairline + value-prop "Entre para votar, comentar e acompanhar o que está sendo
  publicado." + form (e-mail/senha) + divisor "ou" + social. Não é split-screen.
- **Seções vazias** (resolvido 2026-06-12): permanecem **visíveis** na nav e no grid
  5-col da home com contagem `00 entradas`; a página da seção mostra o empty state.
  Não se escondem (preserva o grid de 5 colunas e comunica o roadmap do hub).
- **Página de tag** não foi prototipada; tag hoje só aparece como chip e no grafo.
  Decidir se vira rota própria ou filtro no ⌘K.

## 8. Recriação técnica

Protótipo é React + hash-router + mock; produção é **Next.js 15 App Router**,
**server-rendered** (SEO — restrição da [VISION](VISION.md)). URLs **EN aninhadas**:
`/blog/<slug>`, `/courses/<source>/<slug>`, `/books/<source>/<slug>`,
`/certifications/<source>/<slug>`, `/talks/<slug>`, `/timeline`, `/graph`,
`/authors/<username>`. Código via `slide-kit` para o player; prosa via MDX (Shiki
no `pre`, com header de filename + copiar — refino sobre o `pre` cru do protótipo).
