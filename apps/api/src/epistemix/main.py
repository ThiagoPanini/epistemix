"""epistemix API — application entrypoint.

Fase 0: skeleton com health check. Os boundaries de domínio (catalog,
identity, engagement, ...) nascem na Fase 1, com granularidade proporcional
à complexidade — ver docs/adr/0004-hexagonal-pragmatica.md.
"""

from fastapi import FastAPI

app = FastAPI(title="epistemix API", version="0.0.0")


@app.get("/health")
async def health() -> dict[str, str]:
    """Liveness probe consumida pelo apps/web e pelo health check de deploy."""
    return {"status": "ok"}
