"""Tests for the identity boundary: session validation + /api/me endpoint."""

import uuid
from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from ethitorial.identity.models import AuthSession, AuthUser
from ethitorial.main import app

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_user(role: str = "user") -> AuthUser:
    user = AuthUser()
    user.id = str(uuid.uuid4())
    user.name = "Test User"
    user.email = "test@example.com"
    user.email_verified = True
    user.image = None
    user.username = "testuser"
    user.role = role
    user.created_at = datetime.now(tz=UTC)
    user.updated_at = datetime.now(tz=UTC)
    return user


def _make_session(user: AuthUser, expired: bool = False) -> AuthSession:
    session = AuthSession()
    session.id = str(uuid.uuid4())
    session.token = "valid-session-token"
    session.user_id = user.id
    session.user = user
    session.ip_address = None
    session.user_agent = None
    session.created_at = datetime.now(tz=UTC)
    session.updated_at = datetime.now(tz=UTC)
    session.expires_at = (
        datetime.now(tz=UTC) - timedelta(hours=1)
        if expired
        else datetime.now(tz=UTC) + timedelta(days=7)
    )
    return session


# ---------------------------------------------------------------------------
# /api/me — unauthenticated (no cookie, no DB needed)
# ---------------------------------------------------------------------------


def test_me_returns_401_without_cookie():
    from ethitorial.identity.dependencies import get_current_user

    app.dependency_overrides[get_current_user] = lambda: None  # type: ignore[assignment]
    try:
        client = TestClient(app)
        response = client.get("/api/me")
        assert response.status_code == 401
    finally:
        app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# get_current_user — unit tests via SessionLocal mock
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_current_user_returns_none_without_cookie():
    from ethitorial.identity.dependencies import get_current_user

    result = await get_current_user(better_auth_session_token=None)
    assert result is None


@pytest.mark.asyncio
async def test_get_current_user_returns_user_with_valid_session():
    user = _make_user()
    session = _make_session(user)

    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = session

    mock_db = AsyncMock()
    mock_db.execute = AsyncMock(return_value=mock_result)

    mock_session_maker = MagicMock()
    mock_session_maker.return_value.__aenter__ = AsyncMock(return_value=mock_db)
    mock_session_maker.return_value.__aexit__ = AsyncMock(return_value=None)

    from ethitorial.identity import dependencies

    with patch.object(dependencies, "SessionLocal", mock_session_maker):
        from ethitorial.identity.dependencies import get_current_user

        result = await get_current_user(better_auth_session_token="valid-session-token")

    assert result is not None
    assert result.username == "testuser"
    assert result.role == "user"


@pytest.mark.asyncio
async def test_get_current_user_returns_none_when_session_expired():
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None  # expired filtered by query

    mock_db = AsyncMock()
    mock_db.execute = AsyncMock(return_value=mock_result)

    mock_session_maker = MagicMock()
    mock_session_maker.return_value.__aenter__ = AsyncMock(return_value=mock_db)
    mock_session_maker.return_value.__aexit__ = AsyncMock(return_value=None)

    from ethitorial.identity import dependencies

    with patch.object(dependencies, "SessionLocal", mock_session_maker):
        from ethitorial.identity.dependencies import get_current_user

        result = await get_current_user(better_auth_session_token="expired-token")

    assert result is None


# ---------------------------------------------------------------------------
# /api/me — endpoint with overridden dependency
# ---------------------------------------------------------------------------


def test_me_returns_user_data_when_authenticated():
    user = _make_user()

    from ethitorial.identity.dependencies import get_current_user

    app.dependency_overrides[get_current_user] = lambda: user  # type: ignore[assignment]
    try:
        client = TestClient(app)
        response = client.get("/api/me")
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "testuser"
        assert data["role"] == "user"
        assert data["email"] == "test@example.com"
    finally:
        app.dependency_overrides.clear()


def test_me_authenticated_returns_username_and_role_for_admin():
    user = _make_user(role="admin")

    from ethitorial.identity.dependencies import get_current_user

    app.dependency_overrides[get_current_user] = lambda: user  # type: ignore[assignment]
    try:
        client = TestClient(app)
        response = client.get("/api/me/authenticated")
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "testuser"
        assert data["role"] == "admin"
    finally:
        app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Alembic migration — identity tables created / removed
# (sync tests: alembic uses asyncio.run() internally)
# ---------------------------------------------------------------------------


def test_identity_migration_upgrade_creates_tables(tmp_path):
    import sqlalchemy as sa
    from alembic.config import Config

    from alembic import command

    db_file = tmp_path / "test_identity.db"
    db_url = f"sqlite+aiosqlite:///{db_file}"
    sync_url = f"sqlite:///{db_file}"

    cfg = Config("alembic.ini")
    cfg.set_main_option("sqlalchemy.url", db_url)
    cfg.set_main_option("script_location", "alembic")

    command.upgrade(cfg, "head")

    engine = sa.create_engine(sync_url)
    with engine.connect() as conn:
        tables = sa.inspect(conn).get_table_names()

    assert "auth_user" in tables
    assert "auth_session" in tables
    assert "auth_account" in tables
    assert "auth_verification" in tables


# ---------------------------------------------------------------------------
# /api/authors/{username} — public profile
# ---------------------------------------------------------------------------


def test_get_author_returns_profile_when_user_exists():
    user = _make_user()

    import ethitorial.main as main_module

    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = user

    mock_db = AsyncMock()
    mock_db.execute = AsyncMock(return_value=mock_result)

    mock_session_maker = MagicMock()
    mock_session_maker.return_value.__aenter__ = AsyncMock(return_value=mock_db)
    mock_session_maker.return_value.__aexit__ = AsyncMock(return_value=None)

    with patch.object(main_module, "SessionLocal", mock_session_maker):
        client = TestClient(app)
        response = client.get("/api/authors/testuser")

    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "testuser"
    assert data["name"] == "Test User"
    assert "id" not in data  # id não é público


def test_get_author_returns_404_when_user_not_found():
    import ethitorial.main as main_module

    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None

    mock_db = AsyncMock()
    mock_db.execute = AsyncMock(return_value=mock_result)

    mock_session_maker = MagicMock()
    mock_session_maker.return_value.__aenter__ = AsyncMock(return_value=mock_db)
    mock_session_maker.return_value.__aexit__ = AsyncMock(return_value=None)

    with patch.object(main_module, "SessionLocal", mock_session_maker):
        client = TestClient(app)
        response = client.get("/api/authors/nobody")

    assert response.status_code == 404


def test_identity_migration_downgrade_removes_tables(tmp_path):
    import sqlalchemy as sa
    from alembic.config import Config

    from alembic import command

    db_file = tmp_path / "test_identity_down.db"
    db_url = f"sqlite+aiosqlite:///{db_file}"
    sync_url = f"sqlite:///{db_file}"

    cfg = Config("alembic.ini")
    cfg.set_main_option("sqlalchemy.url", db_url)
    cfg.set_main_option("script_location", "alembic")

    command.upgrade(cfg, "head")
    command.downgrade(cfg, "20260612152918")

    engine = sa.create_engine(sync_url)
    with engine.connect() as conn:
        tables = sa.inspect(conn).get_table_names()

    assert "auth_user" not in tables
    assert "auth_session" not in tables
