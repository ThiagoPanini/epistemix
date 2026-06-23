"""Database engine and session factory (async SQLAlchemy)."""

import os

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


def _make_engine():  # type: ignore[return]
    url = os.getenv("DATABASE_URL")
    if url:
        return create_async_engine(url, pool_pre_ping=True)
    return None


_engine = _make_engine()
SessionLocal: async_sessionmaker[AsyncSession] | None = (
    async_sessionmaker(_engine, expire_on_commit=False) if _engine else None
)


async def ping_db() -> str:
    """Return 'ok', 'unconfigured', or 'error' based on DB reachability."""
    if _engine is None:
        return "unconfigured"
    try:
        async with _engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return "ok"
    except Exception:
        return "error"
