"""Tests for app.ml_features — synthetic image forensics.

Uses PIL to programmatically generate two classes of test images:

- "camera-like": gradient base + per-pixel Gaussian noise, approximating
  the sensor noise floor of a real photograph.
- "generator-like": flat/blocky color regions with no noise, approximating
  the over-smoothed output of many GAN/diffusion pipelines.

These are of course simplified proxies for real photographs and real
generated images — the point of these tests is to verify the feature
extraction pipeline is deterministic, numerically stable, and responds
sensibly to the signal properties it claims to measure, not to certify
real-world deepfake detection accuracy.
"""
from __future__ import annotations

import io

import numpy as np
import pytest
from PIL import Image

from app.ml_features import (
    analyze_image_bytes,
    channel_correlation_score,
    edge_density_score,
    frequency_energy_ratio,
    noise_residual_score,
)


def _camera_like_image(size: int = 256, noise_std: float = 8.0, seed: int = 0) -> bytes:
    rng = np.random.default_rng(seed)
    base = np.zeros((size, size, 3), dtype=np.float64)
    for i in range(size):
        base[i, :, 0] = 90 + i * (60 / size)
        base[i, :, 1] = 70 + i * (50 / size)
        base[i, :, 2] = 110 + i * (40 / size)
    noisy = np.clip(base + rng.normal(0, noise_std, base.shape), 0, 255).astype("uint8")
    buf = io.BytesIO()
    Image.fromarray(noisy).save(buf, format="PNG")
    return buf.getvalue()


def _flat_blocky_image(size: int = 256) -> bytes:
    arr = np.full((size, size, 3), (150, 120, 170), dtype="uint8")
    third = size // 3
    arr[third : 2 * third, third : 2 * third] = (200, 190, 220)
    buf = io.BytesIO()
    Image.fromarray(arr).save(buf, format="PNG")
    return buf.getvalue()


class TestFeatureExtractionDeterminism:
    def test_same_bytes_produce_same_result(self):
        img = _camera_like_image()
        r1 = analyze_image_bytes(img)
        r2 = analyze_image_bytes(img)
        assert r1 == r2

    def test_output_shape(self):
        result = analyze_image_bytes(_camera_like_image())
        assert set(result.keys()) == {"fake_probability", "signals", "artifacts"}
        assert set(result["signals"].keys()) == {
            "noise_residual_variance",
            "edge_density",
            "high_freq_energy_ratio",
            "channel_correlation",
        }

    def test_fake_probability_is_bounded(self):
        for img in (_camera_like_image(), _flat_blocky_image()):
            result = analyze_image_bytes(img)
            assert 0 <= result["fake_probability"] <= 100


class TestIndividualSignals:
    def test_noise_residual_higher_with_more_noise(self):
        low_noise = _camera_like_image(noise_std=2.0)
        high_noise = _camera_like_image(noise_std=20.0)
        _, gray_low = _rgb_and_gray(low_noise)
        _, gray_high = _rgb_and_gray(high_noise)
        assert noise_residual_score(gray_high) > noise_residual_score(gray_low)

    def test_flat_image_has_near_zero_noise_residual(self):
        _, gray = _rgb_and_gray(_flat_blocky_image())
        # A flat region should contribute far less residual variance than
        # a comparably-sized noisy natural image.
        _, gray_noisy = _rgb_and_gray(_camera_like_image(noise_std=15.0))
        assert noise_residual_score(gray) < noise_residual_score(gray_noisy)

    def test_edge_density_within_unit_range(self):
        for img_bytes in (_camera_like_image(), _flat_blocky_image()):
            pil_img, _ = _rgb_and_gray(img_bytes)
            density = edge_density_score(pil_img)
            assert 0.0 <= density <= 1.0

    def test_frequency_energy_ratio_within_unit_range(self):
        for img_bytes in (_camera_like_image(), _flat_blocky_image()):
            _, gray = _rgb_and_gray(img_bytes)
            ratio = frequency_energy_ratio(gray)
            assert 0.0 <= ratio <= 1.0

    def test_channel_correlation_high_for_uniform_color_block(self):
        # A flat, single-hue block has perfectly correlated channels.
        pil_img, _ = _rgb_and_gray(_flat_blocky_image())
        corr = channel_correlation_score(pil_img)
        assert corr > 0.9

    def test_channel_correlation_bounded(self):
        for img_bytes in (_camera_like_image(), _flat_blocky_image()):
            pil_img, _ = _rgb_and_gray(img_bytes)
            corr = channel_correlation_score(pil_img)
            assert -1.0 <= corr <= 1.0


class TestArtifactReporting:
    def test_artifacts_only_reported_when_suspicion_triggered(self):
        result = analyze_image_bytes(_flat_blocky_image())
        for artifact in result["artifacts"]:
            assert isinstance(artifact, str) and len(artifact) > 0

    def test_grayscale_image_does_not_crash(self):
        arr = np.full((128, 128), 128, dtype="uint8")
        buf = io.BytesIO()
        Image.fromarray(arr, mode="L").save(buf, format="PNG")
        result = analyze_image_bytes(buf.getvalue())
        assert "fake_probability" in result

    def test_tiny_image_does_not_crash(self):
        arr = np.random.default_rng(1).integers(0, 255, (8, 8, 3), dtype="uint8")
        buf = io.BytesIO()
        Image.fromarray(arr).save(buf, format="PNG")
        result = analyze_image_bytes(buf.getvalue())
        assert "fake_probability" in result


def _rgb_and_gray(image_bytes: bytes):
    from app.ml_features import _load_grayscale

    return _load_grayscale(image_bytes)


if __name__ == "__main__":
    raise SystemExit(pytest.main([__file__, "-v"]))
