import { afterEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import * as THREE from "three";
import { useFinishTextures } from "./useFinishTextures";

afterEach(() => vi.restoreAllMocks());

function setup() {
  let complete: ((image: HTMLImageElement) => void) | undefined;
  let fail: (() => void) | undefined;
  const load = vi.spyOn(THREE.ImageLoader.prototype, "load").mockImplementation((_url, onLoad, _progress, onError) => {
    complete = onLoad;
    fail = () => onError?.(new Error("unavailable"));
    return document.createElement("img");
  });
  const image = document.createElement("img");
  image.width = 1024;
  image.height = 1024;
  return { load, finish: () => act(() => complete?.(image)), fail: () => act(() => fail?.()) };
}

describe("마감재 이미지 수명", () => {
  it("한 번의 이미지 로드로 영역을 분리하고 해제 시 모든 GPU 재질을 정리한다", () => {
    const loader = setup();
    const drawImage = vi.fn();
    // 브라우저의 실제 Canvas 렌더링은 별도 WebGL 화면 검증으로 확인한다.
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ drawImage } as unknown as CanvasRenderingContext2D);
    const { result, unmount } = renderHook(useFinishTextures);
    expect(result.current.flooring).toBeNull();
    loader.finish();
    expect(loader.load).toHaveBeenCalledTimes(1);
    expect(drawImage).toHaveBeenCalledTimes(5);
    const textures = Object.values(result.current);
    const dispose = textures.map((texture) => {
      expect(texture?.colorSpace).toBe(THREE.SRGBColorSpace);
      expect(texture?.wrapS).toBe(THREE.RepeatWrapping);
      return vi.spyOn(texture!, "dispose");
    });
    unmount();
    dispose.forEach((spy) => expect(spy).toHaveBeenCalledTimes(1));
  });

  it("로드 실패는 단색 폴백을 유지한다", () => {
    const loader = setup();
    const { result } = renderHook(useFinishTextures);
    loader.fail();
    expect(Object.values(result.current).every((texture) => texture === null)).toBe(true);
  });

  it("화면 이탈 후 늦게 도착한 이미지는 텍스처를 만들지 않는다", () => {
    const loader = setup();
    const canvas = vi.spyOn(HTMLCanvasElement.prototype, "getContext");
    const { unmount } = renderHook(useFinishTextures);
    unmount();
    loader.finish();
    expect(canvas).not.toHaveBeenCalled();
  });
});
