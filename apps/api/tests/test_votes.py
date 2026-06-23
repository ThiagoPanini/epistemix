"""Tests for E3 vote toggle use case and API endpoints."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from ethitorial.engagement import votes as votes_module
from ethitorial.engagement.votes import get_vote_state, toggle_vote
from ethitorial.identity.dependencies import get_current_user, require_auth
from ethitorial.identity.models import AuthUser
from ethitorial.main import app

client = TestClient(app)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_user(user_id: str = "nanoid123abc", role: str = "user") -> AuthUser:
    return AuthUser(
        id=user_id,
        name="Test User",
        email="test@example.com",
        email_verified=True,
        username="testuser",
        role=role,
        created_at=__import__("datetime").datetime.now(tz=__import__("datetime").timezone.utc),
        updated_at=__import__("datetime").datetime.now(tz=__import__("datetime").timezone.utc),
    )


# ---------------------------------------------------------------------------
# toggle_vote unit tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_toggle_vote_adds_vote_when_none_exists() -> None:
    vote_result = MagicMock()
    vote_result.scalar_one_or_none.return_value = None
    db = AsyncMock()
    db.execute = AsyncMock(return_value=vote_result)
    db.commit = AsyncMock()

    result = await toggle_vote(db, "blog/src/post", "user123")
    assert result is True
    assert db.execute.await_count == 2  # select + insert
    db.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_toggle_vote_removes_vote_when_exists() -> None:
    existing = MagicMock()  # non-None = vote exists
    vote_result = MagicMock()
    vote_result.scalar_one_or_none.return_value = existing
    db = AsyncMock()
    db.execute = AsyncMock(return_value=vote_result)
    db.commit = AsyncMock()

    result = await toggle_vote(db, "blog/src/post", "user123")
    assert result is False
    assert db.execute.await_count == 2  # select + delete
    db.commit.assert_awaited_once()


# ---------------------------------------------------------------------------
# get_vote_state unit tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_vote_state_returns_count_and_not_voted_for_anon() -> None:
    count_result = MagicMock()
    count_result.scalar_one.return_value = 5
    db = AsyncMock()
    db.execute = AsyncMock(return_value=count_result)

    state = await get_vote_state(db, "blog/src/post", user_id=None)
    assert state == {"count": 5, "voted": False}
    db.execute.assert_awaited_once()


@pytest.mark.asyncio
async def test_get_vote_state_returns_voted_true_when_user_voted() -> None:
    count_result = MagicMock()
    count_result.scalar_one.return_value = 3

    vote_result = MagicMock()
    vote_result.scalar_one_or_none.return_value = MagicMock()  # vote exists

    db = AsyncMock()
    db.execute = AsyncMock(side_effect=[count_result, vote_result])

    state = await get_vote_state(db, "blog/src/post", user_id="user123")
    assert state == {"count": 3, "voted": True}


@pytest.mark.asyncio
async def test_get_vote_state_returns_voted_false_when_user_not_voted() -> None:
    count_result = MagicMock()
    count_result.scalar_one.return_value = 2

    vote_result = MagicMock()
    vote_result.scalar_one_or_none.return_value = None

    db = AsyncMock()
    db.execute = AsyncMock(side_effect=[count_result, vote_result])

    state = await get_vote_state(db, "blog/src/post", user_id="user123")
    assert state == {"count": 2, "voted": False}


# ---------------------------------------------------------------------------
# API endpoint tests
# ---------------------------------------------------------------------------


def _mock_votes_db(count: int = 3, voted_after: bool = True):
    """Patches votes_module.SessionLocal."""
    count_result = MagicMock()
    count_result.scalar_one.return_value = count

    voted_result = MagicMock()
    voted_result.scalar_one_or_none.return_value = MagicMock() if voted_after else None

    session_mock = AsyncMock()
    # toggle: select existing (None = no vote), insert, then get_vote_state: count + voted
    no_vote = MagicMock()
    no_vote.scalar_one_or_none.return_value = None
    session_mock.execute = AsyncMock(side_effect=[no_vote, MagicMock(), count_result, voted_result])
    session_mock.commit = AsyncMock()
    session_mock.__aenter__ = AsyncMock(return_value=session_mock)
    session_mock.__aexit__ = AsyncMock(return_value=None)

    return patch.object(votes_module, "SessionLocal", MagicMock(return_value=session_mock))


def test_get_votes_returns_state_for_anon_user() -> None:
    count_result = MagicMock()
    count_result.scalar_one.return_value = 4

    session_mock = AsyncMock()
    session_mock.execute = AsyncMock(return_value=count_result)
    session_mock.__aenter__ = AsyncMock(return_value=session_mock)
    session_mock.__aexit__ = AsyncMock(return_value=None)

    with patch.object(votes_module, "SessionLocal", MagicMock(return_value=session_mock)):
        response = client.get("/api/votes/blog/src/post")

    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 4
    assert data["voted"] is False


def test_get_votes_returns_zero_when_no_db() -> None:
    response = client.get("/api/votes/blog/src/post")
    assert response.status_code == 200
    assert response.json() == {"count": 0, "voted": False}


def test_post_vote_requires_auth() -> None:
    response = client.post("/api/votes/blog/src/post")
    assert response.status_code == 401


def test_post_vote_returns_state_when_authenticated() -> None:
    user = _make_user()
    app.dependency_overrides[require_auth] = lambda: user
    app.dependency_overrides[get_current_user] = lambda: user

    try:
        with _mock_votes_db(count=1, voted_after=True):
            response = client.post("/api/votes/blog/src/post")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    data = response.json()
    assert "count" in data
    assert "voted" in data
