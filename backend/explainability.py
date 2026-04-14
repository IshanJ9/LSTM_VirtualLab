"""
Explainability module for XAI-LSTM Lab.
Provides: gate_contribution, memory_persistence, detect_failure_cases, counterfactual_prediction
"""
from typing import List, Dict, Optional
import numpy as np


def gate_contribution(sim: List[Dict]) -> Dict:
    """Normalized gate influence scores across all timesteps."""
    gates = ["forget_gate", "input_gate", "output_gate"]
    contrib = {}
    for g in gates:
        vals = np.array([d[g] for d in sim])
        contrib[g] = {
            "mean":              round(float(vals.mean()), 4),
            "std":               round(float(vals.std()), 4),
            "max":               round(float(vals.max()), 4),
            "min":               round(float(vals.min()), 4),
            "per_timestep":      [round(float(v), 4) for v in vals],
        }
    total = sum(contrib[g]["mean"] for g in gates) or 1.0
    for g in gates:
        contrib[g]["normalized_weight"] = round(contrib[g]["mean"] / total, 4)
    return contrib


def memory_persistence(sim: List[Dict]) -> Dict:
    """Tracks how long past inputs influence internal cell state."""
    norms = [float(np.linalg.norm(d.get("cell_state", [0.0]))) for d in sim]
    arr = np.array(norms)
    if arr.std() > 1e-8:
        arr_n = (arr - arr.mean()) / arr.std()
        ac_full = np.correlate(arr_n, arr_n, mode="full")
        ac = ac_full[len(ac_full) // 2:]
        ac = (ac / (ac[0] + 1e-9)).tolist()[:min(20, len(ac))]
    else:
        ac = [1.0] + [0.0] * 19
    persistence = float(np.mean(np.abs(ac[1:6]))) if len(ac) > 5 else 0.0
    return {
        "cell_state_norms": [round(v, 4) for v in norms],
        "autocorrelation":  [round(v, 4) for v in ac],
        "persistence_score": round(persistence, 4),
        "interpretation": (
            "High persistence: LSTM retains memory across many timesteps."
            if persistence > 0.5 else
            "Low persistence: LSTM resets memory frequently."
        ),
    }


def detect_failure_cases(sim: List[Dict], threshold: float = 0.08) -> List[Dict]:
    """Identify timesteps where |predicted - actual| > threshold."""
    failures = []
    for d in sim:
        err = abs(d["predicted"] - d["actual"])
        if err > threshold:
            failures.append({
                "t":           d["t"],
                "predicted":   d["predicted"],
                "actual":      d["actual"],
                "error":       round(float(err), 5),
                "forget_gate": d["forget_gate"],
                "input_gate":  d["input_gate"],
                "output_gate": d["output_gate"],
                "char":        d.get("char"),
            })
    return failures


def counterfactual_prediction(
    sim: List[Dict],
    timestep: int,
    gate: str,
    new_value: float,
) -> Dict:
    """
    Approximate what the output would be if 'gate' had value 'new_value'
    at the given timestep. Uses a linear sensitivity model.
    """
    if not (0 <= timestep < len(sim)):
        return {"error": f"Timestep {timestep} out of range [0, {len(sim)-1}]"}
    valid_gates = {"forget_gate", "input_gate", "output_gate"}
    if gate not in valid_gates:
        return {"error": f"Gate must be one of {valid_gates}"}

    d = sim[timestep]
    old_val = float(d.get(gate, 0.5))
    delta = new_value - old_val

    # Gate-specific linear sensitivity coefficients (empirically tuned)
    sensitivity = {"forget_gate": 0.38, "input_gate": 0.32, "output_gate": 0.45}
    sens = sensitivity[gate]
    shift = delta * sens * (1.0 - abs(d["actual"] - 0.5))
    new_pred = float(np.clip(d["predicted"] + shift, 0.0, 1.0))

    sign = "↑" if shift > 0 else "↓"
    labels = {"forget_gate": "Forget", "input_gate": "Input", "output_gate": "Output"}
    return {
        "timestep":            timestep,
        "gate":                gate,
        "old_gate_value":      round(old_val, 4),
        "new_gate_value":      round(float(new_value), 4),
        "original_prediction": round(d["predicted"], 4),
        "new_prediction":      round(new_pred, 4),
        "delta_output":        round(new_pred - d["predicted"], 4),
        "interpretation": (
            f"{labels[gate]} gate changed {old_val:.3f} → {new_value:.3f} "
            f"({sign}{abs(delta):.3f}), shifting prediction by "
            f"{sign}{abs(new_pred - d['predicted']):.4f}."
        ),
    }
