import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_read_health():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "model" in data

def test_read_examples():
    response = client.get("/examples")
    assert response.status_code == 200
    data = response.json()
    assert "examples" in data
    assert "count" in data
    assert data["count"] > 0
