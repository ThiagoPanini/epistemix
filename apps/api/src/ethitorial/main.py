"""ethitorial API — application entrypoint."""

from typing import Annotated

from fastapi import Cookie, Depends, FastAPI, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy import select

from ethitorial.db import SessionLocal, ping_db
from ethitorial.engagement import comments as comments_module
from ethitorial.engagement import views as views_module
from ethitorial.engagement import votes as votes_module
from ethitorial.identity.dependencies import get_current_user, require_auth
from ethitorial.identity.models import AuthUser

app = FastAPI(title="ethitorial API", version="0.0.0")


@app.get("/health")
async def health() -> dict[str, str]:
    """Liveness + readiness probe. Returns db status alongside service status."""
    db_status = await ping_db()
    return {"status": "ok", "db": db_status}


@app.get("/api/me")
async def me(
    user: Annotated[AuthUser | None, Depends(get_current_user)],
) -> dict:
    """Returns the current authenticated user, or 401 if unauthenticated."""
    if user is None:
        from fastapi import HTTPException, status

        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "username": user.username,
        "role": user.role,
        "image": user.image,
    }


@app.get("/api/me/authenticated")
async def me_authenticated(
    user: Annotated[AuthUser, Depends(require_auth)],
) -> dict[str, str]:
    """Returns minimal user info; 401 if unauthenticated. Useful for auth checks."""
    return {"username": user.username, "role": user.role}


@app.get("/api/authors/{username}")
async def get_author(username: str) -> dict:
    """Returns public profile of a user by username. 404 if not found."""
    if SessionLocal is None:
        raise HTTPException(status_code=503, detail="Database not configured")
    async with SessionLocal() as db:
        result = await db.execute(select(AuthUser).where(AuthUser.username == username))
        user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Author not found")
    return {
        "name": user.name,
        "username": user.username,
        "image": user.image,
    }


@app.get("/api/comments/{artifact_id:path}")
async def get_comments(artifact_id: str) -> list[dict]:
    """Returns flat list of non-moderated comments for an artifact."""
    if comments_module.SessionLocal is None:
        return []
    async with comments_module.SessionLocal() as db:
        return await comments_module.list_comments(db, artifact_id)


class CommentBody(BaseModel):
    body: str


@app.post("/api/comments/{artifact_id:path}", status_code=201)
async def post_comment(
    artifact_id: str,
    payload: CommentBody,
    user: Annotated[AuthUser, Depends(require_auth)],
) -> dict:
    """Creates a comment on an artifact. Auth required."""
    if comments_module.SessionLocal is None:
        raise HTTPException(status_code=503, detail="Database not configured")
    async with comments_module.SessionLocal() as db:
        return await comments_module.create_comment(
            db, artifact_id, user.id, user.username, payload.body
        )


@app.delete("/api/comments/{comment_id}", status_code=204)
async def remove_comment(
    comment_id: str,
    user: Annotated[AuthUser, Depends(require_auth)],
) -> None:
    """Removes a comment. Admins can remove any; users can only remove their own."""
    if comments_module.SessionLocal is None:
        raise HTTPException(status_code=503, detail="Database not configured")
    async with comments_module.SessionLocal() as db:
        await comments_module.delete_comment(
            db, comment_id, requesting_user_id=user.id, is_admin=user.role == "admin"
        )


@app.post("/api/views/{artifact_id:path}", status_code=204)
async def post_view(
    artifact_id: str,
    request: Request,
    ethitorial_sid: Annotated[str | None, Cookie()] = None,
    user: Annotated[AuthUser | None, Depends(get_current_user)] = None,
) -> None:
    """Records a page view. No-op when session cookie is absent or UA is a bot."""
    if ethitorial_sid is None:
        return
    if views_module.SessionLocal is None:
        return
    user_agent = request.headers.get("user-agent")
    async with views_module.SessionLocal() as db:
        await views_module.record_view(
            db,
            artifact_id=artifact_id,
            session_id=ethitorial_sid,
            user_agent=user_agent,
            user_id=user.id if user else None,
        )


@app.get("/api/views/{artifact_id:path}")
async def get_view_count(artifact_id: str) -> dict[str, int]:
    """Returns the total unique view count for an artifact."""
    if views_module.SessionLocal is None:
        return {"count": 0}
    async with views_module.SessionLocal() as db:
        count = await views_module.get_view_count(db, artifact_id)
    return {"count": count}


@app.post("/api/votes/{artifact_id:path}")
async def toggle_vote(
    artifact_id: str,
    user: Annotated[AuthUser, Depends(require_auth)],
) -> dict[str, bool | int]:
    """Toggles the current user's vote on an artifact. Returns new state."""
    if votes_module.SessionLocal is None:
        return {"voted": False, "count": 0}
    async with votes_module.SessionLocal() as db:
        await votes_module.toggle_vote(db, artifact_id, user.id)
        state = await votes_module.get_vote_state(db, artifact_id, user.id)
    return state


@app.get("/api/votes/{artifact_id:path}")
async def get_vote_state(
    artifact_id: str,
    user: Annotated[AuthUser | None, Depends(get_current_user)] = None,
) -> dict[str, bool | int]:
    """Returns { count, voted } for the artifact; voted is false for anon users."""
    if votes_module.SessionLocal is None:
        return {"count": 0, "voted": False}
    async with votes_module.SessionLocal() as db:
        state = await votes_module.get_vote_state(db, artifact_id, user.id if user else None)
    return state
