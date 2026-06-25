# Auth, conta e autor

## Status

As-built.

## Propósito

Suportar engagement autenticado sem quebrar a identidade editorial: login, signup, menu de conta e perfil público.

## Fronteira de código

- Auth shell: `apps/web/app/_components/auth-layout.tsx` (componente `AuthLayout`)
- Sign-in: `apps/web/app/auth/sign-in/page.tsx`
- Sign-up: `apps/web/app/auth/sign-up/page.tsx`
- Social auth: `apps/web/app/_components/auth-social.tsx` (componente `AuthSocial`)
- Account nav: `apps/web/app/_components/account-nav.tsx` (componente `AccountNav`)
- Author page: `apps/web/app/authors/[username]/page.tsx`
- CSS: `apps/web/app/globals.css`, blocos AVATAR (`.avatar`), ACCOUNT NAV (`.acct-wrap`, `.acct-skeleton`, `.acct-item`), AUTH PAGES (`.auth-page`, `.auth-split`), AUTHOR PROFILE (`.author-page`, `.author-empty`)

## Estrutura / DOM

Auth usa `.auth-page > .auth-split`: aside editorial com marca/tagline/edição e coluna de formulário. Conta no header usa `.acct-wrap`, botão com avatar e menu. Perfil usa `.author-page` e lista de posts.

## Tokens usados

`--bg2`, `--sf`, `--sfr`, `--ln`, `--lns`, `--ln-heavy`, `--ink`, `--mut`, `--fnt`, `--ac`, `--ac-text`, `--ac-line`, `--mono`, `--serif`.

## Estados e interação

- Conta pendente: skeleton sem reflow.
- Anônimo: link `ENTRAR`.
- Autenticado: botão de conta abre menu.
- Auth form: pending, erro, submit disabled, social pending/error.
- Perfil sem posts mostra empty copy (`Ainda não há publicações`, `.author-empty`).

## Movimento

Skeleton pulsa (`@keyframes acct-skeleton-pulse 1.2s infinite`) e desliga em `prefers-reduced-motion: reduce`. Hover de menu (`.acct-item`) usa transição de cor e background (120ms).

## A11y

Menu usa `aria-expanded` e `role="menu"`. Inputs de auth devem manter labels. Botões disabled precisam continuar legíveis.

## Invariantes

- Auth é split editorial as-built. Docs antigos que falavam em card central foram superados pelo código.
- Conta completa é extensão deliberada ao bundle para suportar engagement.
- Autor público é `User` no domínio; UI pode dizer autor/publicador.

## Como editar

Mudanças em auth devem consultar segurança e domínio. Não adicione provedor pago sem ADR. Visualmente, preserve aside editorial em desktop e colapso limpo em mobile.
