import type { MaskImage } from "../model/types";

/** 한 축으로만 최소/최대값 필터를 돌린다(정사각 구조요소는 두 축으로 나눠 처리할 수 있다) */
function filterAxis(source: MaskImage, radius: number, horizontal: boolean, erode: boolean): MaskImage {
  const out: MaskImage = { data: new Uint8Array(source.data.length), width: source.width, height: source.height };
  const lines = horizontal ? source.height : source.width;
  const length = horizontal ? source.width : source.height;
  const at = (line: number, pos: number) => (horizontal ? line * source.width + pos : pos * source.width + line);

  for (let line = 0; line < lines; line++) {
    for (let pos = 0; pos < length; pos++) {
      let value = erode ? 1 : 0;
      for (let d = -radius; d <= radius; d++) {
        const p = pos + d;
        // 바깥은 벽으로 보지 않는다 — 경계 쪽 벽이 통째로 깎이는 것을 막는다
        if (p < 0 || p >= length) continue;
        const on = source.data[at(line, p)] === 1;
        if (erode && !on) value = 0;
        if (!erode && on) value = 1;
      }
      out.data[at(line, pos)] = value;
    }
  }
  return out;
}

/**
 * 벽 마스크를 radius만큼 깎는다.
 * 방 영역은 벽 픽셀을 뺀 빈 공간이라 벽 두께만큼 작게 나오는데, 도면의 인쇄 면적은
 * 보통 벽 중심선 기준이다. 벽 두께의 절반을 깎아 두 기준을 맞춘다.
 */
export function erodeMask(mask: MaskImage, radius: number): MaskImage {
  if (radius <= 0) return { data: Uint8Array.from(mask.data), width: mask.width, height: mask.height };
  return filterAxis(filterAxis(mask, radius, true, true), radius, false, true);
}

/** 마스크를 radius만큼 부풀린다 */
export function dilateMask(mask: MaskImage, radius: number): MaskImage {
  if (radius <= 0) return { data: Uint8Array.from(mask.data), width: mask.width, height: mask.height };
  return filterAxis(filterAxis(mask, radius, true, false), radius, false, false);
}

/**
 * 열림(깎았다가 부풀리기) — radius보다 가는 것은 지워지고 굵은 덩어리만 남는다.
 * 벽은 가늘고 난간·창 같은 그림은 굵으므로, 굵은 덩어리만 골라내는 데 쓴다.
 */
export const openMask = (mask: MaskImage, radius: number): MaskImage => dilateMask(erodeMask(mask, radius), radius);

/** base에서 remove에 해당하는 픽셀을 뺀다 */
export function subtractMask(base: MaskImage, remove: MaskImage): MaskImage {
  const out: MaskImage = { data: Uint8Array.from(base.data), width: base.width, height: base.height };
  const size = Math.min(out.data.length, remove.data.length);
  for (let i = 0; i < size; i++) if (remove.data[i] === 1) out.data[i] = 0;
  return out;
}

/**
 * 크롭 테두리에 닿는 연결 성분만 남긴다.
 * 크롭은 유닛 외곽선이라 테두리에 닿은 굵은 덩어리는 장식 그림이 아니라 건물 외피(외벽)다.
 */
export function borderComponentMask(mask: MaskImage): MaskImage {
  const { width, height, data } = mask;
  const out: MaskImage = { data: new Uint8Array(width * height), width, height };
  const stack: number[] = [];
  const push = (index: number) => {
    if (data[index] !== 1 || out.data[index] === 1) return;
    out.data[index] = 1;
    stack.push(index);
  };

  for (let x = 0; x < width; x++) {
    push(x);
    push((height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    push(y * width);
    push(y * width + width - 1);
  }

  while (stack.length) {
    const index = stack.pop();
    if (index === undefined) break;
    const x = index % width;
    const y = (index - x) / width;
    if (x > 0) push(index - 1);
    if (x < width - 1) push(index + 1);
    if (y > 0) push(index - width);
    if (y < height - 1) push(index + width);
  }
  return out;
}
