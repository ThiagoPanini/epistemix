# Especificação visual

## Fonte dos tokens

Tokens vivos: bloco `:root` de `apps/web/app/globals.css`. Fontes web: `apps/web/app/layout.tsx` (imports de `next/font/google`). Este arquivo descreve o contrato; não duplica a fonte-da-verdade.

## Taxonomia de tokens

| Camada | Tokens | Uso |
|---|---|---|
| Substrato | `--bg`, `--bg2`, `--sf`, `--sfr` | fundo base, faixas, cards e menus elevados |
| Hairlines | `--ln`, `--lns`, `--ln-heavy` | estrutura editorial, bordas, réguas, hover forte |
| Texto | `--ink`, `--mut`, `--fnt` | texto primário, secundário e fantasma |
| Acento | `--ac`, `--ac-text`, `--ac-soft`, `--ac-line` | laranja de sinal, links ativos, badges, foco e seleção |
| Tipografia | `--sans`, `--serif`, `--mono` | UI/editorial, prosa e metadados |
| Densidade | `--row-pad` | ritmo vertical de linhas/listagens |

Tokens raiz atuais estão em uso. Não há token de reserva órfão no `:root`. Se um token futuro nascer antes do uso, catalogue-o como **reserva: futuro, não fiado** com dono, intenção e condição de ativação.

## Tipografia

- Sans: `Archivo`, injetada via `--font-sans` (`apps/web/app/layout.tsx` `archivo`), usada em UI, masthead, headings e títulos.
- Serif: `Source Serif 4`, injetada via `--font-serif` (`apps/web/app/layout.tsx` `sourceSerif4`), usada em prosa, standfirst, descrições e slides.
- Mono: `Spline Sans Mono`, injetada via `--font-mono` (`apps/web/app/layout.tsx` `splineSansMono`), usada em datas, rubricas, chips, metadados, teclado e código.

Títulos grandes usam peso alto e tracking negativo local. Rótulos mono usam caixa alta, tracking positivo e cor `--fnt`, `--mut` ou `--ac-text`.

Escalas as-built principais (em `apps/web/app/globals.css`):

- Masthead: `clamp(64px, 11vw, 138px)` na regra `.mast h1`.
- H1 de página: `clamp(38px, 5.5vw, 62px)` na regra `.page-head h1`.
- H1 de leitura: `clamp(32px, 4.6vw, 48px)` na regra `.read-head h1`.
- Lead H2: `clamp(34px, 4.6vw, 54px)` na regra `.lead h2`.
- Prosa MDX: `17.5px / 1.78` na regra `.prose`.

## Voz e copy

Voz visual: publicação técnica pessoal, não SaaS genérico. Use "rubrica", "fonte", "nota", "post", "cronologia", "grafo" e "agora estudando" quando a UI pede rótulo humano. Em domínio e código, preserve `Section`, `Source`, `Artifact`, `Post`, `Presentation`, `Timeline`, `Knowledge Graph` e `Now Learning` conforme `docs/CONTEXT.md`.

Marca corrente: `ethitorial`. O nome antigo só aparece em procedência histórica, ADRs antigos ou notas de migração. Não use copy antiga do bundle em telas novas.

Kickers e metadados são informativos, curtos e mono. Evite textos explicativos longos dentro da interface; a UI deve parecer editorada, não tutorializada.

## Movimento

Movimento é contido e funcional (keyframes e gates em `apps/web/app/globals.css`):

- Entrada de view: `viewin` em 260ms, atrás de `[data-motion="on"]` e `@media (prefers-reduced-motion: no-preference)` (bloco `MOTION`, regra `[data-motion="on"] .view` + `@keyframes viewin`).
- Pulso do ponto de "Agora estudando": `pulse` em 2.2s, também reduzível (regra `[data-motion="on"] .live-dot` sob `@media (prefers-reduced-motion: no-preference)` + `@keyframes pulse`).
- Skeleton da conta: `acct-skeleton-pulse` (`@keyframes acct-skeleton-pulse`), com desligamento explícito em `@media (prefers-reduced-motion: reduce)`.
- Transições de hover ficam entre 100ms e 240ms.

Convenção: se CSS Modules forem introduzidos, keyframes ficam co-localizadas ao componente que as usa, porque nomes de animation podem escopar. Em CSS global, keyframes ficam no bloco do componente ou na seção `MOTION`.

## Literais conscientes

Use tokens por padrão. Literais abaixo são aceitos porque representam ajuste ótico, runtime ou API que ainda não tem token próprio. Localização por seletor CSS em `apps/web/app/globals.css` (ou símbolo no componente). Se repetir um literal novo, pare e crie token ou catalogue aqui.

| Literal | Local | Espelho / intenção |
|---|---|---|
| `#14100b` | regras `.btn-read`, `.cmt-submit`, `.auth-submit` | texto escuro sobre `--ac`; espelha substrato quente |
| `#d9d2c4` | regras `.prose`, `.slide li` | prosa quente; próximo de `--ink`, mais suave |
| `#080705` | regras `.prose pre`, `[data-rehype-pretty-code-title]` | fundo de código/pre; mais profundo que `--bg` |
| `#e3dccd` | regra `.prose pre` | texto de código; próximo de `--ink` |
| `rgba(255,255,255,0.025)` / `0.07` | regras `.prose tbody tr:nth-child(even) td`, `.prose :not(pre) > code` | chrome sutil de tabela/código |
| `rgba(5,4,3,0.72)` | regra `.scrim` | scrim da paleta |
| `rgba(0,0,0,0.65)` | regra `.pal` (`box-shadow`) | sombra de overlay |
| `#070605` | regra `.player` | fundo fullscreen do player |
| `oklch(0.7 0.2 25)` | regras `.cmt-del:hover`, `.cmt-error`, `.auth-error` | erro/destrutivo; candidato a `--danger` se repetir |
| `#fff` / `rgba(255,255,255,0.55)` | `apps/web/app/_components/primitives.tsx` `BrandMark` | stroke interno do `BrandMark` SVG |
| Gradientes por hue | `apps/web/app/_components/primitives.tsx` `Avatar` e `SourceCover` | avatar e source cover gerados por texto |

## Convenção de extensão

- Primeiro procure token existente.
- Se um novo valor tiver papel semântico recorrente, crie token no `:root` e documente a camada.
- Se for valor isolado por renderização, catalogue como literal consciente.
- Estados novos precisam de foco visível, hover, disabled quando aplicável e reduced-motion se houver animação.
