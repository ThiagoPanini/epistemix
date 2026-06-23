# Layout

## Estrutura de página

O app é envolvido por `AppShell` (`apps/web/app/_components/app-shell.tsx:23`):
topbar, rubricas sticky, conteúdo `.view`, footer e paleta de comandos. O wrapper
raiz mantém `data-motion="on"` (`app-shell.tsx:53`) para permitir motion global
sem ignorar `prefers-reduced-motion`.

Container padrão: `.wrap`, max-width `1180px`, centralizado, padding lateral
`36px`, reduzido para `20px` em `max-width: 720px`
(`apps/web/app/globals.css:86`).

## Grid e ritmo

- Home lead: `.lead-grid` usa `1.25fr .75fr`, gap `38px`, colapsa em `860px`
  (`apps/web/app/globals.css:358`, `493`).
- Home seções: `.sections` usa cinco colunas, depois três em `1020px` e duas em
  `660px` (`apps/web/app/globals.css:512`, `519`, `525`).
- Leitura: `.read-grid` usa `minmax(0, 700px) 220px`, gap `64px`; TOC some em
  `1000px` (`apps/web/app/globals.css:752`, `760`).
- Rows editoriais (`.art-row`, `.note-row`, `.tl-row`) usam hairlines e
  `--row-pad` para manter densidade consistente.

Hairlines são estrutura, não decoração. Sombras aparecem só em overlays
(`.pal`, `.player`) e não em cards/listagens.

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

Não crie breakpoints novos por preferência estética. Só adicione se um componente
novo tiver formato realmente diferente e documente aqui.

## Z-index

| Camada | Valor | Código |
|---|---:|---|
| Rubricas sticky | `20` | `apps/web/app/globals.css:184` |
| Menu de conta | `50` | `apps/web/app/globals.css:1790` |
| Paleta de comandos | `100` | `apps/web/app/globals.css:1484` |
| Player fullscreen | `110` | `apps/web/app/globals.css:1593` |

Regra: overlays globais devem ficar acima de navegação; player vence paleta. Não
adicione z-index local sem registrar a camada.

## Responsivo

Mobile mantém o mesmo contrato editorial: hairlines, densidade e hierarquia. Não
substitua por cards arredondados grandes ou hero marketing. Quando texto não
couber, prefira quebra e clamp já existente, não escala por viewport em texto de
UI compacto.
