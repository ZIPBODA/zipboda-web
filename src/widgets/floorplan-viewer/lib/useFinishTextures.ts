"use client";

import { useEffect, useState } from "react";
import * as THREE from "three";
import { TEXTURE_ANISOTROPY } from "../config/constants";
import { FINISH_ATLAS_URL, FINISH_ATLAS_SIZE, FINISH_ATLAS_REGIONS } from "../config/finishAtlas";
import type { FinishKind, FinishTextures } from "../model/finish";

const EMPTY: FinishTextures = { wallpaper: null, flooring: null, tile: null, bathroomTile: null, concrete: null };

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
    const loader = new THREE.ImageLoader();
    const loaded: THREE.Texture[] = [];
    let cancelled = false;

    loader.load(FINISH_ATLAS_URL, (image: HTMLImageElement) => {
      if (cancelled || image.width !== FINISH_ATLAS_SIZE || image.height !== FINISH_ATLAS_SIZE) return;
      const next: FinishTextures = { ...EMPTY };
      for (const key of Object.keys(FINISH_ATLAS_REGIONS) as FinishKind[]) {
        const region = FINISH_ATLAS_REGIONS[key];
        const canvas = document.createElement("canvas");
        canvas.width = region.width;
        canvas.height = region.height;
        const context = canvas.getContext("2d");
        if (!context) continue;
        context.drawImage(image, region.x, region.y, region.width, region.height, 0, 0, region.width, region.height);
        const texture = configureTile(new THREE.CanvasTexture(canvas));
        loaded.push(texture);
        next[key] = texture;
      }
      setTextures(next);
    }, undefined, () => { if (!cancelled) setTextures(EMPTY); });

    return () => {
      cancelled = true;
      loaded.forEach((t) => t.dispose());
    };
  }, []);

  return textures;
}
