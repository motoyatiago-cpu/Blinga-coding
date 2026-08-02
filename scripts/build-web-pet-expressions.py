from __future__ import annotations

from pathlib import Path

import cv2
import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
POSE_DIR = ROOT / "public" / "web-pet" / "robot" / "poses"
OUTPUT_DIR = ROOT / "public" / "web-pet" / "robot" / "expressions"
TARGET_SCREEN = (105, 129, 217, 211)

SOURCE_SCREENS = {
    "half-blink": ("thinking", (98, 136, 220, 220)),
    "closed": ("sleep", (43, 162, 181, 236)),
    "curious": ("curious", (91, 130, 222, 214)),
    "surprised": ("surprised", (82, 144, 203, 230)),
    "amazed": ("amazed", (93, 130, 212, 216)),
}
SLEEP_EYE_CROP = (42, 186, 170, 244)
SLEEP_EYE_OFFSET_Y = -36


def load_rgba(name: str) -> Image.Image:
    return Image.open(POSE_DIR / f"{name}.webp").convert("RGBA")


def target_face_mask(idle: Image.Image) -> Image.Image:
    pixels = np.array(idle)
    red, green, blue, alpha = [pixels[:, :, index] for index in range(4)]
    dark = (
        (alpha > 80)
        & (red < 28)
        & (green < 60)
        & (blue < 112)
    ).astype(np.uint8)

    x1, y1, x2, y2 = TARGET_SCREEN
    region = dark[y1:y2, x1:x2]
    contours, _ = cv2.findContours(region, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        raise RuntimeError("Unable to detect the native idle face screen")

    largest = max(contours, key=cv2.contourArea)
    hull = cv2.convexHull(largest)
    filled = np.zeros_like(region)
    cv2.fillConvexPoly(filled, hull, 255)
    filled = cv2.dilate(filled, np.ones((3, 3), dtype=np.uint8), iterations=1)

    mask = Image.new("L", idle.size, 0)
    mask.paste(Image.fromarray(filled), (x1, y1))
    return mask


def clean_alpha(image: Image.Image) -> Image.Image:
    pixels = np.array(image)
    alpha = pixels[:, :, 3]
    alpha[alpha < 24] = 0
    pixels[:, :, 3] = alpha
    return Image.fromarray(pixels)


def native_sleep_eyes() -> Image.Image:
    x1, y1, x2, y2 = TARGET_SCREEN
    eyes = load_rgba("sleep").crop(SLEEP_EYE_CROP).resize(
        (x2 - x1, y2 - y1),
        Image.Resampling.LANCZOS,
    )
    pixels = np.array(eyes)
    cyan = (
        (pixels[:, :, 3] > 80)
        & (pixels[:, :, 0] < 140)
        & (pixels[:, :, 1] > 100)
        & (pixels[:, :, 2] > 150)
    )
    pixels[:, :, 3] = np.where(cyan, pixels[:, :, 3], 0)
    return Image.fromarray(pixels)


def build_expression_images() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    idle = clean_alpha(load_rgba("idle"))
    idle.save(OUTPUT_DIR / "idle.webp", format="WEBP", lossless=True, method=6)
    mask = target_face_mask(idle)

    x1, y1, x2, y2 = TARGET_SCREEN
    target_size = (x2 - x1, y2 - y1)

    for expression, (source_name, source_box) in SOURCE_SCREENS.items():
        source_face = load_rgba(source_name).crop(source_box).resize(
            target_size,
            Image.Resampling.LANCZOS,
        )
        composed = idle.copy()
        face_layer = Image.new("RGBA", idle.size, (0, 0, 0, 0))
        face_layer.alpha_composite(source_face, (x1, y1))
        composed = Image.composite(face_layer, composed, mask)
        if expression == "closed":
            composed.alpha_composite(native_sleep_eyes(), (x1, y1 + SLEEP_EYE_OFFSET_Y))
        clean_alpha(composed).save(
            OUTPUT_DIR / f"{expression}.webp",
            format="WEBP",
            lossless=True,
            method=6,
        )

    print(f"Generated {len(SOURCE_SCREENS) + 1} native expression frames in {OUTPUT_DIR}")


if __name__ == "__main__":
    build_expression_images()
