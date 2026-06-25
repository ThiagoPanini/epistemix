# Procedência e deltas

## Procedência

Origem creditada: bundle congelado gerado pelo Claude Design em `.claude/design/epistemix-redesenho-completo/`. Ele contém duas direções navegáveis; a Direção A "Prensa" foi escolhida como base visual do redesign. O bundle é gitignored e não evolui.

Fonte-da-verdade atual: código as-built em `apps/web/`, principalmente o bloco `:root` de `apps/web/app/globals.css`, componentes em `apps/web/app/_components/` e rotas Next em `apps/web/app/`.

Delta mais visível: o bundle usa o nome antigo `epistemix`; o produto vivo chama `ethitorial`. O rename é evolução deliberada (epistemix → ethitorial); o nome antigo sobrevive só nesta procedência e no git history.

## Mapa de deltas

| Delta | Classificação | Decisão |
|---|---|---|
| Nome antigo no bundle -> `ethitorial` no código | Evolução abençoada | Contrato usa `ethitorial`; nome antigo só em procedência/história |
| Protótipo como "absoluto" nos docs antigos -> código as-built vence | Evolução abençoada de governança | `docs/design/` passa a ser contrato; `docs/DESIGN.md` virou ponte |
| TweaksPanel do bundle (acento/densidade/motion) ausente | Evolução abençoada | Produção tem acento fixo e motion por media query |
| Auth card central do doc antigo -> split editorial as-built | Evolução abençoada | Documentar split como contrato |
| Graph scatter com raio por views -> grafo determinístico tag/artifact, raio fixo | Evolução abençoada / dívida leve | As-built vence; worklist: integrar views quando houver dado confiável |
| Talks/player desenhado no bundle -> player construído, sem conteúdo produtivo | Shell construído, conteúdo pendente | Marcar como `⏳` onde aplicável |
| Books/Certifications visíveis -> sem conteúdo produtivo | Shell/listagem construídos, conteúdo pendente | Manter nav/grid; empty states são parte do contrato |
| `.up-btn.on` no CSS vs `up-btn--active` no React | Digital de descuido | Corrigido na Trilha A; o as-built usa `up-btn--active` no `VoteButton` e em `globals.css` |
| Comentário do CSS e ponteiros vivos apontavam para protótipo absoluto | Digital de descuido pós-cutover | Corrigido na Trilha A |
| `apps/web/app/_components/surfaces.tsx` com copy de fase antiga | Higiene / legado provável | Não removido nesta missão; registrar para cleanup separado |

## Higiene de tokens e literais

Tokens raiz no bloco `:root` de `apps/web/app/globals.css` estão em uso. Não há token raiz órfão. Literais conscientes ficam catalogados em `design-spec.md`; novos literais devem ser raros e justificados.

## Conflitos forma x intenção

- `docs/VISION.md` define sucesso V1 com ao menos uma publicação por seção. O as-built visual já suporta todas as seções, mas conteúdo produtivo ainda não cobre Books, Certifications e Presentations. Isso é conflito de maturidade de produto, não de forma visual.
- A forma visual viva é o contrato as-built em `docs/design/`; o protótipo da Direção A foi a origem, não a fonte-da-verdade. `docs/CONTEXT.md` continua mandando em linguagem de domínio e invariantes.

## Log de execução

- Fase 0: bundle completo lido sem renderizar imagens; código, docs e comandos de verificação inventariados.
- Fase 1: procedência oficializada; deltas classificados.
- Trilha A: ponteiros vivos atualizados para `docs/design/`; estado ativo do voto alinhado ao React.
- Trilha B: contratos agent-first materializados em `docs/design/` e `docs/agents/design.md`.
