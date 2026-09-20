from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1] / "assets" / "images"
files = ["icon.png", "splash-icon.png", "favicon.png", "android-icon-foreground.png"]

for filename in files:
    path = root / filename
    with Image.open(path) as source:
        image = source.convert("RGBA")
        image.thumbnail((512, 512), Image.Resampling.LANCZOS)
        image.save(path, format="PNG", optimize=True, compress_level=9)
