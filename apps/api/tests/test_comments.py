"""Tests for E4 — Comment use cases and API endpoints."""

import uuid
from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from epistemix.engagement import comments as comments_module
from epistemix.engagement.comments import create_comment, delete_comment, list_comments
from epistemix.identity.dependencies import get_current_user, require_auth
from epistemix.identity.models import AuthUser
from epistemix.main import app

client = TestClient(app)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_user(user_id: str = "user123", role: str = "user") -> AuthUser:
    return AuthUser(
        id=user_id,
        name="Test User",
        email="test@example.com",
        email_verified=True,
        username="testuser",
        role=role,
        created_at=datetime.now(tz=UTC),
        updated_at=datetime.now(tz=UTC),
    )


def _make_admin(user_id: str = "admin123") -> AuthUser:
    return _make_user(user_id=user_id, role="admin")


def _make_comment_row(comment_id: str, user_id: str, body: str = "Hello!", created_at=None):
    """Return a tuple matching the join query: (comment fields, user fields)."""
    from collections import namedtuple

    Row = namedtuple(
        "Row",
        [
            "comment_id",
            "artifact_id",
            "body",
            "created_at",
            "moderated_at",
            "user_id",
            "user_name",
            "username",
            "role",
            "image",
        ],
    )
    return Row(
        comment_id=comment_id,
        artifact_id="courses/src/post",
        body=body,
        created_at=created_at or datetime.now(tz=UTC),
        moderated_at=None,
        user_id=user_id,
        user_name="Test User",
        username="testuser",
        role="user",
        image=None,
    )


# ---------------------------------------------------------------------------
# list_comments unit tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_list_comments_returns_empty_list_when_no_comments():
    db = AsyncMock()
    result_mock = MagicMock()
    result_mock.all.return_value = []
    db.execute = AsyncMock(return_value=result_mock)

    comments = await list_comments(db, "courses/src/post")
    assert comments == []


@pytest.mark.asyncio
async def test_list_comments_returns_formatted_list():
    db = AsyncMock()
    cid = str(uuid.uuid4())
    row = _make_comment_row(cid, "user123")
    result_mock = MagicMock()
    result_mock.all.return_value = [row]
    db.execute = AsyncMock(return_value=result_mock)

    comments = await list_comments(db, "courses/src/post")
    assert len(comments) == 1
    assert comments[0]["id"] == cid
    assert comments[0]["body"] == "Hello!"
    assert comments[0]["username"] == "testuser"
    assert comments[0]["is_author"] is False


@pytest.mark.asyncio
async def test_list_comments_marks_admin_as_author():
    db = AsyncMock()
    cid = str(uuid.uuid4())
    from collections import namedtuple

    Row = namedtuple(
        "Row",
        [
            "comment_id",
            "artifact_id",
            "body",
            "created_at",
            "moderated_at",
            "user_id",
            "user_name",
            "username",
            "role",
            "image",
        ],
    )
    row = Row(
        comment_id=cid,
        artifact_id="courses/src/post",
        body="Admin says hi",
        created_at=datetime.now(tz=UTC),
        moderated_at=None,
        user_id="admin123",
        user_name="Admin",
        username="admin",
        role="admin",
        image=None,
    )
    result_mock = MagicMock()
    result_mock.all.return_value = [row]
    db.execute = AsyncMock(return_value=result_mock)

    comments = await list_comments(db, "courses/src/post")
    assert comments[0]["is_author"] is True


# ---------------------------------------------------------------------------
# create_comment unit tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_create_comment_returns_new_comment():
    db = AsyncMock()

    count_mock = MagicMock()
    count_mock.scalar_one.return_value = 0  # no recent comments → not rate limited
    db.execute = AsyncMock(return_value=count_mock)
    db.commit = AsyncMock()

    comment = await create_comment(db, "courses/src/post", "user123", "user", "Great article!")
    assert comment["body"] == "Great article!"
    assert comment["username"] == "user"
    db.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_create_comment_raises_429_when_rate_limited():
    from fastapi import HTTPException

    db = AsyncMock()
    count_mock = MagicMock()
    count_mock.scalar_one.return_value = 10  # at limit
    db.execute = AsyncMock(return_value=count_mock)

    with pytest.raises(HTTPException) as exc_info:
        await create_comment(db, "courses/src/post", "user123", "user", "spam")
    assert exc_info.value.status_code == 429


@pytest.mark.asyncio
async def test_create_comment_raises_422_when_body_too_long():
    from fastapi import HTTPException

    db = AsyncMock()
    count_mock = MagicMock()
    count_mock.scalar_one.return_value = 0
    db.execute = AsyncMock(return_value=count_mock)

    with pytest.raises(HTTPException) as exc_info:
        await create_comment(db, "courses/src/post", "user123", "user", "x" * 2001)
    assert exc_info.value.status_code == 422


# ---------------------------------------------------------------------------
# delete_comment unit tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_delete_comment_succeeds_for_admin():
    from epistemix.engagement.models import ArtifactComment

    comment = ArtifactComment()
    comment.id = uuid.uuid4()
    comment.user_id = "some-other-user"
    comment.artifact_id = "courses/src/post"
    comment.body = "hello"
    comment.created_at = datetime.now(tz=UTC)

    result_mock = MagicMock()
    result_mock.scalar_one_or_none.return_value = comment
    db = AsyncMock()
    db.execute = AsyncMock(return_value=result_mock)
    db.delete = AsyncMock()
    db.commit = AsyncMock()

    await delete_comment(db, str(comment.id), requesting_user_id="admin123", is_admin=True)
    db.delete.assert_awaited_once_with(comment)
    db.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_delete_comment_succeeds_for_own_comment():
    from epistemix.engagement.models import ArtifactComment

    comment = ArtifactComment()
    comment.id = uuid.uuid4()
    comment.user_id = "user123"
    comment.artifact_id = "courses/src/post"
    comment.body = "hello"
    comment.created_at = datetime.now(tz=UTC)

    result_mock = MagicMock()
    result_mock.scalar_one_or_none.return_value = comment
    db = AsyncMock()
    db.execute = AsyncMock(return_value=result_mock)
    db.delete = AsyncMock()
    db.commit = AsyncMock()

    await delete_comment(db, str(comment.id), requesting_user_id="user123", is_admin=False)
    db.delete.assert_awaited_once_with(comment)


@pytest.mark.asyncio
async def test_delete_comment_raises_403_for_other_user():
    from fastapi import HTTPException

    from epistemix.engagement.models import ArtifactComment

    comment = ArtifactComment()
    comment.id = uuid.uuid4()
    comment.user_id = "other-user"
    comment.artifact_id = "courses/src/post"
    comment.body = "hello"
    comment.created_at = datetime.now(tz=UTC)

    result_mock = MagicMock()
    result_mock.scalar_one_or_none.return_value = comment
    db = AsyncMock()
    db.execute = AsyncMock(return_value=result_mock)

    with pytest.raises(HTTPException) as exc_info:
        await delete_comment(db, str(comment.id), requesting_user_id="user123", is_admin=False)
    assert exc_info.value.status_code == 403


@pytest.mark.asyncio
async def test_delete_comment_raises_404_for_malformed_uuid():
    """SEC-5: malformed comment_id must return 404, not 500 (ValueError unhandled)."""
    from fastapi import HTTPException

    db = AsyncMock()

    with pytest.raises(HTTPException) as exc_info:
        await delete_comment(db, "not-a-uuid", requesting_user_id="user123", is_admin=False)
    assert exc_info.value.status_code == 404


# ---------------------------------------------------------------------------
# API endpoint tests
# ---------------------------------------------------------------------------


def _mock_comments_db(rows=None):
    """Patch comments_module.SessionLocal for GET /api/comments."""
    rows = rows or []
    result_mock = MagicMock()
    result_mock.all.return_value = rows

    session_mock = AsyncMock()
    session_mock.execute = AsyncMock(return_value=result_mock)
    session_mock.__aenter__ = AsyncMock(return_value=session_mock)
    session_mock.__aexit__ = AsyncMock(return_value=None)

    return patch.object(comments_module, "SessionLocal", MagicMock(return_value=session_mock))


def test_get_comments_returns_empty_list_when_no_db():
    response = client.get("/api/comments/courses/src/post")
    assert response.status_code == 200
    assert response.json() == []


def test_get_comments_returns_list_with_comments():
    cid = str(uuid.uuid4())
    row = _make_comment_row(cid, "user123")
    with _mock_comments_db([row]):
        response = client.get("/api/comments/courses/src/post")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["body"] == "Hello!"
    assert data[0]["username"] == "testuser"


def test_post_comment_requires_auth():
    response = client.post("/api/comments/courses/src/post", json={"body": "Hello!"})
    assert response.status_code == 401


def test_post_comment_creates_comment_when_authenticated():
    user = _make_user()
    app.dependency_overrides[require_auth] = lambda: user
    app.dependency_overrides[get_current_user] = lambda: user

    count_mock = MagicMock()
    count_mock.scalar_one.return_value = 0  # not rate limited

    session_mock = AsyncMock()
    session_mock.execute = AsyncMock(return_value=count_mock)
    session_mock.commit = AsyncMock()
    session_mock.__aenter__ = AsyncMock(return_value=session_mock)
    session_mock.__aexit__ = AsyncMock(return_value=None)

    try:
        with patch.object(comments_module, "SessionLocal", MagicMock(return_value=session_mock)):
            response = client.post(
                "/api/comments/courses/src/post", json={"body": "Great article!"}
            )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 201
    data = response.json()
    assert data["body"] == "Great article!"


def test_delete_comment_requires_auth():
    response = client.delete(f"/api/comments/{uuid.uuid4()}")
    assert response.status_code == 401


def test_delete_comment_succeeds_for_owner():
    from epistemix.engagement.models import ArtifactComment

    user = _make_user()
    comment = ArtifactComment()
    comment.id = uuid.uuid4()
    comment.user_id = user.id
    comment.artifact_id = "courses/src/post"
    comment.body = "hello"
    comment.created_at = datetime.now(tz=UTC)

    result_mock = MagicMock()
    result_mock.scalar_one_or_none.return_value = comment

    session_mock = AsyncMock()
    session_mock.execute = AsyncMock(return_value=result_mock)
    session_mock.delete = AsyncMock()
    session_mock.commit = AsyncMock()
    session_mock.__aenter__ = AsyncMock(return_value=session_mock)
    session_mock.__aexit__ = AsyncMock(return_value=None)

    app.dependency_overrides[require_auth] = lambda: user
    app.dependency_overrides[get_current_user] = lambda: user

    try:
        with patch.object(comments_module, "SessionLocal", MagicMock(return_value=session_mock)):
            response = client.delete(f"/api/comments/{comment.id}")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 204
