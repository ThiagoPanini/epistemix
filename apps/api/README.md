# apps/api — ethitorial API (FastAPI)

Serve o estado dinâmico do hub: o boundary **engagement** (views, votos, comentários) e o boundary **identity** (modelo de usuário/sessão). O catálogo (Section/Source/Artifact) é MDX-native no `apps/web` e não passa pela API ([ADR-0001](../../docs/adr/0001-monorepo-and-boundaries.md)). SQLAlchemy 2.0 async + migrations Alembic; estilo interno em [ADR-0004](../../docs/adr/0004-hexagonal-pragmatica.md).

```bash
uv sync                                        # cria .venv (Python 3.13 gerenciado pelo uv)
uv run uvicorn ethitorial.main:app --reload    # http://localhost:8000  (GET /health)
uv run pytest                                  # testes
```
