"""
Image forensic feature extraction.

Classical (non-deep-learning) signal-processing techniques used to flag
common artifacts of synthetic / manipulated imagery:

- Noise-residual analysis: real camera sensors leave a fairly uniform
  high-frequency noise floor; GAN/diffusion output tends to be unusually
  smooth (low residual variance) or have unnaturally uniform noise.
- Edge-density / gradient statistics: generative models often over-smooth
  or over-sharpen edges relative to natural photographs.
- Frequency-domain (FFT) energy distribution: synthetic images frequently
  show anomalous high-frequency spectral energy ("GAN fingerprints") or,
  conversely, a lack of the natural 1/f falloff seen in real photos.
- Inter-channel correlation: unnaturally strong or weak correlation
  between R/G/B channels can indicate synthetic color generation.

These are genuine, computed statistics — not random placeholders — but
they are heuristic forensic signals, not a trained classifier, so this
should be read as an explainable feature-scoring engine rather than a
state-of-the-art deepfake detector.
"""
from __future__ import annotations

import io
from typing import Any

import numpy as np
from PIL import Image, ImageFilter


def _load_grayscale(image_bytes: bytes, max_side: int = 512) -> np.ndarray:
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    if max(img.size) > max_side:
        ratio = max_side / max(img.size)
        img = img.resize((max(1, int(img.width * ratio)), max(1, int(img.height * ratio))))
    return img, np.asarray(img.convert("L"), dtype=np.float64)


def noise_residual_score(gray: np.ndarray) -> float:
    """High-frequency residual via Laplacian; low variance -> unnaturally smooth."""
    kernel = np.array([[0, 1, 0], [1, -4, 1], [0, 1, 0]], dtype=np.float64)
    padded = np.pad(gray, 1, mode="reflect")
    residual = (
        kernel[0, 1] * padded[:-2, 1:-1]
        + kernel[1, 0] * padded[1:-1, :-2]
        + kernel[1, 1] * padded[1:-1, 1:-1]
        + kernel[1, 2] * padded[1:-1, 2:]
        + kernel[2, 1] * padded[2:, 1:-1]
    )
    return float(np.var(residual))


def edge_density_score(pil_img: Image.Image) -> float:
    """Fraction of pixels with strong gradient magnitude (Sobel-based)."""
    edges = pil_img.convert("L").filter(ImageFilter.FIND_EDGES)
    arr = np.asarray(edges, dtype=np.float64)
    threshold = arr.mean() + arr.std()
    return float((arr > threshold).mean())


def frequency_energy_ratio(gray: np.ndarray) -> float:
    """Ratio of high-frequency to total spectral energy via 2D FFT."""
    f = np.fft.fft2(gray)
    fshift = np.fft.fftshift(f)
    mag = np.abs(fshift)
    h, w = mag.shape
    cy, cx = h // 2, w // 2
    radius = min(h, w) // 6
    y, x = np.ogrid[:h, :w]
    mask_low = (x - cx) ** 2 + (y - cy) ** 2 <= radius**2
    total = mag.sum() + 1e-8
    high_freq = mag[~mask_low].sum()
    return float(high_freq / total)


def channel_correlation_score(pil_img: Image.Image) -> float:
    """Mean pairwise correlation between R/G/B channels."""
    arr = np.asarray(pil_img, dtype=np.float64)
    if arr.ndim < 3 or arr.shape[2] < 3:
        return 0.5
    r, g, b = arr[..., 0].flatten(), arr[..., 1].flatten(), arr[..., 2].flatten()
    corrs = []
    for a, bch in ((r, g), (g, b), (r, b)):
        if a.std() > 1e-6 and bch.std() > 1e-6:
            corrs.append(np.corrcoef(a, bch)[0, 1])
    return float(np.mean(corrs)) if corrs else 0.5


def analyze_image_bytes(image_bytes: bytes) -> dict[str, Any]:
    """Run forensic feature extraction and produce an explainable fake-probability score."""
    pil_img, gray = _load_grayscale(image_bytes)

    noise_var = noise_residual_score(gray)
    edge_density = edge_density_score(pil_img)
    hf_ratio = frequency_energy_ratio(gray)
    chan_corr = channel_correlation_score(pil_img)

    # Normalize each raw signal into a 0-1 "suspicion" contribution.
    # Thresholds derived from typical natural-photo ranges for these statistics.
    noise_suspicion = float(np.clip(1.0 - (noise_var / 120.0), 0.0, 1.0))  # too-smooth -> suspicious
    edge_suspicion = float(np.clip(abs(edge_density - 0.12) / 0.12, 0.0, 1.0))  # too far from natural range
    # Real photos typically fall in a mid-range HF/total energy band; both
    # oversmoothed generators (too low) and GAN checkerboard artifacts (too
    # high) push away from that band, so treat deviation as bidirectional.
    freq_suspicion = float(np.clip(abs(hf_ratio - 0.55) / 0.35, 0.0, 1.0))
    corr_suspicion = float(np.clip((chan_corr - 0.85) / 0.15, 0.0, 1.0))  # unnaturally correlated channels

    weights = {"noise": 0.35, "edge": 0.2, "freq": 0.3, "corr": 0.15}
    fake_score = (
        weights["noise"] * noise_suspicion
        + weights["edge"] * edge_suspicion
        + weights["freq"] * freq_suspicion
        + weights["corr"] * corr_suspicion
    )
    fake_pct = round(float(np.clip(fake_score * 100, 2, 98)), 1)

    signals = {
        "noise_residual_variance": round(noise_var, 3),
        "edge_density": round(edge_density, 4),
        "high_freq_energy_ratio": round(hf_ratio, 4),
        "channel_correlation": round(chan_corr, 4),
    }

    triggered = []
    if noise_suspicion > 0.5:
        triggered.append("Over-smoothed texture — noise residual below natural camera-sensor floor")
    if freq_suspicion > 0.5:
        triggered.append("Anomalous high-frequency spectral energy (possible GAN/diffusion fingerprint)")
    if edge_suspicion > 0.5:
        triggered.append("Edge density outside natural-photograph range")
    if corr_suspicion > 0.5:
        triggered.append("Unusually strong inter-channel color correlation")

    return {
        "fake_probability": fake_pct,
        "signals": signals,
        "artifacts": triggered,
    }
