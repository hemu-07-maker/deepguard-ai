"""
Threshold calibration & evaluation harness for the forensic detection pipeline.

Generates a labeled synthetic dataset (camera-like = REAL, generator-like =
FAKE, plus intermediate/ambiguous cases), runs every image through
`app.ml_features.analyze_image_bytes`, and reports standard binary
classification metrics (precision, recall, F1, confusion matrix) at the
pipeline's current 55% decision threshold. Also sweeps a range of
thresholds to show how precision/recall trade off, which is useful for
tuning `is_fake = fake_pct >= 55` in `app/detection.py`.

This is a synthetic-data sanity check, not a validation against real
photographs or real generative-model output — see the module docstring in
`app/ml_features.py` for that caveat. Its purpose is to make the pipeline's
behavior measurable and its threshold choice defensible, rather than
tuned by eyeballing a couple of examples.

Usage:
    python -m scripts.evaluate_pipeline
    python -m scripts.evaluate_pipeline --n-per-class 40 --seed 7
"""
from __future__ import annotations

import argparse
import io
import json
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from app.ml_features import analyze_image_bytes  # noqa: E402


# --------------------------------------------------------------------------
# Synthetic dataset generation
# --------------------------------------------------------------------------

def _to_png_bytes(arr: np.ndarray) -> bytes:
    buf = io.BytesIO()
    Image.fromarray(arr.astype("uint8")).save(buf, format="PNG")
    return buf.getvalue()


def make_real_image(size: int, rng: np.random.Generator) -> bytes:
    """Camera-like: gradient base + realistic sensor noise. Label: REAL."""
    base = np.zeros((size, size, 3), dtype=np.float64)
    r0, g0, b0 = rng.uniform(60, 140, 3)
    for i in range(size):
        t = i / size
        base[i, :, 0] = r0 + t * rng.uniform(30, 70)
        base[i, :, 1] = g0 + t * rng.uniform(20, 60)
        base[i, :, 2] = b0 + t * rng.uniform(10, 50)
    noise_std = rng.uniform(6, 14)
    noisy = np.clip(base + rng.normal(0, noise_std, base.shape), 0, 255)
    return _to_png_bytes(noisy)


def make_fake_image(size: int, rng: np.random.Generator) -> bytes:
    """Generator-like: flat/blocky regions, minimal noise. Label: FAKE."""
    base_color = rng.uniform(80, 220, 3)
    arr = np.tile(base_color, (size, size, 1))
    n_blocks = rng.integers(2, 5)
    for _ in range(n_blocks):
        x0, y0 = rng.integers(0, size - 20, 2)
        w, h = rng.integers(20, size // 2, 2)
        block_color = rng.uniform(80, 220, 3)
        arr[y0 : y0 + h, x0 : x0 + w] = block_color
    return _to_png_bytes(arr)


def make_ambiguous_image(size: int, rng: np.random.Generator) -> bytes:
    """Blended case: some noise, some flat regions — harder to classify."""
    base = np.full((size, size, 3), rng.uniform(90, 180, 3), dtype=np.float64)
    third = size // 3
    base[third : 2 * third, third : 2 * third] = rng.uniform(90, 180, 3)
    noise_std = rng.uniform(1, 5)
    noisy = np.clip(base + rng.normal(0, noise_std, base.shape), 0, 255)
    return _to_png_bytes(noisy)


@dataclass
class DatasetItem:
    image_bytes: bytes
    label: str  # "REAL" or "FAKE"


def build_dataset(n_per_class: int, seed: int, size: int = 128) -> list[DatasetItem]:
    rng = np.random.default_rng(seed)
    items: list[DatasetItem] = []
    for _ in range(n_per_class):
        items.append(DatasetItem(make_real_image(size, rng), "REAL"))
        items.append(DatasetItem(make_fake_image(size, rng), "FAKE"))
    # Ambiguous cases are labeled by which side of 50 their construction
    # leans toward noise (REAL-ish) vs. flatness (FAKE-ish); here we treat
    # them all as FAKE since they're built from flat base regions.
    for _ in range(max(1, n_per_class // 4)):
        items.append(DatasetItem(make_ambiguous_image(size, rng), "FAKE"))
    rng.shuffle(items)  # type: ignore[arg-type]
    return items


# --------------------------------------------------------------------------
# Evaluation
# --------------------------------------------------------------------------

@dataclass
class EvalResult:
    threshold: float
    tp: int = 0
    fp: int = 0
    tn: int = 0
    fn: int = 0

    @property
    def precision(self) -> float:
        denom = self.tp + self.fp
        return self.tp / denom if denom else 0.0

    @property
    def recall(self) -> float:
        denom = self.tp + self.fn
        return self.tp / denom if denom else 0.0

    @property
    def f1(self) -> float:
        p, r = self.precision, self.recall
        return 2 * p * r / (p + r) if (p + r) else 0.0

    @property
    def accuracy(self) -> float:
        total = self.tp + self.fp + self.tn + self.fn
        return (self.tp + self.tn) / total if total else 0.0

    def to_dict(self) -> dict[str, Any]:
        return {
            "threshold": self.threshold,
            "confusion_matrix": {"tp": self.tp, "fp": self.fp, "tn": self.tn, "fn": self.fn},
            "precision": round(self.precision, 4),
            "recall": round(self.recall, 4),
            "f1": round(self.f1, 4),
            "accuracy": round(self.accuracy, 4),
        }


def score_dataset(dataset: list[DatasetItem]) -> list[tuple[str, float]]:
    """Returns (true_label, fake_probability) for every item."""
    scored = []
    for item in dataset:
        result = analyze_image_bytes(item.image_bytes)
        scored.append((item.label, result["fake_probability"]))
    return scored


def evaluate_at_threshold(scored: list[tuple[str, float]], threshold: float) -> EvalResult:
    res = EvalResult(threshold=threshold)
    for true_label, fake_pct in scored:
        predicted_fake = fake_pct >= threshold
        actual_fake = true_label == "FAKE"
        if predicted_fake and actual_fake:
            res.tp += 1
        elif predicted_fake and not actual_fake:
            res.fp += 1
        elif not predicted_fake and actual_fake:
            res.fn += 1
        else:
            res.tn += 1
    return res


def sweep_thresholds(scored: list[tuple[str, float]], thresholds: list[float]) -> list[EvalResult]:
    return [evaluate_at_threshold(scored, t) for t in thresholds]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--n-per-class", type=int, default=25)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--current-threshold", type=float, default=55.0)
    parser.add_argument("--output", type=str, default=None, help="Optional path to write JSON results")
    args = parser.parse_args()

    dataset = build_dataset(args.n_per_class, args.seed)
    scored = score_dataset(dataset)

    current = evaluate_at_threshold(scored, args.current_threshold)
    sweep_points = [10, 20, 30, 40, 50, 55, 60, 70, 80, 90]
    sweep = sweep_thresholds(scored, sweep_points)

    print(f"Dataset size: {len(dataset)} images")
    print(f"\n=== Metrics at current threshold ({args.current_threshold}%) ===")
    for k, v in current.to_dict().items():
        print(f"  {k}: {v}")

    print("\n=== Threshold sweep ===")
    print(f"{'thresh':>7} {'prec':>7} {'recall':>7} {'f1':>7} {'acc':>7}")
    for r in sweep:
        print(f"{r.threshold:7.0f} {r.precision:7.3f} {r.recall:7.3f} {r.f1:7.3f} {r.accuracy:7.3f}")

    if args.output:
        out = {
            "dataset_size": len(dataset),
            "current_threshold_metrics": current.to_dict(),
            "threshold_sweep": [r.to_dict() for r in sweep],
        }
        Path(args.output).write_text(json.dumps(out, indent=2))
        print(f"\nResults written to {args.output}")


if __name__ == "__main__":
    main()
