from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_extract_invalid_extension():
    files = {'file': ('test.invalid', b'dummy content', 'text/plain')}
    response = client.post("/api/v1/extract/", files=files)
    
    assert response.status_code == 400
    assert "Unsupported file extension" in response.json()["detail"]
