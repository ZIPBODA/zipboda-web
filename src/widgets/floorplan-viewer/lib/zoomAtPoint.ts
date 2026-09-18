import { SCENE2D_ZOOM } from "../config/constants";

export interface PanOffset {
  x: number;
  y: number;
}

export interface ZoomState {
  scale: number;
  offset: PanOffset;
}

/** 컨테이너 중심을 원점으로 본 포인터 위치(px) */
export interface PointerOffset {
  x: number;
  y: number;
}

const clampScale = (value: number) => Math.max(SCENE2D_ZOOM.min, Math.min(SCENE2D_ZOOM.max, value));

/**
 * 포인터 아래 지점을 제자리에 두고 확대·축소한다.
 * 중심 기준으로만 확대하면 보려던 곳이 화면 밖으로 밀려나 도면을 다시 찾아야 한다.
 */
export function zoomAtPoint(state: ZoomState, pointer: PointerOffset, factor: number): ZoomState {
  const scale = clampScale(state.scale * factor);
  if (scale === state.scale) return state;

  const ratio = scale / state.scale;
  return {
    scale,
    offset: {
      x: pointer.x - (pointer.x - state.offset.x) * ratio,
      y: pointer.y - (pointer.y - state.offset.y) * ratio
    }
  };
}
