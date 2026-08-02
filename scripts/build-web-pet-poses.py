from __future__ import annotations

from pathlib import Path

import cv2
import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
ATLAS_PATH = ROOT / "public" / "web-pet" / "robot" / "pose-atlas.webp"
OUTPUT_DIR = ROOT / "public" / "web-pet" / "robot" / "poses"
CANVAS_SIZE = 320
INNER_SIZE = 288
MAIN_COMPONENT_AREA = 10_000
MIN_DECORATION_AREA = 40

POSE_NAMES = [
    "idle",
    "wave",
    "sit",
    "cheer",
    "curious",
    "coding",
    "thinking",
    "sleep",
    "snack",
    "sparkle",
    "sad",
    "cry",
    "angry",
    "surprised",
    "turn",
    "love",
    "dance",
    "celebrate",
    "bored",
    "amazed",
]


def rectangle_distance(point: tuple[float, float], rectangle: np.ndarray) -> float:
    x, y = point
    left, top, width, height = rectangle[:4]
    right = left + width
    bottom = top + height
    dx = max(left - x, 0, x - right)
    dy = max(top - y, 0, y - bottom)
    return float(dx * dx + dy * dy)


def ordered_main_components(
    stats: np.ndarray,
    centroids: np.ndarray,
) -> list[int]:
    main = [
        index
        for index in range(1, len(stats))
        if stats[index, cv2.CC_STAT_AREA] >= MAIN_COMPONENT_AREA
    ]
    if len(main) != len(POSE_NAMES):
        raise RuntimeError(
            f"Expected {len(POSE_NAMES)} robot components, found {len(main)}"
        )

    by_row = sorted(main, key=lambda index: centroids[index][1])
    ordered: list[int] = []
    for row_start in range(0, len(by_row), 5):
        row = by_row[row_start : row_start + 5]
        ordered.extend(sorted(row, key=lambda index: centroids[index][0]))
    return ordered


def build_pose_images() -> None:
    source_bytes = np.fromfile(ATLAS_PATH, dtype=np.uint8)
    source = cv2.imdecode(source_bytes, cv2.IMREAD_UNCHANGED)
    if source is None or source.shape[2] != 4:
        raise RuntimeError(f"Unable to read transparent atlas: {ATLAS_PATH}")

    alpha_mask = (source[:, :, 3] > 32).astype(np.uint8)
    count, labels, stats, centroids = cv2.connectedComponentsWithStats(
        alpha_mask,
        connectivity=8,
    )
    main_components = ordered_main_components(stats, centroids)
    groups: dict[int, list[int]] = {
        main_index: [main_index] for main_index in main_components
    }

    for component in range(1, count):
        if component in groups:
            continue
        if stats[component, cv2.CC_STAT_AREA] < MIN_DECORATION_AREA:
            continue

        center = tuple(float(value) for value in centroids[component])
        owner = min(
            main_components,
            key=lambda main_index: rectangle_distance(center, stats[main_index]),
        )
        groups[owner].append(component)

    rgba = cv2.cvtColor(source, cv2.COLOR_BGRA2RGBA)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    for pose_name, main_component in zip(POSE_NAMES, main_components, strict=True):
        component_ids = np.asarray(groups[main_component], dtype=labels.dtype)
        pose_mask = np.isin(labels, component_ids)
        ys, xs = np.nonzero(pose_mask)
        left, right = int(xs.min()), int(xs.max()) + 1
        top, bottom = int(ys.min()), int(ys.max()) + 1

        crop = rgba[top:bottom, left:right].copy()
        crop[:, :, 3] = np.where(
            pose_mask[top:bottom, left:right],
            crop[:, :, 3],
            0,
        )

        main_height = int(stats[main_component, cv2.CC_STAT_HEIGHT])
        target_main_height = 254
        scale = min(
            target_main_height / main_height,
            INNER_SIZE / crop.shape[1],
            INNER_SIZE / crop.shape[0],
        )
        target_width = max(1, round(crop.shape[1] * scale))
        target_height = max(1, round(crop.shape[0] * scale))

        pose_image = Image.fromarray(crop).resize(
            (target_width, target_height),
            Image.Resampling.LANCZOS,
        )
        canvas = Image.new("RGBA", (CANVAS_SIZE, CANVAS_SIZE), (0, 0, 0, 0))
        x = (CANVAS_SIZE - target_width) // 2
        y = CANVAS_SIZE - 16 - target_height
        canvas.alpha_composite(pose_image, (x, y))
        canvas.save(
            OUTPUT_DIR / f"{pose_name}.webp",
            format="WEBP",
            lossless=True,
            method=6,
        )

    print(f"Generated {len(POSE_NAMES)} isolated poses in {OUTPUT_DIR}")


if __name__ == "__main__":
    build_pose_images()
