# Especificação visual

## Fonte dos tokens

Tokens vivos: `apps/web/app/globals.css:9`. Fontes web: `apps/web/app/layout.tsx:58`.
Este arquivo descreve o contrato; não duplica a fonte-da-verdade.

## Taxonomia de tokens

| Camada | Tokens | Uso |
|---|---|---|
| Substrato | `--bg`, `--bg2`, `--sf`, `--sfr` | fundo base, faixas, cards e menus elevados |
| Hairlines | `--ln`, `--lns`, `--ln-heavy` | estrutura editorial, bordas, réguas, hover forte |
| Texto | `--ink`, `--mut`, `--fnt` | texto primário, secundário e fantasma |
| Acento | `--ac`, `--ac-text`, `--ac-soft`, `--ac-line` | laranja de sinal, links ativos, badges, foco e seleção |
| Tipografia | `--sans`, `--serif`, `--mono` | UI/editorial, prosa e metadados |
| Densidade | `--row-pad` | ritmo vertical de linhas/listagens |

Tokens raiz atuais estão em uso. Não há token de reserva órfão no `:root`. Se um
token futuro nascer antes do uso, catalogue-o como **reserva: futuro, não fiado**
com dono, intenção e condição de ativação.

## Tipografia

- Sans: `Archivo`, injetada via `--font-sans`, usada em UI, masthead, headings e
  títulos (`apps/web/app/layout.tsx:36`).
- Serif: `Source Serif 4`, injetada via `--font-serif`, usada em prosa,
  standfirst, descrições e slides (`apps/web/app/layout.tsx:43`).
- Mono: `Spline Sans Mono`, injetada via `--font-mono`, usada em datas, rubricas,
  chips, metadados, teclado e código (`apps/web/app/layout.tsx:50`).

Títulos grandes usam peso alto e tracking negativo local. Rótulos mono usam caixa
alta, tracking positivo e cor `--fnt`, `--mut` ou `--ac-text`.

Escalas as-built principais:

- Masthead: `clamp(64px, 11vw, 138px)` em `apps/web/app/globals.css:248`.
- H1 de página: `clamp(38px, 5.5vw, 62px)` em `apps/web/app/globals.css:580`.
- H1 de leitura: `clamp(32px, 4.6vw, 48px)` em `apps/web/app/globals.css:770`.
- Lead H2: `clamp(34px, 4.6vw, 54px)` em `apps/web/app/globals.css:378`.
- Prosa MDX: `17.5px / 1.78` em `apps/web/app/globals.css:832`.

## Voz e copy

Voz visual: publicação técnica pessoal, não SaaS genérico. Use "rubrica",
"fonte", "nota", "post", "cronologia", "grafo" e "agora estudando" quando a UI
pede rótulo humano. Em domínio e código, preserve `Section`, `Source`, `Artifact`,
`Post`, `Presentation`, `Timeline`, `Knowledge Graph` e `Now Learning` conforme
`docs/CONTEXT.md`.

Marca corrente: `ethitorial`. O nome antigo só aparece em procedência histórica,
ADRs antigos ou notas de migração. Não use copy antiga do bundle em telas novas.

Kickers e metadados são informativos, curtos e mono. Evite textos explicativos
longos dentro da interface; a UI deve parecer editorada, não tutorializada.

## Movimento

Movimento é contido e funcional:

- Entrada de view: `viewin` em 260ms, atrás de `[data-motion="on"]` e
  `prefers-reduced-motion: no-preference` (`apps/web/app/globals.css:2154`).
- Pulso do ponto de "Agora estudando": `pulse` em 2.2s, também reduzível
  (`apps/web/app/globals.css:164`).
- Skeleton da conta: `acct-skeleton-pulse`, com desligamento explícito em
  `prefers-reduced-motion: reduce` (`apps/web/app/globals.css:1735`).
- Transições de hover ficam entre 100ms e 240ms.

Convenção: se CSS Modules forem introduzidos, keyframes ficam co-localizadas ao
componente que as usa, porque nomes de animation podem escopar. Em CSS global,
keyframes ficam no bloco do componente ou na seção `MOTION`.

## Literais conscientes

Use tokens por padrão. Literais abaixo são aceitos porque representam ajuste
ótico, runtime ou API que ainda não tem token próprio. Se repetir um literal novo,
pare e crie token ou catalogue aqui.

| Literal | Local | Espelho / intenção |
|---|---|---|
| `#14100b` | `apps/web/app/globals.css:420`, `1253`, `1940` | texto escuro sobre `--ac`; espelha substrato quente |
| `#d9d2c4` | `apps/web/app/globals.css:831`, `1652` | prosa quente; próximo de `--ink`, mais suave |
| `#080705` | `apps/web/app/globals.css:854`, `900` | fundo de código/pre; mais profundo que `--bg` |
| `#e3dccd` | `apps/web/app/globals.css:859` | texto de código; próximo de `--ink` |
| `rgba(255,255,255,0.025)` / `0.07` | `apps/web/app/globals.css:954`, `991` | chrome sutil de tabela/código |
| `rgba(5,4,3,0.72)` | `apps/web/app/globals.css:1478` | scrim da paleta |
| `rgba(0,0,0,0.65)` | `apps/web/app/globals.css:1491` | sombra de overlay |
| `#070605` | `apps/web/app/globals.css:1587` | fundo fullscreen do player |
| `oklch(0.7 0.2 25)` | `apps/web/app/globals.css:1184`, `1236`, `1932` | erro/destrutivo; candidato a `--danger` se repetir |
| `#fff` / `rgba(255,255,255,0.55)` | `apps/web/app/_components/primitives.tsx:210`, `217` | stroke interno do `BrandMark` SVG |
| Gradientes por hue | `apps/web/app/_components/primitives.tsx:240`, `279` | avatar e source cover gerados por texto |

## Convenção de extensão

- Primeiro procure token existente.
- Se um novo valor tiver papel semântico recorrente, crie token no `:root` e
  documente a camada.
- Se for valor isolado por renderização, catalogue como literal consciente.
- Estados novos precisam de foco visível, hover, disabled quando aplicável e
  reduced-motion se houver animação.
