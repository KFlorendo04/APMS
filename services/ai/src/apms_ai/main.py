from __future__ import annotations

import os
import math
from pathlib import Path
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


class EvaluationInput(BaseModel):
    enrollment_id: str
    current_standing: float = Field(ge=0, le=100)
    recent_scores: list[float] = Field(min_length=1)
    attendance_rate: float = Field(ge=0, le=100)
    missing_assessment_count: int = Field(ge=0)


class PredictionOutput(BaseModel):
    enrollment_id: str
    model_version: str
    predicted_standing: float = Field(ge=0, le=100)
    risk_probability: float = Field(ge=0, le=1)
    risk_level: Literal["low", "medium", "high"]
    trend: Literal["improving", "stable", "declining"]
    factors: list[str]
    data_basis: Literal["controlled_synthetic_demonstration"]
    institutionally_validated: bool = False
    advisory_only: bool = True


class ModelRegistry:
    def __init__(self) -> None:
        raw_path = os.getenv("APMS_MODEL_ARTIFACT_PATH", "")
        self.path = Path(raw_path) if raw_path else None
        self.synthetic_enabled = os.getenv("APMS_AI_ENABLE_SYNTHETIC_DEMO", "true").lower() == "true"
        self.version = os.getenv("APMS_MODEL_VERSION", "synthetic-logistic-demo-v1")
        self.weights = self._train_synthetic_logistic_model() if self.synthetic_enabled else None

    @property
    def available(self) -> bool:
        return bool((self.path and self.path.is_file()) or self.weights)

    @staticmethod
    def _sigmoid(value: float) -> float:
        return 1 / (1 + math.exp(-max(-30, min(30, value))))

    def _train_synthetic_logistic_model(self) -> list[float]:
        # Controlled demonstration data only. Labels encode plausible risk
        # relationships and are never represented as SWU institutional evidence.
        samples: list[tuple[list[float], int]] = []
        for standing in (45, 60, 72, 80, 90):
            for attendance in (55, 72, 85, 96):
                for trend in (-0.2, 0.0, 0.15):
                    for missing in (0, 2, 5):
                        features = [1.0, standing / 100, attendance / 100, trend, missing / 10]
                        at_risk = int(standing < 75 or attendance < 70 or missing >= 4 or (standing < 82 and trend < 0))
                        samples.append((features, at_risk))
        weights = [0.0] * 5
        rate = 0.35
        for _ in range(1200):
            gradient = [0.0] * 5
            for features, label in samples:
                prediction = self._sigmoid(sum(weight * feature for weight, feature in zip(weights, features)))
                for index, feature in enumerate(features):
                    gradient[index] += (prediction - label) * feature
            for index in range(len(weights)):
                weights[index] -= rate * gradient[index] / len(samples)
        return weights

    def predict(self, payload: EvaluationInput) -> PredictionOutput:
        if not self.available:
            raise HTTPException(
                status_code=503,
                detail="No approved APMS model artifact is configured; no prediction was generated.",
            )
        assert self.weights is not None
        first = payload.recent_scores[0]
        last = payload.recent_scores[-1]
        trend_value = (last - first) / 100 if len(payload.recent_scores) > 1 else 0
        trend = "improving" if trend_value > 0.02 else "declining" if trend_value < -0.02 else "stable"
        features = [
            1.0,
            payload.current_standing / 100,
            payload.attendance_rate / 100,
            trend_value,
            min(payload.missing_assessment_count, 10) / 10,
        ]
        probability = self._sigmoid(sum(weight * feature for weight, feature in zip(self.weights, features)))
        risk_level = "high" if probability >= 0.7 else "medium" if probability >= 0.4 else "low"
        predicted = max(0, min(100,
            payload.current_standing + (last - first) * 0.15
            + (payload.attendance_rate - 80) * 0.05
            - payload.missing_assessment_count * 1.5
        ))
        factors: list[str] = []
        if payload.current_standing < 75: factors.append("Current standing is below the configured passing reference")
        if trend == "declining": factors.append("Recent assessment scores are declining")
        if payload.attendance_rate < 80: factors.append("Attendance rate is below 80%")
        if payload.missing_assessment_count: factors.append(f"{payload.missing_assessment_count} assessment(s) are missing")
        if not factors: factors.append("Recorded indicators are currently stable")
        return PredictionOutput(
            enrollment_id=payload.enrollment_id,
            model_version=self.version,
            predicted_standing=round(predicted, 2),
            risk_probability=round(probability, 4),
            risk_level=risk_level,
            trend=trend,
            factors=factors,
            data_basis="controlled_synthetic_demonstration",
        )


registry = ModelRegistry()
app = FastAPI(title="APMS AI Service", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8081",
        "http://127.0.0.1:8081",
        "http://localhost:8082",
        "http://127.0.0.1:8082",
    ],
    allow_methods=["GET", "POST"],
    allow_headers=["content-type", "authorization"],
)


@app.get("/health")
def health() -> dict[str, object]:
    return {
        "status": "ok",
        "model_available": registry.available,
        "model_version": registry.version,
        "data_basis": "controlled_synthetic_demonstration" if registry.available else None,
        "institutionally_validated": False,
    }


@app.post("/v1/predictions", response_model=PredictionOutput)
def predict(payload: EvaluationInput) -> PredictionOutput:
    return registry.predict(payload)
