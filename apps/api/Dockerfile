# syntax=docker/dockerfile:1

FROM python:3.13-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy

# curl é exigido pelo healthcheck do Coolify (Portão 3) — ele roda o check
# DENTRO do container via curl/wget; a imagem slim não traz nenhum dos dois e
# o container era marcado unhealthy → rollback. Ver runbook 0003.
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

COPY pyproject.toml uv.lock ./
COPY src ./src
RUN uv sync --frozen --no-dev

ENV PATH="/app/.venv/bin:$PATH"

EXPOSE 8000
CMD ["uvicorn", "epistemix.main:app", "--host", "0.0.0.0", "--port", "8000"]
