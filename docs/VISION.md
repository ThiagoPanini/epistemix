# Visão — epistemix

## Resumo

`epistemix` é um hub pessoal open source que centraliza o aprendizado contínuo do mantenedor em um espaço público de alto padrão visual. O hub agrega múltiplos formatos de artefatos de aprendizado: posts de blog, notas de cursos, reviews de livros, anotações de certificações e apresentações técnicas em slides. Com mecanismos de engajamento de comunidade e, numa segunda versão, abertura para múltiplos autores criarem seus próprios hubs.

## Por que existe

1. **Para o autor:** consolidar a produção intelectual (software, AI, dados/analytics, SRE) em um espaço próprio e estruturado — em vez de fragmentar entre blogs avulsos, Speaker Deck, repositórios de slides, PDFs e notas privadas.
2. **Para a comunidade:** oferecer uma vitrine curada do aprendizado técnico com mecanismos de descoberta (filtros, busca, seções temáticas) e engajamento (views, upvotes, comentários).
3. **Como vitrine de engenharia AI-first:** o próprio processo de construção é parte do produto. O repositório deve ser um exemplo público de como construir SaaS modernos com fluxo de desenvolvimento assistido por IA (Claude Code + agentes + skills + MCPs).

## Público-alvo

- **Autor (V1):** o próprio mantenedor publicando seus artefatos de aprendizado. Sem multi-tenant nesta fase.
- **Audiência (V1):** desenvolvedores e engenheiros interessados nos temas estudados.
- **Outros autores (V2+):** abertura controlada para múltiplos autores criarem seus próprios hubs de aprendizado (eventualmente como SaaS multi-tenant pago).

## Formatos de artefato (V1)

- **Blog** — posts técnicos soltos, sem source externo vinculado.
- **Courses** — notas e reflexões sobre cursos específicos, organizadas por curso.
- **Books** — reviews e anotações sobre livros, organizadas por livro.
- **Certifications** — material de estudo e reflexões sobre certificações, organizadas por certificação.
- **Presentations** — apresentações técnicas em slides, renderizadas via slide-kit.

## Atributos não-funcionais

- **Estética como diferencial:** padrão visual referenciado em codewiki.google — dark first, gradientes leves, animações elegantes sem extravagância. Performance percebida não pode ser sacrificada pela estética.
- **SEO:** hub público precisa indexar bem. Server rendering por padrão.
- **Acessibilidade:** WCAG AA mínimo. Player de slides navegável via teclado.
- **Custo previsível:** infra fixa em VPS, sem surpresas de billing serverless.
- **Open source dia 1:** repositório público desde o primeiro commit. Setup AI-first exemplar.

## O que NÃO é

- Não é um editor de slides (não substitui PowerPoint/Keynote/Google Slides).
- Não é uma plataforma de webinars ao vivo.
- Não é um LMS (learning management system) com trilhas, quizzes e certificação.
- Não é um journal privado — tudo que entra é pensado para ser público.
- Não é (na V1) um marketplace multi-autor.

## Critério de sucesso da V1

Pelo menos uma `Section` de cada tipo (`Blog`, `Courses`, `Books`, `Certifications`, `Presentations`) com ao menos 1 `Artifact` publicado em produção, com design polido e mecanismos básicos de engajamento ativos. Sem isso, não vale falar de V2.
