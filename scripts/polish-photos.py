#!/usr/bin/env python3
"""
polish-photos.py - batch-polish product photos into consistent 4:5 web images.

WHAT THIS DOES
  One crop ratio, one colour treatment, one output size, for every image. That
  consistency is most of what makes a grid of photos read as a shop instead of
  a camera roll.

WHAT THIS DOES NOT DO
  Invent studio lighting or replace backgrounds. That needs a diffusion model,
  and this machine cannot run one: Intel HD 520 (no CUDA), ~2 GB free RAM, a
  2016 dual-core i7-6600U. A model big enough to relight a portrait will not
  load, and CPU inference would be minutes-to-hours per image. The honest
  alternatives, cheapest first:

    1. Reshoot against a backdrop with two LED panels. The dress photo already
       has good light and pose; it is the banana trees behind her that say
       "garden". This is the real fix and it is cheap.
    2. A human retoucher (Fiverr, ~$5-15/image) doing subject extraction and
       studio compositing in Photoshop. This works, because they composite your
       REAL subject rather than generating a fake one.
    3. Cloud AI (Photoroom, Clipdrop, Runway). Runs on their GPUs, costs money,
       uploads your images. Usually looks worse than (2).

USAGE
  python3 scripts/polish-photos.py RAW_DIR OUT_DIR
  python3 scripts/polish-photos.py RAW_DIR OUT_DIR --anchor center
  python3 scripts/polish-photos.py RAW_DIR OUT_DIR --no-grade --also-jpg
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageOps

# Portrait 4:5, matching the ProductCard image frame (aspect-[4/5]).
TARGET_RATIO = 4 / 5

IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff", ".bmp"}


def _lut(lift: float = 0.0, gamma: float = 1.0) -> list[int]:
    """256-entry lookup table: optional gamma bend plus a black-floor lift.

    gamma < 1 brightens, gamma > 1 darkens. `lift` raises the black point,
    which is the film-like fade that keeps a warm grade from going muddy.
    """
    table = []
    for i in range(256):
        x = i / 255.0
        if gamma != 1.0:
            x = x ** gamma
        x = lift + (1.0 - lift) * x
        table.append(int(round(max(0.0, min(1.0, x)) * 255)))
    return table


def crop_to_ratio(img: Image.Image, ratio: float, anchor: str) -> Image.Image:
    """Crop to an exact aspect ratio, holding the frame at `anchor`.

    anchor='top' is the default because these are portrait fashion shots and
    the head is near the top of frame; cropping from the bottom protects it.
    """
    w, h = img.size
    if w / h > ratio:
        new_w, new_h = int(round(h * ratio)), h
    else:
        new_w, new_h = w, int(round(w / ratio))

    left = (w - new_w) // 2
    if anchor == "top":
        top = 0
    elif anchor == "bottom":
        top = h - new_h
    else:
        top = (h - new_h) // 2

    return img.crop((left, top, left + new_w, top + new_h))


def warm_grade(img: Image.Image) -> Image.Image:
    """Warm editorial grade, tuned to sit under the champagne palette.

    Red lifted slightly, blue pulled slightly, gentle contrast and saturation.
    Deliberately subtle: a heavy grade fights the fabric colours, and the
    clothes are the product.
    """
    r, g, b = img.split()
    r = r.point(_lut(gamma=0.97))
    g = g.point(_lut(gamma=1.00))
    b = b.point(_lut(gamma=1.04))
    img = Image.merge("RGB", (r, g, b))
    img = ImageEnhance.Contrast(img).enhance(1.06)
    img = ImageEnhance.Color(img).enhance(1.05)
    return img


def vignette(img: Image.Image, strength: float = 0.18) -> Image.Image:
    """Subtle radial darkening at the corners. Editorial, not obvious."""
    w, h = img.size
    mask = Image.new("L", (w, h), 0)
    draw = ImageDraw.Draw(mask)
    inset_x, inset_y = int(w * 0.12), int(h * 0.12)
    draw.ellipse((-inset_x, -inset_y, w + inset_x, h + inset_y), fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(radius=max(w, h) * 0.12))
    dark = Image.new("RGB", (w, h), (0, 0, 0))
    return Image.composite(img, Image.blend(img, dark, strength), mask)


def polish(src: Path, dest: Path, args: argparse.Namespace) -> tuple[int, int]:
    img = Image.open(src)
    # Phone photos carry orientation in EXIF; without this, portrait shots
    # arrive sideways and get cropped against the wrong axis.
    img = ImageOps.exif_transpose(img)
    img = img.convert("RGB")

    img = crop_to_ratio(img, TARGET_RATIO, args.anchor)

    if args.width:
        target_h = int(round(args.width / TARGET_RATIO))
        img = img.resize((args.width, target_h), Image.LANCZOS)

    if not args.no_grade:
        img = warm_grade(img)
        # Unsharp AFTER resize, so it sharpens the final pixels rather than
        # artefacts the resampler is about to invent.
        img = img.filter(
            ImageFilter.UnsharpMask(radius=1.4, percent=88, threshold=4)
        )
        if args.vignette:
            img = vignette(img)

    dest.parent.mkdir(parents=True, exist_ok=True)
    img.save(dest, "WEBP", quality=args.quality, method=6)
    if args.also_jpg:
        img.save(dest.with_suffix(".jpg"), "JPEG", quality=args.quality, optimize=True)

    return img.size


def main() -> None:
    ap = argparse.ArgumentParser(
        description="Batch-polish product photos into 4:5 web images."
    )
    ap.add_argument("src", type=Path, help="folder of source photos")
    ap.add_argument("dest", type=Path, help="folder to write polished images into")
    ap.add_argument("--width", type=int, default=1200,
                    help="output width in px (default 1200, i.e. 1200x1500)")
    ap.add_argument("--quality", type=int, default=82,
                    help="webp/jpeg quality (default 82)")
    ap.add_argument("--anchor", choices=["top", "center", "bottom"], default="top",
                    help="where to hold the frame when cropping to 4:5 (default top)")
    ap.add_argument("--no-grade", action="store_true",
                    help="crop and resize only, no colour work")
    ap.add_argument("--vignette", action="store_true",
                    help="add a subtle editorial vignette")
    ap.add_argument("--also-jpg", action="store_true",
                    help="write a .jpg alongside each .webp")
    args = ap.parse_args()

    if not args.src.is_dir():
        sys.exit(f"not a folder: {args.src}")

    files = sorted(
        p for p in args.src.iterdir()
        if p.is_file() and p.suffix.lower() in IMAGE_SUFFIXES
    )
    if not files:
        sys.exit(f"no images in {args.src}")

    print(f"{len(files)} image(s) -> {args.dest}")
    ok = 0
    for p in files:
        out = args.dest / (p.stem + ".webp")
        try:
            size = polish(p, out, args)
            print(f"  {p.name:34s} -> {out.name:34s} {size[0]}x{size[1]}")
            ok += 1
        except Exception as exc:  # keep going; one bad file shouldn't stop a batch
            print(f"  {p.name:34s} FAILED: {exc}", file=sys.stderr)

    print(f"done: {ok}/{len(files)}")


if __name__ == "__main__":
    main()
