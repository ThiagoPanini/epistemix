"""Engagement boundary — vote toggle use cases."""

from datetime import UTC, datetime
from uuid import uuid4

from sqlalchemy import delete, func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from epistemix.db import SessionLocal  # noqa: F401 — re-exported for endpoint mocking
from epistemix.engagement.models import ArtifactVote


async def toggle_vote(db: AsyncSession, artifact_id: str, user_id: str) -> bool:
    """Toggles a vote for (artifact_id, user_id).

    Returns True if the vote was added, False if it was removed.
    """
    existing = await db.execute(
        select(ArtifactVote).where(
            ArtifactVote.artifact_id == artifact_id,
            ArtifactVote.user_id == user_id,
        )
    )
    vote = existing.scalar_one_or_none()

    if vote is not None:
        await db.execute(
            delete(ArtifactVote).where(
                ArtifactVote.artifact_id == artifact_id,
                ArtifactVote.user_id == user_id,
            )
        )
        await db.commit()
        return False

    await db.execute(
        insert(ArtifactVote).values(
            id=uuid4(),
            artifact_id=artifact_id,
            user_id=user_id,
            created_at=datetime.now(tz=UTC),
        )
    )
    await db.commit()
    return True


async def get_vote_state(
    db: AsyncSession,
    artifact_id: str,
    user_id: str | None = None,
) -> dict:
    """Returns { count: int, voted: bool } for artifact_id.

    `voted` reflects the current user's state; False when user_id is None.
    """
    count_result = await db.execute(
        select(func.count())
        .select_from(ArtifactVote)
        .where(ArtifactVote.artifact_id == artifact_id)
    )
    count = count_result.scalar_one()

    voted = False
    if user_id:
        vote_result = await db.execute(
            select(ArtifactVote).where(
                ArtifactVote.artifact_id == artifact_id,
                ArtifactVote.user_id == user_id,
            )
        )
        voted = vote_result.scalar_one_or_none() is not None

    return {"count": count, "voted": voted}
