# Layout

## Estrutura de página

O app é envolvido por `AppShell` (`apps/web/app/_components/app-shell.tsx` `AppShell`): topbar, rubricas sticky, conteúdo `.view`, footer e paleta de comandos. O wrapper raiz mantém `data-motion="on"` (atributo no `<div>` raiz de `AppShell`) para permitir motion global sem ignorar `prefers-reduced-motion`.

Container padrão: `.wrap`, max-width `1180px`, centralizado, padding lateral `36px`, reduzido para `20px` em `@media (max-width: 720px)` (`apps/web/app/globals.css` regra `.wrap`).

## Grid e ritmo

Seletores em `apps/web/app/globals.css`:

- Home lead: `.lead-grid` usa `1.45fr 1fr`, sem gap (colunas encostadas por hairline), e colapsa para uma coluna em `@media (max-width: 860px)`.
- Home seções: `.secs` usa cinco colunas com gap `26px`, depois três em `@media (max-width: 1020px)` e duas em `@media (max-width: 660px)`.
- Leitura: `.read-grid` usa `minmax(0, 700px) 220px`, gap `64px`; a `.toc` some em `@media (max-width: 1000px)`.
- Rows editoriais (`.art-row`, `.note-row`, `.tl-row`) usam hairlines e `--row-pad` para manter densidade consistente.

Hairlines são estrutura, não decoração. Sombras aparecem só em overlays (`.pal`, `.player`) e não em cards/listagens.

## Breakpoints oficiais

| Breakpoint | Efeito |
|---|---|
| `1020px` | grid de seções 5 -> 3 colunas |
| `1000px` | TOC de leitura oculto |
| `860px` | now-learning, lead e seções colapsam |
| `720px` | container reduz, rows viram uma coluna |
| `660px` | grid de seções vai para duas colunas |
| `640px` | ajustes de seção/source/leitura |
| `560px` | topbar esconde data e GitHub |

Não crie breakpoints novos por preferência estética. Só adicione se um componente novo tiver formato realmente diferente e documente aqui.

## Z-index

Camada e valor por seletor em `apps/web/app/globals.css`:

| Camada | Valor | Seletor |
|---|---:|---|
| Rubricas sticky | `20` | `.rubrics` |
| Menu de conta | `50` | `.acct-menu` |
| Paleta de comandos | `100` | `.scrim` (overlay da paleta) |
| Player fullscreen | `110` | `.player` |

Regra: overlays globais devem ficar acima de navegação; player vence paleta. Não adicione z-index local sem registrar a camada.

## Responsivo

Mobile mantém o mesmo contrato editorial: hairlines, densidade e hierarquia. Não substitua por cards arredondados grandes ou hero marketing. Quando texto não couber, prefira quebra e clamp já existente, não escala por viewport em texto de UI compacto.
