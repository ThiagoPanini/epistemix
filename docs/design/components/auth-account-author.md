# Auth, conta e autor

## Status

As-built.

## Propósito

Suportar engagement autenticado sem quebrar a identidade editorial: login, signup,
menu de conta e perfil público.

## Fronteira de código

- Auth shell: `apps/web/app/_components/auth-layout.tsx:28`
- Sign-in: `apps/web/app/auth/sign-in/page.tsx:10`
- Sign-up: `apps/web/app/auth/sign-up/page.tsx:23`
- Social auth: `apps/web/app/_components/auth-social.tsx:25`
- Account nav: `apps/web/app/_components/account-nav.tsx:8`
- Author page: `apps/web/app/authors/[username]/page.tsx:40`
- CSS: `apps/web/app/globals.css:1696`, `1815`, `2058`

## Estrutura / DOM

Auth usa `.auth-page > .auth-split`: aside editorial com marca/tagline/edição e
coluna de formulário. Conta no header usa `.acct-wrap`, botão com avatar e menu.
Perfil usa `.author-page` e lista de posts.

## Tokens usados

`--bg2`, `--sf`, `--sfr`, `--ln`, `--lns`, `--ln-heavy`, `--ink`, `--mut`,
`--fnt`, `--ac`, `--ac-text`, `--ac-line`, `--mono`, `--serif`.

## Estados e interação

- Conta pendente: skeleton sem reflow.
- Anônimo: link `ENTRAR`.
- Autenticado: botão de conta abre menu.
- Auth form: pending, erro, submit disabled, social pending/error.
- Perfil sem posts mostra empty copy.

## Movimento

Skeleton pulsa e desliga em reduced-motion. Hover de menu usa transição de cor e
background.

## A11y

Menu usa `aria-expanded` e `role="menu"`. Inputs de auth devem manter labels.
Botões disabled precisam continuar legíveis.

## Invariantes

- Auth é split editorial as-built. Docs antigos que falavam em card central foram
  superados pelo código.
- Conta completa é extensão deliberada ao bundle para suportar engagement.
- Autor público é `User` no domínio; UI pode dizer autor/publicador.

## Como editar

Mudanças em auth devem consultar segurança e domínio. Não adicione provedor pago
sem ADR. Visualmente, preserve aside editorial em desktop e colapso limpo em
mobile.
