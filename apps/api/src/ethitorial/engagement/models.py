"""Engagement boundary — persistent domain models.

View: one record per (artifact_id, session_id, day_bucket_utc).
Vote: one per (artifact_id, user_id) — toggle semantics enforced at use-case layer.
Comment: flat thread; moderation by admin only (invariant 12).
"""

import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, String, Text, UniqueConstraint, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from ethitorial.db import Base


class ArtifactView(Base):
    __tablename__ = "artifact_view"
    __table_args__ = (
        UniqueConstraint("artifact_id", "session_id", "day_bucket_utc", name="uq_view_dedup"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    artifact_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    session_id: Mapped[str] = mapped_column(String(255), nullable=False)
    day_bucket_utc: Mapped[date] = mapped_column(Date, nullable=False)
    user_id: Mapped[str | None] = mapped_column(Text, nullable=True)
    referrer_kind: Mapped[str | None] = mapped_column(String(64), nullable=True)
    country_code: Mapped[str | None] = mapped_column(String(2), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class ArtifactVote(Base):
    __tablename__ = "artifact_vote"
    __table_args__ = (UniqueConstraint("artifact_id", "user_id", name="uq_vote_per_user"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    artifact_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(Text, nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class ArtifactComment(Base):
    __tablename__ = "artifact_comment"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    artifact_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(Text, nullable=False, index=True)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    moderated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
