export interface TextureRepeat {
  x: number;
  y: number;
}

/** 벽면(길이×높이, m)에 실척 타일(tileM)이 몇 번 반복되는지 — BoxGeometry 면 UV는 0..1이라 크기로 나눠 준다 */
export function wallTextureRepeat(lengthM: number, heightM: number, tileM: number): TextureRepeat {
  return { x: lengthM / tileM, y: heightM / tileM };
}

/** ExtrudeGeometry UV는 shape 좌표(m) 그대로라 타일 크기의 역수를 한 번만 적용한다 */
export function floorTextureRepeat(tileM: number): TextureRepeat {
  const perMeter = 1 / tileM;
  return { x: perMeter, y: perMeter };
}
