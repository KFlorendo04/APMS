"""Extract a DOCX's complete readable structure for source analysis.

This helper preserves document order for paragraphs and tables and inventories
the package's drawings, relationships, comments, notes, and revision markup.
It is intentionally read-only with respect to the source document.
"""

from __future__ import annotations

import argparse
import json
import zipfile
from pathlib import Path

from docx import Document
from docx.table import Table
from docx.text.paragraph import Paragraph


def iter_block_items(document: Document):
    """Yield paragraphs and tables in their document order."""
    body = document.element.body
    for child in body.iterchildren():
        if child.tag.endswith("}p"):
            yield Paragraph(child, document)
        elif child.tag.endswith("}tbl"):
            yield Table(child, document)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path)
    parser.add_argument("--markdown", type=Path, required=True)
    parser.add_argument("--inventory", type=Path, required=True)
    args = parser.parse_args()

    document = Document(args.input)
    lines: list[str] = []
    paragraph_count = 0
    table_count = 0

    for block in iter_block_items(document):
        if isinstance(block, Paragraph):
            paragraph_count += 1
            text = block.text.strip()
            image_targets: list[str] = []
            for relationship_id in block._p.xpath(".//a:blip/@r:embed"):
                relationship = document.part.rels.get(relationship_id)
                if relationship is not None:
                    image_targets.append(str(relationship.target_ref))
            image_descriptions = block._p.xpath(".//wp:docPr/@descr")
            for index, target in enumerate(image_targets):
                description = (
                    image_descriptions[index]
                    if index < len(image_descriptions) and image_descriptions[index]
                    else ""
                )
                suffix = f' alt="{description}"' if description else ""
                lines.append(f"[EMBEDDED IMAGE: {target}{suffix}]")
            if not text:
                continue
            style = block.style.name if block.style else ""
            if style.startswith("Heading"):
                try:
                    level = int(style.rsplit(" ", 1)[1])
                except (IndexError, ValueError):
                    level = 2
                lines.append(f"{'#' * min(max(level, 1), 6)} {text}")
            else:
                lines.append(text)
        else:
            table_count += 1
            lines.append(f"\n<!-- TABLE {table_count} -->")
            for row in block.rows:
                cells = [cell.text.replace("\n", " / ").strip() for cell in row.cells]
                lines.append(" | ".join(cells))
            lines.append(f"<!-- END TABLE {table_count} -->\n")

    args.markdown.parent.mkdir(parents=True, exist_ok=True)
    args.markdown.write_text("\n\n".join(lines), encoding="utf-8")

    with zipfile.ZipFile(args.input) as archive:
        names = archive.namelist()
        document_xml = archive.read("word/document.xml")
        package_inventory = {
            "source": str(args.input.resolve()),
            "paragraphs": paragraph_count,
            "tables": table_count,
            "sections": len(document.sections),
            "inline_shapes": len(document.inline_shapes),
            "package_files": len(names),
            "media": [name for name in names if name.startswith("word/media/")],
            "charts": [name for name in names if name.startswith("word/charts/")],
            "diagrams": [name for name in names if name.startswith("word/diagrams/")],
            "embeddings": [name for name in names if name.startswith("word/embeddings/")],
            "headers": [name for name in names if name.startswith("word/header")],
            "footers": [name for name in names if name.startswith("word/footer")],
            "has_comments": "word/comments.xml" in names,
            "has_footnotes": "word/footnotes.xml" in names,
            "has_endnotes": "word/endnotes.xml" in names,
            "tracked_insertions": document_xml.count(b"<w:ins"),
            "tracked_deletions": document_xml.count(b"<w:del"),
        }

    args.inventory.write_text(
        json.dumps(package_inventory, indent=2), encoding="utf-8"
    )


if __name__ == "__main__":
    main()
