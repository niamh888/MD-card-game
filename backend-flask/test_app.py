"""Tests for the Flask backend. Run them with: pytest

Each test uses a temporary database, so your real data.db is never touched.
"""

import pytest

import app as backend


@pytest.fixture
def client(tmp_path, monkeypatch):
    # Point the app at a brand-new empty database for this one test.
    monkeypatch.setattr(backend, "DB_PATH", str(tmp_path / "test.db"))
    backend.init_db()
    # Capture the sign-in link instead of printing or emailing it.
    sent = []
    monkeypatch.setattr(backend, "send_login_email", lambda email, link: sent.append(link))
    test_client = backend.app.test_client()
    test_client.sent_links = sent
    return test_client


def sign_in(client, email="learner@example.com"):
    """Go through the whole magic-link sign-in and leave the client signed in."""
    client.post("/api/auth/request", json={"email": email})
    token = client.sent_links[-1].split("token=")[1]
    return client.post("/api/auth/verify", json={"token": token})


def test_health_returns_ok(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.get_json() == {"status": "ok"}


def test_request_link_rejects_bad_email(client):
    response = client.post("/api/auth/request", json={"email": "not-an-email"})
    assert response.status_code == 400


def test_nobody_is_signed_in_at_first(client):
    assert client.get("/api/me").get_json() == {"user": None}


def test_ratings_need_sign_in(client):
    assert client.get("/api/ratings").status_code == 401
    assert client.put("/api/ratings", json={"term": "Hemostasis", "rating": 3}).status_code == 401


def test_sign_in_link_works_once(client):
    client.post("/api/auth/request", json={"email": "learner@example.com"})
    token = client.sent_links[-1].split("token=")[1]
    assert client.post("/api/auth/verify", json={"token": token}).status_code == 200
    # The same link cannot be used a second time.
    assert client.post("/api/auth/verify", json={"token": token}).status_code == 400


def test_signed_in_person_can_save_and_read_ratings(client):
    sign_in(client)
    assert client.get("/api/me").get_json() == {"user": {"email": "learner@example.com"}}
    assert client.put("/api/ratings", json={"term": "Hemostasis", "rating": 3}).status_code == 200
    # Rating the same card again replaces the old rating.
    client.put("/api/ratings", json={"term": "Hemostasis", "rating": 1})
    assert client.get("/api/ratings").get_json() == {"Hemostasis": 1}


def test_invalid_rating_is_rejected(client):
    sign_in(client)
    assert client.put("/api/ratings", json={"term": "Hemostasis", "rating": 9}).status_code == 400


def test_sign_out_ends_the_session(client):
    sign_in(client)
    client.post("/api/auth/logout")
    assert client.get("/api/me").get_json() == {"user": None}
