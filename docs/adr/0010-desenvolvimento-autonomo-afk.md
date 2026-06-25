# ADR 0010 — Autonomia total dos agentes em portfólio experimental

- **Status:** Accepted
- **Data:** 2026-06-24
- **Decisores:** Thiago Panini (solo)
- **Relacionado:** premissa de substrato em [ADR-0003](0003-infra-hostinger-vps-coolify.md); portões de deploy e merge autônomo em [ADR-0005](0005-deploy-checks-em-tres-portoes.md); fluxo operacional vivo em [docs/agents/workflow.md](../agents/workflow.md)

## Contexto

Os MCP servers de Hostinger, Coolify e Cloudflare dão aos agentes capacidade de tocar produção e infra (setup em [docs/agents/mcps.md](../agents/mcps.md)). A infra está madura e no ar, e o portfólio é **experimental, solo e de baixo risco**: sem usuários ativos relevantes, dados reproduzíveis (catálogo é MDX no repo, engajamento é de baixo valor), downtime quase irrelevante — premissa registrada no [ADR-0003](0003-infra-hostinger-vps-coolify.md). Nesse regime, o gargalo do desenvolvimento é o **humano no meio do loop**, não o risco de um deploy ruim que se reverte sozinho.

Uma versão anterior deste ADR governava a autonomia por um semáforo 🟢🟡🔴 ancorado em *reversibilidade × blast radius* — "humano gated no irreversível". Com a infra madura e o portfólio declarado experimental, esse eixo ficou conservador demais: trata como perigoso o que é só barulho, e cobra uma pergunta a cada operação reversível. Este ADR recalibra o eixo.

## Decisão

**O agente opera com autonomia total sobre tudo que é escopo do projeto.** Implementar, fatiar em issues, criar/dropar o próprio DB/app/recurso no Coolify, deploy, redeploy, restart, env vars, segredo gerável por máquina (gera e seta via MCP, nunca commita), migration up e down, registro DNS na zona própria, e **merge de PR verde** (autoridade já no [ADR-0005](0005-deploy-checks-em-tres-portoes.md)) — tudo é a **norma**: faz sozinho, calado, sem anunciar.

**Reversibilidade deixa de ser o eixo.** O agente para e chama o operador em **exatamente quatro casos** — nenhum por algo ser "arriscado" ou "irreversível":

1. **Trancaria o operador pra fora.** Trocar senha root/painel, credencial de acesso do operador, qualquer regra de firewall, ou rotacionar o token de infra que o próprio MCP usa para autenticar. O agente serraria o galho onde se senta.
2. **Recriaria o substrato.** Destruir ou recriar a VM. O agente opera *em cima* da VPS; recriá-la é mexer na camada de baixo dele.
3. **Exige um terceiro que o agente não pode ser.** `client_secret` de OAuth, API key paga emitida num console. Não é farol de segurança — ele fisicamente não consegue sem o operador. Faz toda a parte sem o segredo, documenta o passo exato, e entrega.
4. **Tocaria outro projeto no Coolify compartilhado.** O painel enxerga os projetos irmãos (ex.: panlabs); um `delete`/`drop` no alvo errado derruba o vizinho. Não é farol, é **mira**: antes de qualquer operação que muta, o agente confirma que o recurso é do projeto corrente. Havendo ambiguidade de escopo, para.

**Na dúvida sobre cair num dos quatro, para.** Fora deles, faz.

### Feature-dev roda no mesmo eixo

A unidade de trabalho autônomo é a **vertical slice** — incremento fino que atravessa schema→API→UI→testes, entregável sozinho — não a feature inteira. O único ponto HITL é a **borda de entrada**: o operador alinha o *quê* (`grill-with-docs`). A partir daí o agente fatia em issues (`to-issues`), implementa cada uma em git worktree com TDD até PR verde, e mergeia no verde, encadeando até as issues acabarem. O detalhe operacional vivo — gatilho, loop, modo de economia de token — está em [docs/agents/workflow.md](../agents/workflow.md).

## Justificativa

- **Autonomia é o produto, não o risco.** Num portfólio experimental sem usuários, o custo de o agente parar para perguntar excede o custo de um deploy ruim que o health-check do Coolify reverte. A fronteira certa não é "o que é irreversível", é **"o que o agente não pode desfazer nem o operador recuperar fácil"**: serrar o próprio acesso, apagar a VM, ou depender de um segredo de terceiro.
- **Classificar pelo efeito, não pela tool.** Os catálogos de MCP mudam; os quatro casos de freio valem para qualquer tool nova sem reescrever este ADR.
- **Trilha auditável de graça.** Toda mudança de estado de infra chega via merge (que dispara deploy) ou via commit de config; uma operação de ops sem commit (ex.: `redeploy` de recuperação) é relatada no PR/issue corrente. O `git log` é a trilha — sem cerimônia nova.

## Consequências

- Um agente novo lê o [AGENTS.md](../../AGENTS.md) + este ADR e sabe, sem perguntar, que pode tocar quase tudo sozinho — e os quatro pontos exatos onde para.
- Blast radius continua compartilhado na VPS ([ADR-0003](0003-infra-hostinger-vps-coolify.md)); o caso 4 (mira) é o que impede o acidente cross-project.
- **Assimetria de produção aceita:** um `redeploy`/`migration` autônomo toca o site live e depende do rollback por health-check. Num deploy ruim que passe pelo health-check, o operador descobre depois — aceito no regime experimental.

## Gatilhos de reabertura

Este modelo vale **enquanto a premissa do [ADR-0003](0003-infra-hostinger-vps-coolify.md) valer**. Reabrir quando:

- um projeto ganhar **usuários reais ou SLA** — downtime deixa de ser irrelevante;
- a infra migrar para **multi-tenant ou ambiente/VM dedicado por projeto** — o caso 4 muda de natureza;
- o operador **deixar de ser solo** — autonomia compartilhada muda o cálculo de blast radius e o merge volta a pedir review.

## Opções rejeitadas

- **Manter o semáforo 🟢🟡🔴 por reversibilidade.** Calibrado para um regime de risco que não é o atual; trata barulho como perigo.
- **Autonomia literalmente sem freio.** Um agente que serra o próprio acesso (firewall/senha/token) ou apaga a VM não fica "mais autônomo" — fica desligado. Os quatro casos protegem a própria capacidade de operar.
- **Merge gated por humano.** A autoridade prática é branch protection + CI verde ([ADR-0005](0005-deploy-checks-em-tres-portoes.md)); o clique humano não adiciona segurança real no fluxo solo.
