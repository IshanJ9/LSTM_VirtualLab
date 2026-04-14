"""
FastAPI backend for XAI-LSTM Lab.
Endpoints: GET /simulate, GET /analysis, POST /counterfactual, GET /datasets
"""
import os
import json
import sys

sys.path.insert(0, os.path.dirname(__file__))

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from explainability import (
    gate_contribution,
    memory_persistence,
    detect_failure_cases,
    counterfactual_prediction,
)

app = FastAPI(title="XAI-LSTM Lab API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
DATASETS = ["sine", "noisy", "text", "long-range"]


def _load(filename: str):
    path = os.path.join(DATA_DIR, filename)
    if not os.path.exists(path):
        raise HTTPException(
            status_code=404,
            detail=f"File '{filename}' not found. Run `python precompute.py` first.",
        )
    with open(path) as f:
        return json.load(f)


def _check(dataset: str):
    if dataset not in DATASETS:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown dataset '{dataset}'. Choose from: {DATASETS}",
        )


@app.get("/")
def root():
    return {"message": "XAI-LSTM Lab API", "version": "1.0.0", "datasets": DATASETS}


@app.get("/datasets")
def list_datasets():
    result = []
    for name in DATASETS:
        try:
            meta = _load(f"{name}_meta.json")
        except HTTPException:
            meta = {"id": name, "name": name, "available": False}
        result.append(meta)
    return result


@app.get("/simulate")
def simulate(dataset: str = Query(..., description="Dataset id: sine | noisy | text | long-range")):
    _check(dataset)
    sim  = _load(f"{dataset}_simulation.json")
    meta = _load(f"{dataset}_meta.json")
    return {"dataset": dataset, "meta": meta, "timesteps": sim, "total": len(sim)}


@app.get("/analysis")
def analysis(dataset: str = Query(..., description="Dataset id")):
    _check(dataset)
    sim = _load(f"{dataset}_simulation.json")
    failures = detect_failure_cases(sim)
    mean_err = float(sum(abs(d["predicted"] - d["actual"]) for d in sim) / len(sim))
    return {
        "dataset":            dataset,
        "total_timesteps":    len(sim),
        "mean_absolute_error": round(mean_err, 5),
        "gate_contribution":  gate_contribution(sim),
        "memory_persistence": memory_persistence(sim),
        "failure_cases":      failures,
        "failure_rate":       round(len(failures) / len(sim), 3),
    }


class CounterfactualRequest(BaseModel):
    dataset:   str = Field(..., description="Dataset id")
    timestep:  int = Field(..., ge=0, description="Timestep index")
    gate:      str = Field(..., description="forget_gate | input_gate | output_gate")
    new_value: float = Field(..., ge=0.0, le=1.0, description="New gate value [0,1]")


@app.post("/counterfactual")
def counterfactual(req: CounterfactualRequest):
    _check(req.dataset)
    sim = _load(f"{req.dataset}_simulation.json")
    return counterfactual_prediction(sim, req.timestep, req.gate, req.new_value)
