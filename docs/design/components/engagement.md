# Engagement

## Status

As-built.

## Propósito

Dar feedback público e participação leve sem transformar a leitura em rede social:
views, upvote autenticado e comentários flat.

## Fronteira de código

- Vote: `apps/web/app/_components/vote-button.tsx:8`
- View tracker: `apps/web/app/_components/view-tracker.tsx:14`
- Comments: `apps/web/app/_components/comment-section.tsx:139`
- Rotas de leitura: `apps/web/app/[section]/[source]/[post]/page.tsx:132`
- CSS: `apps/web/app/globals.css:785`, `1048`, `1137`

## Estrutura / DOM

`.engage` é uma barra horizontal com botão de upvote e metadados. `.disc` é a
seção de discussão com cabeçalho, contador, lista `.cmt-list` e formulário ou CTA
de login.

## Tokens usados

`--ln`, `--ac`, `--ac-soft`, `--ac-line`, `--ac-text`, `--ink`, `--mut`,
`--fnt`, `--bg2`, `--mono`, `--serif`.

## Estados e interação

- Anônimo: botão de voto disabled com título "Entre para votar"; comentários
  mostram CTA de login.
- Autenticado: upvote é toggle otimista, com `aria-pressed`.
- Pending: botão disabled.
- Comment form: contador 0/2000, erro de rede/rate limit, submit disabled vazio.
- Delete: autor do comentário ou admin pode remover.

## Movimento

Sem animação local. Transições de hover em botões e links são curtas.

## A11y

- Voto usa `aria-pressed` e `aria-label`.
- Botão de delete tem `aria-label`.
- Textarea tem placeholder instrutivo, mas mudanças futuras devem adicionar label
  visível ou associada se o formulário ficar mais complexo.

## Invariantes

- `Vote` é sobre `Artifact`, nunca comentário.
- Comentário é flat; sem replies aninhadas.
- Badge `AUTOR` usa acento, mas moderação segue papel admin no servidor.

## Como editar

Novas métricas entram como `.eng-stat` e precisam existir no domínio/engagement.
Não adicione reações emoji sem ADR, pois contradiz `docs/CONTEXT.md`.
