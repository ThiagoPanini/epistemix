"""Engagement boundary — view recording use cases."""

from datetime import UTC, date, datetime
from uuid import uuid4

from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from epistemix.db import SessionLocal  # noqa: F401 — re-exported for endpoint mocking
from epistemix.engagement.models import ArtifactView

_BOT_UA_FRAGMENTS = frozenset(
    [
        "bot",
        "crawler",
        "spider",
        "slurp",
        "facebookexternalhit",
        "whatsapp",
        "telegrambot",
        "linkedinbot",
        "twitterbot",
        "semrushbot",
        "ahrefsbot",
        "mj12bot",
        "dotbot",
        "headlesschrome",
        "python-requests",
        "go-http-client",
        "java/",
        "curl/",
    ]
)


def is_bot(user_agent: str | None) -> bool:
    if not user_agent:
        return False
    ua = user_agent.lower()
    return any(frag in ua for frag in _BOT_UA_FRAGMENTS)


async def record_view(
    db: AsyncSession,
    artifact_id: str,
    session_id: str,
    user_agent: str | None = None,
    user_id: str | None = None,
) -> bool:
    """Inserts a view row; dedup via unique constraint.

    SEC-6 (dívida consciente): view count é falsável — epistemix_sid é cookie
    controlável pelo cliente e o filtro de bot é heurístico (UA-based). A contagem
    é métrica de vaidade, não controle de segurança; aceita deliberadamente sem fix.

    Returns True if a new row was inserted, False if deduped or bot-filtered.
    """
    if is_bot(user_agent):
        return False

    stmt = (
        insert(ArtifactView)
        .values(
            id=uuid4(),
            artifact_id=artifact_id,
            session_id=session_id,
            day_bucket_utc=date.today(),
            user_id=user_id or None,
            created_at=datetime.now(tz=UTC),
        )
        .on_conflict_do_nothing(constraint="uq_view_dedup")
    )
    result = await db.execute(stmt)
    await db.commit()
    return result.rowcount == 1  # type: ignore[union-attr]


async def get_view_count(db: AsyncSession, artifact_id: str) -> int:
    result = await db.execute(
        select(func.count())
        .select_from(ArtifactView)
        .where(ArtifactView.artifact_id == artifact_id)
    )
    return result.scalar_one()
