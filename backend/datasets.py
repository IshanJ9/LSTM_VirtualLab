"""
Benchmark dataset generators for LSTM Lab.
Each returns (x_seq, y_seq, metadata_dict).
"""
import numpy as np

TEXT_CORPUS = (
    "the lstm is a type of recurrent neural network that addresses "
    "the vanishing gradient problem and learns long range dependencies"
)


def generate_sine(n: int = 80):
    t = np.linspace(0, 4 * np.pi, n + 1)
    s = np.sin(t)
    x, y = (s[:-1] + 1) / 2, (s[1:] + 1) / 2
    return x, y, {
        "id": "sine",
        "name": "Sine Wave",
        "type": "Periodic Signal",
        "focus": "Short-term dependency learning",
        "description": "Pure sinusoidal signal. LSTM must learn periodicity and phase.",
        "color": "#00E5FF",
        "sequence_length": n,
    }


def generate_noisy(n: int = 80, noise_std: float = 0.12):
    np.random.seed(42)
    t = np.linspace(0, 4 * np.pi, n + 1)
    s = np.sin(t) + np.random.normal(0, noise_std, n + 1)
    x = np.clip((s[:-1] + 1.5) / 3, 0, 1)
    y = np.clip((s[1:] + 1.5) / 3, 0, 1)
    return x, y, {
        "id": "noisy",
        "name": "Noisy Signal",
        "type": "Robust Time Series",
        "focus": "Noise robustness and filtering",
        "description": "Sine wave corrupted with Gaussian noise (σ=0.12). Tests gate robustness.",
        "color": "#8B5CF6",
        "sequence_length": n,
    }


def generate_text(corpus: str = TEXT_CORPUS):
    chars = sorted(set(corpus))
    n_chars = len(chars)
    char_to_idx = {c: i for i, c in enumerate(chars)}
    encoded = [char_to_idx[c] for c in corpus]
    x_num = np.array(encoded[:-1], dtype=float) / max(n_chars - 1, 1)
    y_num = np.array(encoded[1:],  dtype=float) / max(n_chars - 1, 1)
    x_chars = list(corpus[:-1])
    y_chars = list(corpus[1:])
    return x_num, y_num, {
        "id": "text",
        "name": "Character Sequence",
        "type": "Symbolic Memory",
        "focus": "Sequential pattern and symbolic memory",
        "description": "Character-level text encoding. Both symbolic (char) and numeric (index/vocab_size) representations.",
        "color": "#F59E0B",
        "sequence_length": len(x_num),
        "char_vocab": chars,
        "x_chars": x_chars,
        "y_chars": y_chars,
    }


def generate_long_range(n: int = 80, delay: int = 10):
    np.random.seed(123)
    full = np.random.uniform(0.1, 0.9, n + delay)
    x_seq = full[delay:]     # n values
    y_seq = full[:n]         # n values (delayed by `delay` steps)
    return x_seq, y_seq, {
        "id": "long-range",
        "name": "Long-Range Dependency",
        "type": "Delayed Pattern",
        "focus": "Long-term memory retention",
        "description": f"Output equals input from {delay} steps ago. Tests LSTM long-term memory.",
        "color": "#10B981",
        "sequence_length": n,
        "delay": delay,
    }


DATASET_REGISTRY = {
    "sine":       generate_sine,
    "noisy":      generate_noisy,
    "text":       generate_text,
    "long-range": generate_long_range,
}
