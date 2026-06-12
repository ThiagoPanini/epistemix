"""epistemix API — application entrypoint."""

from typing import Annotated

from fastapi import Depends, FastAPI

from epistemix.db import ping_db
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
