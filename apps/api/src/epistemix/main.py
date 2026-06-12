"""epistemix API — application entrypoint."""

from typing import Annotated

from fastapi import Cookie, Depends, FastAPI, Request

from epistemix.db import ping_db
from epistemix.engagement import views as views_module
from epistemix.identity.dependencies import get_current_user, require_auth
from epistemix.identity.models import AuthUser

app = FastAPI(title="epistemix API", version="0.0.0")


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


@app.post("/api/views/{artifact_id:path}", status_code=204)
async def post_view(
    artifact_id: str,
    request: Request,
    epistemix_sid: Annotated[str | None, Cookie()] = None,
    user: Annotated[AuthUser | None, Depends(get_current_user)] = None,
) -> None:
    """Records a page view. No-op when session cookie is absent or UA is a bot."""
    if epistemix_sid is None:
        return
    if views_module.SessionLocal is None:
        return
    user_agent = request.headers.get("user-agent")
    async with views_module.SessionLocal() as db:
        await views_module.record_view(
            db,
            artifact_id=artifact_id,
            session_id=epistemix_sid,
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
