import type { MaskImage } from "../model/types";

/** 한 축으로만 최소값 필터를 돌린다(정사각 구조요소의 침식은 두 축으로 나눠 할 수 있다) */
function erodeAxis(source: MaskImage, radius: number, horizontal: boolean): MaskImage {
  const out: MaskImage = { data: new Uint8Array(source.data.length), width: source.width, height: source.height };
  const lines = horizontal ? source.height : source.width;
  const length = horizontal ? source.width : source.height;
  const at = (line: number, pos: number) => (horizontal ? line * source.width + pos : pos * source.width + line);

  for (let line = 0; line < lines; line++) {
    for (let pos = 0; pos < length; pos++) {
      let keep = 1;
      for (let d = -radius; d <= radius && keep === 1; d++) {
        const p = pos + d;
        // 바깥은 벽으로 보지 않는다 — 경계 쪽 벽이 통째로 깎이는 것을 막는다
        if (p < 0 || p >= length) continue;
        if (source.data[at(line, p)] !== 1) keep = 0;
      }
      out.data[at(line, pos)] = keep;
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
  return erodeAxis(erodeAxis(mask, radius, true), radius, false);
}

