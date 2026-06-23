---
name: ethitorial
description: Hub pessoal de aprendizado, dark-first, no espírito de um caderno de laboratório.
colors:
  bg: "#08090a"
  surface: "#101113"
  surface-raised: "#16181b"
  surface-hover: "#1b1d21"
  border: "#ffffff14"
  border-strong: "#ffffff24"
  ink: "#edeef0"
  ink-muted: "#8a8f98"
  ink-faint: "#5b6069"
  prose-ink: "#c8cbd1"
  accent: "oklch(0.62 0.21 256)"
  accent-hover: "oklch(0.68 0.20 256)"
  accent-soft: "oklch(0.62 0.21 256 / 0.13)"
  accent-line: "oklch(0.62 0.21 256 / 0.32)"
  accent-text: "oklch(0.78 0.13 256)"
  accent-code: "#d9c9ff"
  success: "#3fb68b"
  danger: "#f0616d"
  code-bg: "#0c0d0f"
typography:
  display:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "clamp(2.625rem, 7vw, 5.5rem)"
    fontWeight: 680
    lineHeight: 0.98
    letterSpacing: "0"
  headline:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "2.375rem"
    fontWeight: 660
    lineHeight: 1.12
    letterSpacing: "0"
  title:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "1.4375rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "0"
  body:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 450
    lineHeight: 1.5
    fontFeature: "'cv02','cv03','cv04','cv11'"
  prose:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.72
  label:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 560
    lineHeight: 1.4
    letterSpacing: "0.04em"
  mono:
    fontFamily: "JetBrains Mono, ui-monospace, SF Mono, Menlo, monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
rounded:
  btn: "8px"
  card: "12px"
  pill: "999px"
spacing:
  pad: "20px"
  gap: "18px"
  content: "40px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "#ffffff"
    rounded: "{rounded.btn}"
    padding: "0 14px"
    height: "34px"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.btn}"
    padding: "0 14px"
    height: "34px"
  button-ghost-hover:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
  card-source:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "{spacing.pad}"
  card-source-hover:
    backgroundColor: "{colors.surface-raised}"
  chip:
    backgroundColor: "#ffffff0a"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.pill}"
    padding: "2px 9px"
  nav-item-active:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.ink}"
  search-trigger:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-faint}"
    rounded: "{rounded.btn}"
    height: "34px"
    padding: "0 11px"
---

# Design System: ethitorial

## 1. Overview

**Creative North Star: "The Lab Notebook"**

O ethitorial é o caderno de laboratório de um engenheiro, levado a público e mantido com rigor. A tela é quase-preta (`#08090a`), como uma bancada à noite; o conteúdo é o que importa e a interface é o instrumento que desaparece na tarefa. Cada Post é uma entrada datada; índices em mono (`01`, `02`), datas tabulares e capas com grid sutil dão ao hub a textura de um registro técnico, não a de uma vitrine de marketing. O craft está no rigor do registro, não no enfeite.

A profundidade vem de camadas tonais, não de sombras: superfícies empilham por luminosidade (`bg → surface → surface-raised → surface-hover`) e bordas finas (branco a 8–14%) separam regiões. A única cor é o **Aurora Violet** (OKLCH hue 256), reservada para ação, seleção e estado; ela aparece em ≤10% de qualquer tela e ganha um glow deliberado no botão primário e na brand mark. A aurora de fundo (três blobs violeta à deriva) é a assinatura da marca, calibrada para ser sentida, não notada.

Este sistema rejeita explicitamente a landing SaaS genérica, a densidade de plataforma de cursos/LMS, o template de blog padrão e a estética cinza-chapada de clone de Notion. A inspiração de navegação é codewiki.google: sidebar, command palette (⌘K), leitura com TOC. Familiaridade ganha vale mais que surpresa; o deleite é reservado a momentos (a aurora, o glow do primário), nunca espalhado pela página.

**Key Characteristics:**
- Dark-first sobre quase-preto; `color-scheme: dark`.
- Uma só cor de marca (Aurora Violet), usada como sinal, nunca como decoração.
- Profundidade por camadas tonais + bordas; sombras só para flutuantes.
- Inter (UI + display) + JetBrains Mono (números, código, atalhos).
- Densidade de produto: tabelas de posts, sidebar de navegação, palette de comandos.
- Aurora como assinatura ambiente; motion curto e funcional.

## 2. Colors

Paleta monocromática escura com uma única voz cromática: tudo é neutro-frio até o Aurora Violet entrar para sinalizar.

### Primary
- **Aurora Violet** (`oklch(0.62 0.21 256)`): a cor de marca e a única saturada do sistema. Usada no preenchimento do botão primário, no preenchimento de bullets de slide e nos blobs da aurora. Nunca como decoração de superfície.
- **Aurora Violet (hover)** (`oklch(0.68 0.20 256)`): estado hover do botão primário; um passo mais claro, mesma hue.
- **Aurora Violet Text** (`oklch(0.78 0.13 256)`): a versão legível sobre escuro. É o que carrega links, eyebrows contextuais, itens de nav ativos e ícones de estado. Use esta, não a `accent` cheia, para texto e ícones.
- **Aurora Soft** (`oklch(0.62 0.21 256 / 0.13)`): tinta de fundo para item de nav ativo, item selecionado na palette e `::selection`.
- **Aurora Line** (`oklch(0.62 0.21 256 / 0.32)`): borda de acento (botão de link externo, underline de links na prosa, TOC ativo).

### Neutral
- **Bg** (`#08090a`): fundo da aplicação inteira; a bancada à noite.
- **Surface** (`#101113`): sidebar, cards em repouso, search trigger, painéis.
- **Surface Raised** (`#16181b`): card em hover, modal da command palette, code inline.
- **Surface Hover** (`#1b1d21`): hover de item de nav.
- **Ink** (`#edeef0`): texto primário e títulos.
- **Ink Muted** (`#8a8f98`): texto secundário, descrições, labels de UI. Contraste ~6:1 sobre `bg`.
- **Ink Faint** (`#5b6069`): metadados decorativos (contadores, separadores, datas em rodapés). Contraste ~3.2:1 sobre `bg`: **apenas texto grande/decorativo**, nunca corpo de leitura.
- **Prose Ink** (`#c8cbd1`): corpo dos artigos (mais quente que `ink-muted` para sessões longas de leitura).
- **Border** (`#ffffff14`, branco a 8%) e **Border Strong** (`#ffffff24`, branco a 14%): separação por contorno em vez de sombra.
- **Code Bg** (`#0c0d0f`): fundo de bloco de código, um degrau abaixo do `bg`.
- **Accent Code** (`#d9c9ff`): texto de código inline (violeta pálido).

### Tertiary
- **Success** (`#3fb68b`): dot de status "ao vivo" e estados afirmativos.
- **Danger** (`#f0616d`): erro e ações destrutivas.

### Named Rules
**The One Voice Rule.** Aurora Violet é a única cor saturada e aparece em ≤10% de qualquer tela: ação primária, seleção atual e indicadores de estado. Sua raridade é o ponto. Cinza não vira "quase-acento"; ou é neutro, ou é Aurora Violet.

**The Aurora-Text Rule.** Para texto e ícones, use sempre `accent-text` (`oklch(0.78 0.13 256)`), nunca o `accent` cheio. O `accent` cheio é para preenchimento (botão, bullet, blob), onde fica sobre escuro com texto branco por cima.

## 3. Typography

**Display Font:** Inter (fallback `system-ui, -apple-system, sans-serif`)
**Body Font:** Inter (mesma família, hierarquia por escala + peso)
**Label/Mono Font:** JetBrains Mono (fallback `ui-monospace, SF Mono, Menlo`)

**Character:** uma única família humanista (Inter, com as variantes de caractere `cv02/cv03/cv04/cv11` ligadas) carrega tudo, de display a label, com hierarquia por escala e peso, não por troca de fonte. O mono entra exclusivamente onde a coisa é "máquina": números, datas tabulares, código, atalhos de teclado, slugs. Esse contraste sans/mono é o que dá o tom de caderno técnico.

### Hierarchy
- **Display** (680, `clamp(42px, 7vw, 88px)`, lh 0.98): apenas o hero da home. `letter-spacing: 0` (Inter já é apertada o suficiente; nunca aperte abaixo de -0.04em).
- **Headline** (640–660, 30–38px, lh 1.1–1.12): h1 de página de leitura (38px) e títulos de Section/Source (30px).
- **Title** (600, 16–23px): h2/h3 da prosa (23/19px), cabeçalho de listas ("Posts", 16px).
- **Body (UI)** (450, 14px, lh 1.5): texto base da aplicação, descrições, nav.
- **Prose** (400, 17px, lh 1.72, máx. ~700px de coluna): corpo dos artigos. Mais respiro que a UI porque é para ler, não escanear.
- **Label** (560, 11px, `letter-spacing 0.04–0.05em`, UPPERCASE): rótulos de nav e de TOC, badges. Reservado a ≤4 palavras.
- **Mono** (400, 11–13px, `font-variant-numeric: tabular-nums`): índices de post, datas, contadores, `kbd`, eyebrow de slide, código.

### Named Rules
**The One-Family Rule.** Inter faz display, headline, title, body e label. Não introduza uma segunda sans nem uma serif "para dar elegância". A riqueza vem do par Inter + JetBrains Mono e do contraste de peso, não de mais fontes.

**The Machine-Mono Rule.** Mono é só para conteúdo "de máquina" (números, datas, código, atalhos, slugs). Nunca use mono em texto de prosa ou em labels de UI comuns.

## 4. Elevation

Sistema **plano por padrão, com camadas tonais**. A profundidade entre superfícies em repouso vem de luminosidade crescente (`bg → surface → surface-raised → surface-hover`) e de bordas finas, não de sombras. Cards não têm sombra em repouso: o hover eleva por mudança de cor de fundo + borda mais forte + `translateY(-2px)`, não por drop shadow. Sombras existem só para elementos que de fato flutuam acima da página (modal, toast, slide, dropdowns) e para o glow de marca.

### Shadow Vocabulary
- **Brand glow** (`0 0 0 1px {accent-line}, 0 4px 14px oklch(0.62 0.21 256 / 0.35)`): só na brand mark e, em variação, no botão primário (`0 1px 0 inset + 0 4px 14px accent/0.3`). É a única "elevação" que usa cor.
- **Overlay** (`0 24px 70px rgba(0,0,0,0.6)`): modal da command palette.
- **Floating** (`0 16px 40px rgba(0,0,0,0.5)`): toast e quadro de slide (`0 30px 90px` no player).

### Named Rules
**The Flat-At-Rest Rule.** Superfícies são planas em repouso. Sombra só aparece em resposta a estado (hover, foco) ou quando o elemento literalmente flutua (modal, toast, slide). Card com drop shadow em repouso está errado: eleve por tom + borda.

**The Z-Scale Rule.** Camadas seguem uma escala semântica fixa, nunca valores arbitrários (`999`): aurora `0` → figura `1` → header `20` → scrim `25` → sidebar `30` → player `90` → overlay/command palette `100` → toast `200`.

## 5. Components

Caráter geral: **refinado e contido.** Bordas finas, raios moderados (8–12px), transições curtas (140ms). Os componentes impressionam por precisão, não por peso.

### Buttons
- **Shape:** raio de 8px (`{rounded.btn}`), altura 34px (42px no CTA do hero).
- **Primary:** preenchimento Aurora Violet, texto branco, highlight interno + glow violeta (`0 4px 14px accent/0.3`). Único elemento que carrega cor cheia.
- **Ghost:** transparente, borda `{border}`, texto `ink-muted`; no hover ganha fundo `surface`, borda `border-strong` e texto `ink`.
- **Hover / Active:** transições de 140ms em background/borda/cor; `:active` afunda `translateY(0.5px)`.

### Chips
- **Style:** fundo branco a 4%, borda fina, formato pílula, texto `ink-muted`, 11px. Usado para tags de Post.
- **Tag filter (na palette):** mesma base; estado `.on` vira fundo `accent-soft` + borda `accent-line` + texto `accent-text`.

### Cards / Containers
- **Corner Style:** 12px (`{rounded.card}`). Nunca acima de 16px.
- **Background:** `surface` em repouso → `surface-raised` no hover.
- **Shadow Strategy:** nenhuma em repouso (ver Elevation). Hover eleva por cor + borda + `translateY(-2px)`.
- **Border:** 1px `{border}` → `{border-strong}` no hover.
- **Internal Padding:** 20px (`{spacing.pad}`).
- **Source Cover:** capa gerada por hash do slug (gradiente radial OKLCH em hues 248–302) com overlay de grid mascarado e iniciais em mono. Sem imagens stock.

### Inputs / Fields
- **Search trigger:** fundo `surface`, borda `{border}`, texto `ink-faint`, raio 8px, altura 34px, com dica `kbd` (⌘K). Hover sobe para `surface-raised` + `border-strong`.
- **Command input:** dentro do modal `cmdk`; sem borda, fundo transparente, 15px, placeholder `ink-faint`.
- **Focus:** `:focus-visible` global = outline 2px `accent` com offset 2px. Todo elemento interativo herda isso.

### Navigation
- **Sidebar (248px):** fundo `surface`, borda à direita. Itens em 13.5px `ink-muted`; hover → `surface-hover` + `ink`; ativo → fundo `accent-soft` + texto `ink` + ícone `accent-text`. Labels de grupo em UPPERCASE 11px `ink-faint`.
- **Header:** 56px, sticky, fundo `bg` a 78% com `backdrop-filter: blur(12px)`, breadcrumbs em `ink-muted`.
- **Mobile (≤920px):** sidebar vira drawer fixo (`translateX(-100%)`) com scrim; botão de menu aparece no header.

### Signature: Aurora + reading column
- **Aurora:** três blobs violeta (`filter: blur(70px)`, `mix-blend-mode: screen`) à deriva em 22s, recortados por uma máscara radial para o `bg`. Desligada em `prefers-reduced-motion`. É o único elemento puramente decorativo permitido, e mesmo assim discreto.
- **Reading column:** grid `1fr · minmax(0, 700px) · 1fr` com TOC sticky de 220px à direita; some abaixo de 920px. Prosa em 17px/1.72, links com underline `accent-line`.

## 6. Do's and Don'ts

### Do:
- **Do** manter o fundo quase-preto (`#08090a`) e construir profundidade por camadas tonais + bordas finas (branco 8%/14%), não por sombras.
- **Do** usar Aurora Violet só como sinal (ação, seleção, estado) em ≤10% da tela; para texto/ícone use `accent-text`, para preenchimento use `accent`.
- **Do** carregar toda a tipografia em Inter + JetBrains Mono, com hierarquia por escala e peso; mono só para números, datas, código, atalhos e slugs.
- **Do** manter raios em 8px (botão) e 12px (card); pílula só para chips e tags.
- **Do** reservar gradiente em texto exclusivamente para o wordmark e o `.grad` do hero; é assinatura de marca em pontos escolhidos.
- **Do** dar a todo componente interativo os estados default/hover/focus-visible/active/disabled, com o outline de foco padrão (2px `accent`, offset 2px).
- **Do** honrar `prefers-reduced-motion`: aurora e reveals já têm fallback; mantenha como invariante.

### Don't:
- **Don't** parecer uma **landing SaaS genérica**: nada de fundo creme/areia, template hero-métrica (número gigante + label + stats) ou grids de cards idênticos com ícone+título+texto.
- **Don't** parecer uma **plataforma de cursos / LMS**: sem barras de progresso onipresentes, selos, gamificação ou densidade de dashboard.
- **Don't** parecer um **template de blog padrão** (Medium/dev.to/Hashnode) nem um **clone de Notion/wiki** cinza-chapado sem identidade.
- **Don't** usar `border-left`/`border-right` > 1px como faixa colorida em cards, itens de lista, callouts ou alertas. (O `border-left` de 2px é permitido só no `blockquote`, convenção tipográfica.)
- **Don't** colar eyebrow UPPERCASE com tracking acima de toda seção, nem marcadores numéricos `01 / 02 / 03` como andaime. Numeração só quando a ordem carrega informação (lista de posts, passos reais). UPPERCASE é reservado a labels de nav/TOC.
- **Don't** arredondar cards acima de 16px, nem parear borda 1px com drop shadow ≥16px no mesmo elemento.
- **Don't** usar glassmorphism decorativo (o `backdrop-filter` do header e do badge é funcional, não enfeite) nem gradiente em texto fora do wordmark/hero.
- **Don't** usar `ink-faint` (`#5b6069`) em texto de corpo: ele só passa AA como texto grande/decorativo. Para qualquer coisa legível, suba para `ink-muted` ou `ink`.
- **Don't** introduzir uma segunda família de fonte nem display fonts em labels, botões ou dados.
