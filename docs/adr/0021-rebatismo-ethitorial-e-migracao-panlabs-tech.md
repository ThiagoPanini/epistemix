# ADR 0021 — Rebatismo epistemix → ethitorial e migração para ethitorial.panlabs.tech

- **Status:** Accepted
- **Data:** 2026-06-22
- **Decisores:** Thiago Panini (solo)
- **Relacionado:** consome a autonomia AFK do [ADR-0017](0017-desenvolvimento-autonomo-afk.md) e **abre uma exceção pontual** de DNS aditivo (ver lá a *Emenda 2026-06-22* e §"Emenda ao ADR-0017" abaixo); muda o domínio publicado nos guides [0003](../guides/0003-publicar-epistemix-dev-em-producao.md)/ai-ops [0004](../ai-ops/0004-publicar-epistemix-dev.md)/[0005](../ai-ops/0005-deploy-cutover-coolify-e-api-publica.md) (preservados como história); **preserva** o modelo de domínio [ADR-0015](0015-epistemix-domain-model.md) (só renomeia, não reescreve), o catálogo MDX-native [ADR-0018](0018-catalogo-mdx-native-na-fase-1.md), a hexagonal [ADR-0004](0004-hexagonal-pragmatica.md), a stack/infra (0002/0003/0006/0016) e os portões de deploy [ADR-0005](0005-deploy-checks-em-tres-portoes.md); coordena com o **repo panlabs**, cujo [ADR-0002 (topologia de domínio)](../../) **antecipa e delega** esta migração — não a contradiz.

## Contexto

O autor criou `panlabs.tech` como vitrine das suas soluções SaaS e quer **padronizar as URLs como subdomínios de `panlabs.tech`**. O epistemix é a primeira a migrar.

Dois fatos enquadram a decisão:

1. **O panlabs já previu isto.** O ADR-0002 do repo panlabs decidiu que a vitrine **não** gerencia a migração das Soluções — cada uma cuida de si "em momento oportuno", e do lado do panlabs "trocar de domínio = trocar um campo (`targetUrl`)". Apps podem nascer/migrar para `*.panlabs.tech`, decidido **no repo da app**. Este ADR é exatamente esse "momento oportuno", dirigido pelo repo da Solução. Não há reversão de decisão; há realização de uma visão que o panlabs adiou (cookie `.panlabs.tech`/SSO cross-app só faz sentido quando as Soluções migram para subdomínios).

2. **O nome `epistemix` desalinhou da identidade.** `episteme + mix` aponta para epistemologia; o redesenho (Direção A "Prensa", [ADR-0019](0019-redesenho-prototipo-absoluto-push-feature-completo.md)) tornou o produto **editorial** — masthead de jornal, serif, acento laranja. `ethitorial` (e-**thi**-torial) embute "Thi" (Thiago) em "editorial" e casa com o que o produto virou.

**Habilitador-chave: não há usuários ativos hoje.** Isso torna esta a janela mais barata para um rebatismo profundo — incluindo estado persistente (banco) e cutover com downtime — sem dívida de continuidade.

O autor configurou os MCPs de Cloudflare, Coolify e Hostinger para que a execução rode **AFK**.

## Decisão

1. **Rebatismo total `epistemix` → `ethitorial`** — marca **e** identificador técnico. Inclui: pacote Python `src/epistemix/` → `src/ethitorial/` e todos os imports; `pyproject` (`ethitorial-api`) e entrypoint `ethitorial.main:app`; envs `EPISTEMIX_*` → `ETHITORIAL_*`; cookie de view `epistemix_sid` → `ethitorial_sid`; nomes no Coolify (projeto + apps); imagens GHCR `ghcr.io/thiagopanini/epistemix-{web,api}` → `ethitorial-{web,api}`; repo GitHub `ThiagoPanini/epistemix` → `ThiagoPanini/ethitorial`. **Nenhuma cicatriz** de nome antigo no estado final — viável porque não há usuários.

2. **Domínio: `ethitorial.panlabs.tech`** (sem `www` — subdomínio não leva www). Não há zona nova: é um **registro DNS aditivo** dentro da zona `panlabs.tech` já existente.

3. **API internalizada.** O browser nunca toca a API direto (não há `NEXT_PUBLIC_*` apontando pra ela; os client components batem em rotas relativas do próprio Next, que chamam a API server-side). Logo, **dispensa-se o domínio público `api.epistemix.dev`**: a web passa a alcançar a API pela **rede interna do Coolify**. Corrige o smell atual (`EPISTEMIX_API_URL = https://api.epistemix.dev`, um round-trip público pela Cloudflare) e dissolve a armadilha de TLS de subdomínio de 2º nível na Cloudflare Free.

4. **Corte seco do `epistemix.dev`.** Sem 301, sem redirects de cortesia (`editorial.*`, `epistemix.panlabs.tech`). Aceita-se conscientemente que o nome falado "ethitorial" colapsa para "editorial" **sem rede de segurança**. Justificável por não haver usuários nem links de entrada conhecidos.

5. **Banco recriado, não renomeado.** O Postgres atual (`DATABASE_URL` → db `epistemix`, user `epistemix`) é **recriado** como `ethitorial`/`ethitorial` e populado via `alembic upgrade head` — não `ALTER DATABASE`. Snapshot/backup **antes** (🟡, reversível) como rede, embora o dado seja descartável.

6. **Política de documentação — Vivo reescreve, História preserva.** Reescrever para `ethitorial` só os docs **Vivos** (CONTEXT, DESIGN, ARCHITECTURE, VISION, PRODUCT, README, AGENTS, copilot-instructions, READMEs de app). **Preservar** ADRs e guides (registros datados): no máximo uma **nota-ponte** de uma linha no topo dos mais relevantes; **filenames de ADR não mudam** (`0015-epistemix-domain-model.md` é um ID histórico; renomear quebraria links `ver ADR-0015`). História é append-only: o rebatismo é decisão nova (este ADR), não retroescrita. O mesmo princípio vale para os docs do panlabs.

7. **Sequência de execução.** (a) **Aterrissar as 3 branches de segurança** em worktrees (`fix/identity-role-server-controlled`, `feat/platform-security-headers-csp-svg-sandbox`, `fix/engagement-platform-sec4-sec5-sec6`) **antes** do rename — o rename de pacote toca os mesmos arquivos e as colidiria. (b) Rename **big-bang num único PR** (faseá-lo deixaria um estado intermediário com imports quebrados). (c) Cutover de infra coordenado via MCP. **Downtime é aceitável** (sem usuários).

8. **Repo GitHub + imagens GHCR renomeados; diretório local por último/manual.** O GitHub redireciona URLs e `git remote` antigos (baixo risco). O **diretório local** `/workspaces/epistemix` fica por último e **manual** (renomear no meio quebra o cwd e órfãoza o path de memória do Claude `-home-paninit-workspaces-epistemix`); pode até nem ser renomeado — é cosmético local.

9. **panlabs muda em sessão separada, no repo dele.** Única amarra a alterar: `src/data/solutions.ts` (slug/name/url/repo/shot), `src/styles/theme.css` (var de cor), renomear o asset `shot-*.png` (o autor **re-captura a imagem manualmente** ao final), `UPDATE click_event SET slug='ethitorial' WHERE slug='epistemix'`, e docs Vivos + nota-ponte no ADR-0002 do panlabs. Não acopla ao epistemix além do `targetUrl`.

10. **Fronteira AFK ↔ HITL.** O agente vai **até "novo no ar + verificado"** (portões abaixo) e **para**. O operador faz: teardown da zona/registros `epistemix.dev` (🔴), rename do diretório local, e dispara a sessão do panlabs.

### Portões de verificação (o agente declara "verde" sozinho ao passar todos)

1. CI verde no PR do rename (lint + typecheck + tests, web e api).
2. `GET https://ethitorial.panlabs.tech` → 200 e HTML contém "ethitorial" (novo smoke test, substitui o de `epistemix.dev` no `deploy.yml`).
3. `/health` da API saudável + um round-trip web→API interno (ex.: POST de view responde ok).
4. Banco recriado, `alembic upgrade head` aplicado, um caminho de query real funciona.
5. Página de login (better-auth) carrega no domínio novo com `cookie-domain` correto.

## Emenda ao ADR-0017 (DNS aditivo escopado)

O [ADR-0017](0017-desenvolvimento-autonomo-afk.md) classifica DNS como 🔴 (propõe e para). Esta migração precisa de **um único** DNS: criar `ethitorial.panlabs.tech` (proxied) na zona `panlabs.tech` já possuída — **aditivo e reversível**. Fica registrado, escopado a esta migração: **criar/atualizar registro DNS aditivo em zona já-possuída = 🟡** (faz e loga em [ai-ops/](../ai-ops/)). **DNS destrutivo continua 🔴**: remover a zona/registros `epistemix.dev`, trocar nameserver, mexer em firewall.

## Justificativa

- **Agora é o momento mais barato.** Sem usuários, o rename profundo (até o banco) não tem dívida de continuidade; cada semana de adiamento encarece (mais conteúdo indexado, mais hábito de URL de terceiros).
- **Alinhamento de marca.** O produto já é editorial; o nome passa a dizer isso.
- **Correção de arquitetura "de graça".** Internalizar a API tira-a da internet pública e elimina o round-trip pela Cloudflare — a migração é o momento natural pra isso.
- **Coerência com o panlabs.** Realiza a topologia de subdomínios que o panlabs ADR-0002 deixou em aberto para "quando a Solução migrar".

## Consequências

### Positivas
- Estado final **sem cicatriz** de nome antigo (código, infra, banco, domínio).
- API fora da superfície pública; web→API sem sair pra Cloudflare.
- URL padronizada sob `panlabs.tech`, primeiro passo do trilho SSO/analytics cross-app (V2 do panlabs).

### Negativas
- **Perda do brand equity do `epistemix`** (stars, o que o Google indexou dos artigos) — aceita por ser modesto e por não haver usuários.
- **Nome falado sem rede.** "ethitorial" → "editorial" digitado cai no vazio (corte seco, sem redirect).
- **Churn grande de rename** num único PR; mitigado por ser mecânico e test-guarded (import quebra na hora) e por aterrissar as branches de segurança antes.
- **Downtime no cutover** — aceito explicitamente.

### Trip-wires (gatilhos de revisão)
- Se aparecerem usuários/auth reais **antes** da execução, reabrir as decisões 4 (corte seco) e 5 (recriar banco) — passariam a exigir 301 e migração de dados.
- Se a confusão "editorial" gerar acessos perdidos mensuráveis, reconsiderar o redirect de cortesia `editorial.panlabs.tech`.

## O que este ADR NÃO muda

- **Modelo de domínio** ([CONTEXT.md](../CONTEXT.md), [ADR-0015](0015-epistemix-domain-model.md)): apenas **renomeado**, não reescrito.
- **Catálogo MDX-native** ([ADR-0018](0018-catalogo-mdx-native-na-fase-1.md)), **hexagonal** ([ADR-0004](0004-hexagonal-pragmatica.md)), **stack/infra** (0002/0003/0006/0016): intactos.
- **Portões de deploy** ([ADR-0005](0005-deploy-checks-em-tres-portoes.md)) e o **fluxo AFK** ([ADR-0017](0017-desenvolvimento-autonomo-afk.md)): mantidos; este ADR só escopa a exceção pontual de DNS aditivo acima.
- **Independência do panlabs** (ADR-0010 daquele repo): preservada — a única amarra continua sendo o `targetUrl`/entrada curada do card.
