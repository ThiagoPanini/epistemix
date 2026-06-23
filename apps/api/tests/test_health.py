from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

from ethitorial.main import app

client = TestClient(app)


def test_health_returns_ok_with_db_unconfigured() -> None:
    """Without DATABASE_URL the endpoint is still healthy — db field signals unconfigured."""
    response = client.get("/health")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["db"] == "unconfigured"


def test_health_returns_ok_when_db_reachable() -> None:
    with patch("ethitorial.main.ping_db", new=AsyncMock(return_value="ok")):
        response = client.get("/health")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["db"] == "ok"


def test_health_returns_ok_when_db_unreachable() -> None:
    with patch("ethitorial.main.ping_db", new=AsyncMock(return_value="error")):
        response = client.get("/health")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["db"] == "error"
