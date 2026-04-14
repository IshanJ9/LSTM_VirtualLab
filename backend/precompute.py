"""
Precompute simulation JSON for all 4 datasets.
Run once: python precompute.py
Output saved to ./data/<dataset>_simulation.json and ./data/<dataset>_meta.json
"""
import os
import json
import sys

# Allow running from any directory
sys.path.insert(0, os.path.dirname(__file__))

from lstm_model import CustomLSTM, train_model
from datasets import DATASET_REGISTRY

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "data")
os.makedirs(OUTPUT_DIR, exist_ok=True)

EPOCHS = {
    "sine":       500,
    "noisy":      500,
    "text":       600,
    "long-range": 700,
}


def precompute(name: str):
    print(f"\n[{name}] Generating dataset...")
    fn = DATASET_REGISTRY[name]
    x, y, meta = fn()

    print(f"[{name}] Training LSTM ({EPOCHS[name]} epochs)...")
    model = CustomLSTM(input_size=1, hidden_size=16, output_size=1)
    losses = train_model(model, x, y, epochs=EPOCHS[name], lr=0.01)
    print(f"[{name}] Final loss: {losses[-1]:.6f}")

    # Build extra fields for text dataset (symbolic chars)
    extra = {}
    if name == "text":
        extra["char"]        = meta.get("x_chars", [])
        extra["target_char"] = meta.get("y_chars", [])

    print(f"[{name}] Running inference...")
    results = model.run_inference(x, y, extra_fields=extra if extra else None)

    # Save simulation JSON
    sim_path = os.path.join(OUTPUT_DIR, f"{name}_simulation.json")
    with open(sim_path, "w") as f:
        json.dump(results, f, indent=2)
    print(f"[{name}] Saved simulation → {sim_path}")

    # Save clean metadata (exclude large lists)
    skip_keys = {"x_chars", "y_chars", "char_vocab"}
    meta_clean = {k: v for k, v in meta.items() if k not in skip_keys}
    if name == "text":
        meta_clean["char_vocab"] = meta.get("char_vocab", [])
        meta_clean["corpus_preview"] = meta.get("x_chars", [])[:40]

    meta_path = os.path.join(OUTPUT_DIR, f"{name}_meta.json")
    with open(meta_path, "w") as f:
        json.dump(meta_clean, f, indent=2)
    print(f"[{name}] Saved metadata  → {meta_path}")


if __name__ == "__main__":
    targets = sys.argv[1:] if len(sys.argv) > 1 else list(DATASET_REGISTRY.keys())
    for name in targets:
        if name not in DATASET_REGISTRY:
            print(f"Unknown dataset: {name}. Skipping.")
            continue
        precompute(name)
    print("\n✅ Precomputation complete!")
