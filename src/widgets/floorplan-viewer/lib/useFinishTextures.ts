"use client";

import { useEffect, useState } from "react";
import * as THREE from "three";
import { FINISH_TEXTURE_URL, TEXTURE_ANISOTROPY } from "../config/constants";

export interface FinishTextures {
  wallpaper: THREE.Texture | null;
  flooring: THREE.Texture | null;
}

const EMPTY: FinishTextures = { wallpaper: null, flooring: null };

function configureTile(texture: THREE.Texture): THREE.Texture {
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = TEXTURE_ANISOTROPY;
  return texture;
}

/**
 * 마감재 타일을 로드한다. Suspense 대신 상태로 다루는 이유: 로드 실패를 에러 경계(클래스 컴포넌트) 없이
 * null → 단색 재질 폴백으로 흡수하고, 로드 전에도 씬이 즉시 그려지게 하기 위해서다.
 */
export function useFinishTextures(): FinishTextures {
  const [textures, setTextures] = useState<FinishTextures>(EMPTY);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    const loaded: THREE.Texture[] = [];
    let cancelled = false;

    const load = (key: keyof FinishTextures) =>
      loader.load(
        FINISH_TEXTURE_URL[key],
        (texture) => {
          if (cancelled) {
            texture.dispose();
            return;
          }
          loaded.push(texture);
          setTextures((prev) => ({ ...prev, [key]: configureTile(texture) }));
        },
        undefined,
        () => setTextures((prev) => ({ ...prev, [key]: null }))
      );

    load("wallpaper");
    load("flooring");

    return () => {
      cancelled = true;
      loaded.forEach((t) => t.dispose());
    };
  }, []);

  return textures;
}
