# ADR 0004 — Arquitetura hexagonal pragmática no backend

- **Status:** Accepted
- **Data:** 2026-05-23
- **Decisores:** Thiago Panini (solo)
- **Relacionado:** [ADR-0001](0001-monorepo-and-boundaries.md), [ADR-0002](0002-stack-fastapi-nextjs-postgres.md)

## Contexto

O ADR-0001 estabelece monorepo com boundaries de domínio (`catalog`, `identity`, `engagement`, `narration`, `shared`, `platform`), mas não define o **estilo arquitetural interno** de cada boundary. O decisor está confortável com Clean Architecture / Hexagonal (ports & adapters), use cases e separação domain/application/infrastructure/presentation, e quer aplicá-los **conscientemente, sem cerimonia desnecessária**.

A armadilha clássica é replicar 4 camadas + 3 mappings para CRUD trivial. Resultado: 6 arquivos para listar tags. Precisamos de uma regra explícita para evitar isso sem desistir da clareza estrutural.

## Decisão

**Adotar layout hexagonal (ports & adapters) dentro de cada boundary**, com **granularidade proporcional à complexidade do boundary**.

### Layout completo (boundary "rico", caso `catalog`)

```
apps/api/src/talkingpres/catalog/
├── domain/                      # núcleo puro, ZERO dependências de framework
│   ├── entities.py              # Presentation, Slide, Tag
│   ├── value_objects.py         # Slug, SlideOrder
│   ├── events.py                # PresentationPublished, SlideReordered
│   └── exceptions.py            # PresentationNotFound, DuplicateSlug
├── application/                 # orquestração, sem framework
│   ├── ports/                   # interfaces como typing.Protocol
│   │   ├── presentation_repository.py
│   │   ├── storage_gateway.py
│   │   └── clock.py
│   ├── use_cases/               # 1 arquivo por use case
│   │   ├── publish_presentation.py
│   │   ├── list_presentations.py
│   │   ├── search_presentations.py
│   │   └── get_presentation_by_slug.py
│   └── dtos.py
├── infrastructure/              # adapters
│   ├── persistence/
│   │   ├── orm.py               # SQLAlchemy/SQLModel models
│   │   └── sqlalchemy_presentation_repository.py
│   ├── storage/
│   │   └── r2_storage_gateway.py
│   └── clock.py                 # SystemClock
└── presentation/                # entrada HTTP
    ├── api/
    │   ├── router.py
    │   ├── schemas.py           # Pydantic request/response
    │   └── dependencies.py      # FastAPI Depends wiring port → adapter
    └── events/                  # subscribers (V2+)
```

### Granularidade por boundary

| Boundary | Camadas | Justificativa |
|---|---|---|
| `catalog` | Completa (domain + application + infrastructure + presentation) | Núcleo do produto, regras vão crescer |
| `narration` *(V2)* | Completa | Voice cloning, RAG, Q&A vão complicar; isolar agora paga depois |
| `engagement` | Reduzida (domain + application leve + infrastructure + presentation) | Regras simples; ports só onde houver alternativa real |
| `identity` | Mínima (presentation + adapters fininhos) | Auth delegado a provedor externo; expor `CurrentUser` para outros boundaries |
| `shared` | sem subdivisão | Value objects, erros base, tipos |
| `platform` | só adapters + composition root | DB sessions, observability, AI clients, event dispatcher |

### Regras anti-overengineering

1. **Domain puro.** Importa só stdlib + (no máximo) Pydantic. Sem FastAPI, sem SQLAlchemy. Testes desse pacote rodam em milissegundos sem fixtures pesadas.
2. **Use case = uma classe ou função.** Recebe ports no construtor, retorna DTO. Sem decorator mágico.
3. **Ports são `typing.Protocol`**, não `ABC`. Mais leve, duck-typing-friendly, sem boilerplate de herança.
4. **Adapter por adapter**, nomeado pela tecnologia (`SqlAlchemyPresentationRepository`, não `PresentationRepositoryImpl`).
5. **Mapping explícito** em fronteiras: `orm.PresentationModel` ⇄ `domain.Presentation` ⇄ `api.PresentationResponse`. Custo aceito **só onde a tradução é real**. Para `Tag` (3 campos triviais), uma classe pode atravessar; essa decisão é documentada como nota no módulo.
6. **Boundaries não importam diretamente uns dos outros.** Quando `engagement` precisa saber se uma `Presentation` existe, chama um port (`CatalogQueryPort`) cuja implementação importa o use case. Permite migrar para event-driven futuramente sem reescrever callers.
7. **Eventos como `dataclass` simples + dispatcher em `platform`.** Sem event bus distribuído na V1; in-memory basta.

### Injeção de dependência

**FastAPI `Depends` puro.** Sem container externo no início.

- Composition root: `apps/api/src/talkingpres/main.py` (ou `bootstrap.py`) instancia adapters concretos e provê via `Depends`.
- Migrar para `dependency-injector` ou `punq` **apenas se** a composition root passar de ~200 linhas ou se a duplicação de Depends entre routers começar a doer.

### Composition root (esboço)

```python
# apps/api/src/talkingpres/main.py
from fastapi import FastAPI, Depends
from .platform.db import get_session, AsyncSession
from .catalog.infrastructure.persistence.sqlalchemy_presentation_repository import (
    SqlAlchemyPresentationRepository,
)
from .catalog.application.use_cases.list_presentations import ListPresentations

def get_presentation_repo(session: AsyncSession = Depends(get_session)):
    return SqlAlchemyPresentationRepository(session)

def get_list_presentations(repo = Depends(get_presentation_repo)):
    return ListPresentations(repo)

app = FastAPI()
# routers registrados aqui
```

## Consequências

### Positivas
- Domain testável sem DB, sem rede, sem framework — testes rápidos e estáveis
- Trocar persistência, storage ou AI provider = trocar adapter, não reescrever use case
- Migração futura de boundary para serviço separado tem custo baixo (boundaries já desacoplados)
- Linguagem comum com Clean/Hex que o decisor já domina

### Negativas
- Mais arquivos por feature comparado a "FastAPI clássico"
- Mapping explícito custa boilerplate em CRUD simples (mitigado por granularidade variável)
- Disciplina exigida para não acoplar boundaries via imports cruzados (mitigada por lint custom + revisão por agent)

## Corolário — Server Actions e a fronteira web↔API (Next 15)

Toda mutation que toca estado de domínio (`catalog`, `identity`, `engagement`, `narration`) vai para a FastAPI; as Server Actions do Next ficam restritas a concerns do próprio Next: `revalidatePath`/`revalidateTag`, cookies funcionais e redirects. O caminho de menor resistência do "Next 15 way" — Server Action com SQL direto ou route handler como BFF de domínio — é rejeitado deliberadamente, para não vazar domínio para `apps/web` e colapsar o domínio puro que vive na API. Proxies finos de transporte em route handlers do Next (sem regra de domínio) são tolerados na prática para resolver o hop de rede web→api.

## Opções rejeitadas

- **MVC clássico (`models/`, `services/`, `controllers/` na raiz do `apps/api`):** legível no início, mata o desacoplamento por domínio, dificulta extração de serviços.
- **"Service layer" simples sem ports:** mistura adapter e regra de negócio, dificulta teste, perde a abstração que justificaria hex no futuro.
- **Hexagonal completo em todos os boundaries indistintamente:** cerimônia inútil em `identity` (delegado) e `engagement` (CRUD com regras simples).
- **`dependency-injector` desde o início:** adiciona conceito sem ROI claro com 0 use cases. Reabrir se composition root crescer.
- **Ports como `abc.ABC`:** mais verboso, sem ganho prático sobre `Protocol`; pior para mocking.

## Referências

- [Cosmic Python — Architecture Patterns with Python](https://www.cosmicpython.com/) — Bob Gregory e Harry Percival. Gratuito. Referência viva de hex em Python moderno.
- Repositório `cosmicpython/code` — código de exemplo do livro.
- Brandur Leach — posts pragmáticos sobre estilo em backends.
