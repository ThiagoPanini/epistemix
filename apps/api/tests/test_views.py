"""Tests for the E2 view-tracking use case and API endpoints."""

from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from ethitorial.engagement import views as views_module
from ethitorial.engagement.views import get_view_count, is_bot, record_view
from ethitorial.main import app

client = TestClient(app)

# ---------------------------------------------------------------------------
# is_bot unit tests
# ---------------------------------------------------------------------------


def test_is_bot_returns_false_for_none() -> None:
    assert is_bot(None) is False


def test_is_bot_returns_false_for_normal_browser() -> None:
    ua = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
    assert is_bot(ua) is False


def test_is_bot_returns_true_for_googlebot() -> None:
    assert is_bot("Googlebot/2.1 (+http://www.google.com/bot.html)") is True


def test_is_bot_returns_true_for_python_requests() -> None:
    assert is_bot("python-requests/2.31.0") is True


def test_is_bot_returns_true_for_semrush() -> None:
    assert is_bot("SemrushBot/7~bl") is True


# ---------------------------------------------------------------------------
# record_view unit tests (mocked DB)
# ---------------------------------------------------------------------------


def _make_mock_db(rowcount: int = 1) -> AsyncMock:
    """Returns an AsyncMock that behaves like an AsyncSession."""
    result_mock = MagicMock()
    result_mock.rowcount = rowcount

    db = AsyncMock()
    db.execute = AsyncMock(return_value=result_mock)
    db.commit = AsyncMock()
    return db


@pytest.mark.asyncio
async def test_record_view_returns_true_for_new_view() -> None:
    db = _make_mock_db(rowcount=1)
    result = await record_view(db, "blog/src/my-post", "session-abc")
    assert result is True
    db.execute.assert_awaited_once()
    db.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_record_view_returns_false_for_dedup() -> None:
    db = _make_mock_db(rowcount=0)
    result = await record_view(db, "blog/src/my-post", "session-abc")
    assert result is False


@pytest.mark.asyncio
async def test_record_view_returns_false_for_bot() -> None:
    db = _make_mock_db(rowcount=1)
    result = await record_view(db, "blog/src/my-post", "session-abc", user_agent="Googlebot/2.1")
    assert result is False
    db.execute.assert_not_awaited()


@pytest.mark.asyncio
async def test_record_view_with_authenticated_user() -> None:
    db = _make_mock_db(rowcount=1)
    uid = str(uuid4())
    result = await record_view(db, "blog/src/my-post", "session-abc", user_id=uid)
    assert result is True


@pytest.mark.asyncio
async def test_record_view_ignores_invalid_user_id() -> None:
    db = _make_mock_db(rowcount=1)
    result = await record_view(db, "blog/src/my-post", "session-abc", user_id="not-a-uuid")
    assert result is True
    db.execute.assert_awaited_once()


# ---------------------------------------------------------------------------
# get_view_count unit tests (mocked DB)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_view_count_returns_zero_for_no_views() -> None:
    result_mock = MagicMock()
    result_mock.scalar_one.return_value = 0
    db = AsyncMock()
    db.execute = AsyncMock(return_value=result_mock)

    count = await get_view_count(db, "blog/src/my-post")
    assert count == 0


@pytest.mark.asyncio
async def test_get_view_count_returns_real_count() -> None:
    result_mock = MagicMock()
    result_mock.scalar_one.return_value = 42
    db = AsyncMock()
    db.execute = AsyncMock(return_value=result_mock)

    count = await get_view_count(db, "blog/src/my-post")
    assert count == 42


# ---------------------------------------------------------------------------
# API endpoint tests
# ---------------------------------------------------------------------------


def _mock_db_for_record(rowcount: int = 1):
    """Context manager that patches SessionLocal for record_view calls."""
    result_mock = MagicMock()
    result_mock.rowcount = rowcount

    session_mock = AsyncMock()
    session_mock.execute = AsyncMock(return_value=result_mock)
    session_mock.commit = AsyncMock()
    session_mock.__aenter__ = AsyncMock(return_value=session_mock)
    session_mock.__aexit__ = AsyncMock(return_value=None)

    session_maker = MagicMock(return_value=session_mock)
    return patch.object(views_module, "SessionLocal", session_maker)


def _mock_db_for_count(count: int = 5):
    result_mock = MagicMock()
    result_mock.scalar_one.return_value = count

    session_mock = AsyncMock()
    session_mock.execute = AsyncMock(return_value=result_mock)
    session_mock.__aenter__ = AsyncMock(return_value=session_mock)
    session_mock.__aexit__ = AsyncMock(return_value=None)

    session_maker = MagicMock(return_value=session_mock)
    return patch.object(views_module, "SessionLocal", session_maker)


def test_post_view_returns_204_with_session_cookie() -> None:
    with _mock_db_for_record():
        response = client.post(
            "/api/views/blog/src/my-post",
            cookies={"ethitorial_sid": "test-session-id"},
        )
    assert response.status_code == 204


def test_post_view_returns_204_without_session_cookie() -> None:
    response = client.post("/api/views/blog/src/my-post")
    assert response.status_code == 204


def test_post_view_does_not_record_when_no_cookie() -> None:
    with _mock_db_for_record() as mock_maker:
        client.post("/api/views/blog/src/my-post")
    # session factory never called — no cookie means no DB call
    mock_maker.return_value.execute.assert_not_awaited()


def test_get_view_count_returns_count() -> None:
    with _mock_db_for_count(count=7):
        response = client.get("/api/views/blog/src/my-post")
    assert response.status_code == 200
    assert response.json() == {"count": 7}


def test_get_view_count_returns_zero_when_no_db() -> None:
    response = client.get("/api/views/blog/src/my-post")
    assert response.status_code == 200
    assert response.json() == {"count": 0}
