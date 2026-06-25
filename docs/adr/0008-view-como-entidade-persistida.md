# ADR 0008 — `View` como entidade persistida, com gatilho relaxado e filtro de bots

- **Status:** Accepted
- **Data:** 2026-05-23
- **Decisores:** Thiago Panini (solo)
- **Relacionado:** [docs/CONTEXT.md](../CONTEXT.md), [ADR-0006](0006-cloudflare-na-frente-da-vps.md)

## Contexto

`View` aparece no domínio com duplo propósito:

1. **Sinal público de popularidade** exibido ao usuário ("apresentações mais vistas", "trending this week").
2. **Base analítica** para o mantenedor entender de onde vem o tráfego e qual conteúdo ressoa.

Esses dois usos puxam o desenho em direções diferentes do que uma métrica interna de engajamento. Especificamente:

- O critério "view honesta" (só conta se houve interação real com o player) protege a métrica de inflação, mas omite cliques que carregam sinal de interesse — e a intuição do produto é que **o clique já é o engajamento mínimo relevante**.
- Métrica pública precisa resistir a ruído de indexação. Crawlers, link previews (Slack/Discord/Twitter unfurl) e uptime monitors facilmente inflacionam contadores em catálogos pequenos. Sem mitigação, "5 apresentações reais" da V1 com um link compartilhado vira contagem fictícia.
- Persistência analítica exige entidade, não apenas contador. Backfill de dimensões (origem do tráfego, país) é inviável depois — precisa ser capturado no momento do registro.

Opções consideradas:

1. **Contador denormalizado** em `Presentation.view_count`, sem entidade. Schema mínimo, sem queries históricas.
2. **PostHog como fonte da verdade**, espelhado via job. Zero schema custom; reaproveita o analytics já no stack.
3. **Entidade `View` com gatilho rigoroso** (engajamento real, ex.: primeiro avanço de slide).
4. **Entidade `View` com gatilho relaxado** (carregamento da página), com filtro de bots no servidor.

## Decisão

**Adotar opção 4.** Especificamente:

### Gatilho

Carregamento da página da `Presentation` dispara um POST client-side para o endpoint de view. Não é SSR. Razões:

- Crawlers headless raramente executam `fetch` no `useEffect` — filtragem natural sem precisar manter lista.
- Server-side reforça com check de User-Agent contra lista conhecida de bots (pacote `isbot` ou equivalente). Cinto + suspensórios.
- Custo: visitante com JS desligado não conta. Aceitável (cohort marginal; "view" é métrica de popularidade, não auditoria fiscal).

### Persistência

Entidade `View` no boundary `engagement`:

```
View {
  id: uuid
  presentation_id: PresentationId   # FK lógica para catalog
  session_id: str                   # hash do cookie funcional anônimo
  user_id: UserId | None            # preenchido quando autenticado
  viewed_at: datetime               # UTC
  referrer_kind: enum               # direct | social | search | other
  country_code: str | None          # via header cf-ipcountry da Cloudflare
}
```

### Dedup

Uma view por `(presentation_id, session_id, day_bucket_UTC)`. Mesmo usuário recarregando a página no mesmo dia não infla contagem. F5 spam é nulo.

`session_id` é cookie funcional anônimo, definido no primeiro request. Sob GDPR cai em "operação do serviço" — banner mínimo na V1 é suficiente.

### Contador denormalizado

**Não** na V1. Postgres digere `SELECT COUNT(*) FROM views WHERE presentation_id = ?` sem suar até a casa dos milhões. Adicionar `Presentation.view_count` denormalizado (ou view materializada) quando query time doer e métrica passar a ser lida em hot paths.

## Justificativa

- **Entidade > contador (rejeita opção 1):** análise futura ("views por dia", "ranking semanal", "audiência por tag") fica gratuita. Sem isso, decisões de produto são cegas. Sair de contador para entidade depois exige redesenho.
- **Postgres > PostHog como fonte (rejeita opção 2):** PostHog é cliente-side, sujeito a bloqueio de tracking (uBlock, Brave) que distorce números. Sync event→DB introduz latência e janela de inconsistência. Métrica pública precisa ser auditável e versionada — `View` é fato de domínio, não evento analítico. PostHog permanece para funis de UX (cliques de filtro, profundidade de scroll), que é uso natural dele.
- **Gatilho relaxado > engajamento real (rejeita opção 3):** a intuição do produto é que o clique já carrega interesse. Métrica de "view honesta" engajada é mais útil em produtos de longa-cauda (Netflix, YouTube) — não num catálogo onde a fricção entre clique e leitura é baixa e a popularidade é o sinal exposto.
- **Filtro de bots não-negociável:** sem ele, popularidade vira ruído. Foi a contrapartida explícita aceita ao relaxar o gatilho.
- **Schema enriquecido desde o dia 1:** `referrer_kind` e `country_code` são gratuitos no momento do write (Cloudflare header já entrega o país; `Referer` já chega na request). Backfill é impossível. Capturar agora é "free option" pra análise futura.

## Consequências

### Positivas

- Métrica pública resistente a inflação de crawler.
- Análise rica disponível desde o primeiro mês de produção sem migração de schema.
- Sem dependência de SaaS externo para o sinal de popularidade do catálogo.
- PostHog mantido para o que ele faz melhor (analytics de UX em camadas), sem conflito.

### Negativas

- Manutenção ocasional da lista de User-Agents de bot (atualizar `isbot` ou equivalente em ciclo de updates trimestrais).
- Visitantes com JS desligado não contam — perda marginal, aceita.
- Cookie funcional exige menção em política de privacidade desde o lançamento.
- Volume futuro pode exigir partitioning de `views` (mensal, por exemplo). Decisão deferida — só faz sentido com milhões de linhas, distante do horizonte V1.

## Opções rejeitadas

- **Opção 1 (contador denormalizado puro):** otimiza para "schema simples", custa a capacidade analítica.
- **Opção 2 (PostHog como fonte):** acopla decisão de domínio a SaaS de analytics; sujeito a perda por bloqueio cliente-side; menos auditável.
- **Opção 3 (gatilho por engajamento real):** subestima o valor do clique como sinal de interesse para o domínio do catálogo.
