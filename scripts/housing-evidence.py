"""원본 치수선과 모델 오버레이를 작업 공간에 렌더한다."""
import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tmp/pdf-tools"))
import pymupdf
from PIL import Image, ImageDraw

parser = argparse.ArgumentParser()
parser.add_argument("layout")
parser.add_argument("--model", type=Path)
parser.add_argument("--origin", default="0,0")
parser.add_argument("--pad", type=float, default=70)
args = parser.parse_args()
catalog = json.loads((ROOT / "src/shared/api/housing-data/catalog.json").read_text(encoding="utf-8"))
prop, layout = next((p, l) for p in catalog for l in p["layouts"] if l["layoutKey"] == args.layout)
output = ROOT / "tmp/housing-review"
output.mkdir(parents=True, exist_ok=True)
if not args.model:
    xs, ys = zip(*layout["cropPolygon"])
    clip = pymupdf.Rect((min(xs)-args.pad)/1.3, (min(ys)-args.pad)/1.3,
                        (max(xs)+args.pad)/1.3, (max(ys)+args.pad)/1.3)
    with pymupdf.open(ROOT / "public" / prop["sourcePdf"].lstrip("/")) as doc:
        page = doc[layout["page"]-1]
        page.get_pixmap(matrix=pymupdf.Matrix(4, 4), clip=clip, alpha=False).save(output / f"pdf-{args.layout}.png")
        print(page.get_text(clip=clip))
else:
    model = json.loads(args.model.read_text(encoding="utf-8"))
    ox, oy = map(float, args.origin.split(","))
    scale = layout["mmPerPx"]
    image = Image.open(ROOT / "public" / layout["image2dUrl"].lstrip("/")).convert("RGB")
    draw = ImageDraw.Draw(image, "RGBA")
    def point(p):
        return (ox+p["x"]/scale, oy+p["z"]/scale)
    for room in model["rooms"]:
        draw.polygon([point(p) for p in room["polygon"]], fill=(255,186,23,40))
    walls = {wall["id"]: wall for wall in model["walls"]}
    for wall in walls.values():
        draw.line([point(wall["a"]), point(wall["b"])], fill=(220,0,0,220), width=2)
    for opening in model["openings"]:
        wall = walls[opening["wallId"]]
        dx, dz = wall["b"]["x"]-wall["a"]["x"], wall["b"]["z"]-wall["a"]["z"]
        length = (dx*dx+dz*dz)**0.5
        def along(t):
            return point({"x":wall["a"]["x"]+dx*t/length, "z":wall["a"]["z"]+dz*t/length})
        draw.line([along(opening["offsetMm"]), along(opening["offsetMm"]+opening["widthMm"])],
                  fill=(0,180,80,255) if opening["type"] == "door" else (0,100,255,255), width=4)
    image.save(output / f"overlay-{args.layout}.png")
print(output)
