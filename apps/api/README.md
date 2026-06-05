# apps/api — epistemix API (FastAPI)

Skeleton da Fase 0. Expõe `GET /health`. Boundaries de domínio nascem na Fase 1
(ver [ADR-0004](../../docs/adr/0004-hexagonal-pragmatica.md)).

```bash
uv sync                                   # cria .venv (Python 3.13 gerenciado pelo uv)
uv run uvicorn epistemix.main:app --reload   # http://localhost:8000/health
uv run pytest                             # testes
```
