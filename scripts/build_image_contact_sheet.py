"""Build labeled contact sheets for visual review of extracted document media."""

from __future__ import annotations

import argparse
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


def natural_key(path: Path) -> tuple[str, int]:
    digits = "".join(character for character in path.stem if character.isdigit())
    prefix = path.stem[: -len(digits)] if digits else path.stem
    return prefix, int(digits or 0)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--per-sheet", type=int, default=15)
    args = parser.parse_args()

    paths = sorted(
        [
            path
            for path in args.source.iterdir()
            if path.suffix.lower() in {".png", ".jpg", ".jpeg", ".webp"}
        ],
        key=natural_key,
    )
    args.output.mkdir(parents=True, exist_ok=True)

    columns = 3
    cell_width, cell_height = 420, 310
    label_height = 30
    font = ImageFont.load_default(size=18)

    for sheet_index in range(math.ceil(len(paths) / args.per_sheet)):
        batch = paths[
            sheet_index * args.per_sheet : (sheet_index + 1) * args.per_sheet
        ]
        rows = math.ceil(len(batch) / columns)
        sheet = Image.new(
            "RGB", (columns * cell_width, rows * cell_height), "#eeeeee"
        )
        draw = ImageDraw.Draw(sheet)
        for item_index, path in enumerate(batch):
            image = Image.open(path).convert("RGB")
            image.thumbnail((cell_width - 20, cell_height - label_height - 20))
            column = item_index % columns
            row = item_index // columns
            x = column * cell_width + (cell_width - image.width) // 2
            y = row * cell_height + label_height + 10
            sheet.paste(image, (x, y))
            draw.text(
                (column * cell_width + 10, row * cell_height + 7),
                f"{path.name} ({Image.open(path).width}x{Image.open(path).height})",
                fill="black",
                font=font,
            )
        sheet.save(args.output / f"contact-sheet-{sheet_index + 1}.jpg", quality=90)


if __name__ == "__main__":
    main()
