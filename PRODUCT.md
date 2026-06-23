# Product

## Register

product

## Users

- **Autor (V1):** Thiago Panini, mantenedor solo, publicando seus próprios artefatos de aprendizado — posts de blog, notas de cursos, reviews de livros, anotações de certificações e apresentações técnicas. Sem multi-tenant nesta fase. O job: consolidar a produção intelectual (software, AI, dados/analytics, SRE) num espaço próprio com cara profissional, em vez de fragmentar entre blogs avulsos, Speaker Deck, PDFs e notas privadas.
- **Audiência (V1):** desenvolvedores e engenheiros interessados nos temas estudados. Chegam por busca ou link, em modo de leitura focada (com frequência em ambiente escuro), e navegam por descoberta — busca, filtros por tag, seções temáticas. O job: encontrar e consumir material técnico curado sem fricção.
- **Outros autores (V2+):** abertura controlada para múltiplos autores criarem seus próprios hubs. Fora de escopo na V1.

## Product Purpose

Hub pessoal open source que centraliza o aprendizado contínuo do autor num espaço público de alto padrão visual. Agrega cinco formatos de artefato — **Blog, Courses, Books, Certifications, Presentations** — sob uma navegação no espírito de codewiki.google: sidebar, command palette (⌘K), leitura com TOC e player de slides.

Existe por três razões: (1) dar ao autor um lar único e estruturado para a produção intelectual; (2) oferecer à comunidade uma vitrine curada com descoberta e engajamento básico (views, upvotes, comentários); (3) servir de exemplo público de engenharia AI-first — o próprio processo de construção (Claude Code + agentes + skills + MCPs) é parte do produto.

Sucesso da V1: ao menos uma `Section` de cada tipo com ≥1 `Artifact` publicado em produção, design polido e engajamento básico ativo. Sem isso, não se fala de V2.

## Brand Personality

Três palavras: **refinado, preciso, técnico-discreto.**

A voz é a da confiança pela contenção e pelo craft, não pelo volume. Dark-first, com gradientes e motion presentes mas sutis — a calma de uma ferramenta de referência bem-feita, nunca o espalhafato de uma landing que grita. O engenheiro que chega deve sentir respeito pelo detalhe e foco imediato no conteúdo; o design impressiona pela precisão, não por chamar atenção para si.

Tom de copy: direto, específico, em pt-BR. Substantivo concreto e verbo que descreve o que a coisa faz — sem buzzword, sem hype, sem aforismo de marketing.

A identidade visual já está estabelecida e é para ser preservada: violeta de marca (OKLCH ~hue 256) sobre quase-preto, Inter + JetBrains Mono, aurora/gradiente como assinatura deliberada no wordmark e no hero. Gradiente em texto é assinatura de marca em pontos escolhidos, não decoração espalhada.

## Anti-references

O ethitorial explicitamente NÃO pode parecer:

- **Landing SaaS genérica** — fundo creme/areia, template hero-métrica (número gigante + label + stats), grids de cards idênticos com ícone+título+texto repetidos ao infinito, copy de buzzword (streamline / empower / supercharge / seamless).
- **Plataforma de cursos / LMS** (Udemy, Coursera) — densidade de dashboard, barras de progresso onipresentes, selos e gamificação, upsell, trilhas e quizzes.
- **Template de blog padrão** — Medium, dev.to ou tema Hashnode genérico; cara de blog idêntica à de todo mundo.
- **Clone de Notion / wiki** — estética cinza-chapada de ferramenta de produtividade, sem identidade própria.

Famílias de slop a recusar por padrão: side-stripe borders coloridas, glassmorphism decorativo, eyebrow uppercase com tracking acima de toda seção, marcadores numéricos (01/02/03) como andaime, cards super-arredondados (>16px), e ilustrações SVG "rabiscadas".

## Design Principles

1. **A estética serve o conteúdo.** O design é diferencial, mas leitura e descoberta vêm primeiro. Performance percebida nunca é sacrificada pela estética.
2. **Mostre, não conte.** O repositório é parte do produto: uma vitrine viva de engenharia AI-first. A qualidade do que se vê deve refletir a qualidade de como foi construído.
3. **Confiança pela contenção.** Impressionar por precisão e craft, não por volume. Gradiente e motion entram quando agregam, não como enfeite.
4. **Curadoria sobre quantidade.** Tags fechadas, seções deliberadas, conteúdo pensado para ser público — poucos artefatos excelentes valem mais que muitos medianos.
5. **Leitura sem fricção.** Navegação codewiki-like (command palette, breadcrumbs, TOC, player com teclado) que sai da frente do leitor.

## Accessibility & Inclusion

- **WCAG AA mínimo:** contraste de texto corpo ≥4.5:1; texto grande ≥3:1. Atenção especial aos cinzas mutados (`--text-muted`, prose) sobre superfícies escuras.
- **Teclado completo:** command palette (⌘K) e player de slides (setas, Esc) totalmente navegáveis; foco visível em todo elemento interativo.
- **Movimento reduzido:** `prefers-reduced-motion` honrado — aurora e reveals já têm fallback; manter como invariante.
- **Server rendering por padrão** para SEO e leitores de tela; `color-scheme: dark` declarado.
- **Idioma primário pt-BR** (`lang="pt-BR"`).
