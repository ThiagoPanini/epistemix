"""Engagement boundary — comment use cases (E4)."""

import uuid
from datetime import UTC, datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ethitorial.db import SessionLocal  # noqa: F401 — re-exported for endpoint mocking
from ethitorial.engagement.models import ArtifactComment
from ethitorial.identity.models import AuthUser

RATE_LIMIT_PER_HOUR = 10
MAX_BODY_LENGTH = 2000


async def list_comments(db: AsyncSession, artifact_id: str) -> list[dict]:
    """Returns all non-moderated comments for artifact_id, ordered by created_at asc."""
    stmt = (
        select(
            ArtifactComment.id.label("comment_id"),
            ArtifactComment.artifact_id,
            ArtifactComment.body,
            ArtifactComment.created_at,
            ArtifactComment.moderated_at,
            ArtifactComment.user_id,
            AuthUser.name.label("user_name"),
            AuthUser.username,
            AuthUser.role,
            AuthUser.image,
        )
        .join(AuthUser, ArtifactComment.user_id == AuthUser.id)
        .where(
            ArtifactComment.artifact_id == artifact_id,
            ArtifactComment.moderated_at.is_(None),
        )
        .order_by(ArtifactComment.created_at)
    )
    rows = (await db.execute(stmt)).all()
    return [_row_to_dict(row) for row in rows]


async def create_comment(
    db: AsyncSession,
    artifact_id: str,
    user_id: str,
    username: str,
    body: str,
) -> dict:
    """Creates a comment. Raises 422 if body too long, 429 if rate limited."""
    body = body.strip()
    if len(body) > MAX_BODY_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Comment body exceeds {MAX_BODY_LENGTH} characters.",
        )
    if not body:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Comment body cannot be empty.",
        )

    hour_ago = datetime.now(tz=UTC) - timedelta(hours=1)
    count_result = await db.execute(
        select(func.count())
        .select_from(ArtifactComment)
        .where(
            ArtifactComment.user_id == user_id,
            ArtifactComment.created_at >= hour_ago,
        )
    )
    if count_result.scalar_one() >= RATE_LIMIT_PER_HOUR:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many comments — please wait before commenting again.",
        )

    now = datetime.now(tz=UTC)
    comment = ArtifactComment(
        id=uuid.uuid4(),
        artifact_id=artifact_id,
        user_id=user_id,
        body=body,
        created_at=now,
    )
    db.add(comment)
    await db.commit()

    return {
        "id": str(comment.id),
        "artifact_id": artifact_id,
        "body": body,
        "created_at": now.isoformat(),
        "username": username,
        "is_author": False,
    }


async def delete_comment(
    db: AsyncSession,
    comment_id: str,
    requesting_user_id: str,
    is_admin: bool,
) -> None:
    """Removes a comment. Admins can remove any; users can only remove their own."""
    try:
        comment_uuid = uuid.UUID(comment_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found."
        ) from None
    result = await db.execute(select(ArtifactComment).where(ArtifactComment.id == comment_uuid))
    comment = result.scalar_one_or_none()
    if comment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found.")
    if not is_admin and comment.user_id != requesting_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot delete another user's comment.",
        )
    await db.delete(comment)
    await db.commit()


def _row_to_dict(row) -> dict:
    return {
        "id": str(row.comment_id),
        "artifact_id": row.artifact_id,
        "body": row.body,
        "created_at": row.created_at.isoformat(),
        "user_id": row.user_id,
        "user_name": row.user_name,
        "username": row.username,
        "image": row.image,
        "is_author": row.role == "admin",
    }
