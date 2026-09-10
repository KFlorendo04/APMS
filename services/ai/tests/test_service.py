from fastapi.testclient import TestClient

from apms_ai.main import app


client = TestClient(app)


def test_health_discloses_synthetic_prototype_limitations():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["model_available"] is True
    assert response.json()["institutionally_validated"] is False
    assert response.json()["data_basis"] == "controlled_synthetic_demonstration"


def test_prediction_returns_traceable_advisory_output():
    response = client.post("/v1/predictions", json={
        "enrollment_id": "fictional-enrollment",
        "current_standing": 68,
        "recent_scores": [78, 70, 62],
        "attendance_rate": 72,
        "missing_assessment_count": 2,
    })
    assert response.status_code == 200
    result = response.json()
    assert result["advisory_only"] is True
    assert result["institutionally_validated"] is False
    assert result["risk_level"] in {"medium", "high"}
    assert result["trend"] == "declining"
    assert result["factors"]


def test_invalid_prediction_request_is_rejected():
    response = client.post("/v1/predictions", json={
        "enrollment_id": "fictional-enrollment",
        "current_standing": 120,
        "recent_scores": [],
        "attendance_rate": 95,
        "missing_assessment_count": 0,
    })
    assert response.status_code == 422
