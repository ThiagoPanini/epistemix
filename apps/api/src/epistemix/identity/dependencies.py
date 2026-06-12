"""FastAPI dependencies for the identity boundary."""

from collections.abc import AsyncGenerator
from datetime import UTC, datetime
from typing import Annotated

from fastapi import Cookie, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from epistemix.db import SessionLocal
from epistemix.identity.models import AuthSession, AuthUser


async def get_db() -> AsyncGenerator[AsyncSession]:
    """Yield an async DB session; raises 503 if no database is configured."""
    if SessionLocal is None:
        raise HTTPException(status_code=503, detail="Database not configured")
    async with SessionLocal() as session:
        yield session


async def get_current_user(
    better_auth_session_token: Annotated[
        str | None, Cookie(alias="better-auth.session_token")
    ] = None,
) -> AuthUser | None:
    """Returns the authenticated user, or None for anonymous requests.

    Self-contained: creates its own DB session. Returns None gracefully when
    there is no cookie, DB is not configured, or the session is expired/invalid.
    """
    if better_auth_session_token is None:
        return None
    if SessionLocal is None:
        return None

    now = datetime.now(tz=UTC)
    async with SessionLocal() as db:
        result = await db.execute(
            select(AuthSession)
            .where(AuthSession.token == better_auth_session_token)
            .where(AuthSession.expires_at > now)
            .options(selectinload(AuthSession.user))
        )
        session = result.scalar_one_or_none()
        if session is None:
            return None
        return session.user


async def require_auth(
    user: Annotated[AuthUser | None, Depends(get_current_user)],
) -> AuthUser:
    """Raises 401 if the request is unauthenticated."""
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )
    return user


async def require_admin(
    user: Annotated[AuthUser, Depends(require_auth)],
) -> AuthUser:
    """Raises 403 if the authenticated user is not an admin."""
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )
    return user
