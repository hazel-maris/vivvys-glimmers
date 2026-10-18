
from pathlib import Path
import fitz

# ============================================================
# VIVVY'S GLIMMERS — PDF TO JPG
# ============================================================

PDF_FILE = Path("July 2026.pdf")
OUTPUT_DIR = Path("vivvy-memories")

OUTPUT_DIR.mkdir(exist_ok=True)

with fitz.open(PDF_FILE) as pdf:
    total = len(pdf)

    for index, page in enumerate(pdf, start=1):
        # Render at 1.5x resolution
        pix = page.get_pixmap(
            matrix=fitz.Matrix(1.5, 1.5),
            alpha=False
        )

        output = OUTPUT_DIR / f"memory-{index:03d}.jpg"

        pix.save(
            str(output),
            jpg_quality=85
        )

        print(f"Converted {index}/{total}")

print(f"\nDone! {total} memories converted.")
