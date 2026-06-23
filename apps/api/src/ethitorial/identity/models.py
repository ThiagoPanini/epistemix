"""SQLAlchemy models for the identity boundary (maps to better-auth tables)."""

from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ethitorial.db import Base


class AuthUser(Base):
    __tablename__ = "auth_user"
    __table_args__ = (
        UniqueConstraint("email", name="uq_auth_user_email"),
        UniqueConstraint("username", name="uq_auth_user_username"),
        Index("ix_auth_user_email", "email"),
    )

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    email: Mapped[str] = mapped_column(Text, nullable=False)
    email_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    image: Mapped[str | None] = mapped_column(Text, nullable=True)
    username: Mapped[str] = mapped_column(Text, nullable=False)
    role: Mapped[str] = mapped_column(Text, nullable=False, default="user")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    sessions: Mapped[list["AuthSession"]] = relationship(back_populates="user")


class AuthSession(Base):
    __tablename__ = "auth_session"
    __table_args__ = (
        UniqueConstraint("token", name="uq_auth_session_token"),
        Index("ix_auth_session_token", "token"),
        Index("ix_auth_session_user_id", "user_id"),
    )

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    token: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    ip_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    user_agent: Mapped[str | None] = mapped_column(Text, nullable=True)
    user_id: Mapped[str] = mapped_column(
        Text, ForeignKey("auth_user.id", ondelete="CASCADE"), nullable=False
    )

    user: Mapped["AuthUser"] = relationship(back_populates="sessions")
