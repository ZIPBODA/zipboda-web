import sharp from "sharp";
import { mkdir, stat } from "node:fs/promises";

// 원본 마감재 사진(수 MB, 비 seamless)을 뷰어용 타일로 가공한다.
// 2×2 미러 배치는 네 변이 모두 연속되어 반복 시 이음새가 생기지 않는다(줄무늬·판재 이음 모두 대칭 반복).
const TILE_PX = 1024;
const QUARTER_PX = TILE_PX / 2;
const JPEG_QUALITY = 80;
const OUT_DIR = "public/textures";

const SOURCES = [
  { src: "public/mock/wallpaper-texture.jpg", out: `${OUT_DIR}/wallpaper.jpg` },
  { src: "public/mock/flooring-texture.jpg", out: `${OUT_DIR}/flooring.jpg` }
];

async function buildTile({ src, out }) {
  const quarter = await sharp(src).resize(QUARTER_PX, QUARTER_PX, { fit: "cover", position: "centre" }).toBuffer();
  const flop = await sharp(quarter).flop().toBuffer();
  const flip = await sharp(quarter).flip().toBuffer();
  const both = await sharp(quarter).flip().flop().toBuffer();

  await sharp({ create: { width: TILE_PX, height: TILE_PX, channels: 3, background: "#ffffff" } })
    .composite([
      { input: quarter, left: 0, top: 0 },
      { input: flop, left: QUARTER_PX, top: 0 },
      { input: flip, left: 0, top: QUARTER_PX },
      { input: both, left: QUARTER_PX, top: QUARTER_PX }
    ])
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
    .toFile(out);
  const { size } = await stat(out);
  console.log(`${out} ${TILE_PX}x${TILE_PX} ${(size / 1024).toFixed(0)}KB`);
}

await mkdir(OUT_DIR, { recursive: true });
for (const source of SOURCES) await buildTile(source);
