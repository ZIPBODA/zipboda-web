/**
 * 카카오 지도 SDK 중 우리가 실제로 쓰는 멤버만 선언한다.
 * 공식 타입 패키지를 설치하면 전역 kakao 네임스페이스가 모든 파일에 노출되어,
 * "SDK 타입은 shared/ui/map 밖으로 나가지 않는다"는 경계가 타입 차원에서 무너진다.
 */
declare namespace kakao.maps {
  function load(callback: () => void): void;

  class LatLng {
    constructor(lat: number, lng: number);
    getLat(): number;
    getLng(): number;
  }

  class LatLngBounds {
    constructor(sw?: LatLng, ne?: LatLng);
    extend(point: LatLng): void;
    isEmpty(): boolean;
  }

  interface MapOptions {
    center: LatLng;
    level?: number;
    draggable?: boolean;
    scrollwheel?: boolean;
    disableDoubleClickZoom?: boolean;
  }

  class Map {
    constructor(container: HTMLElement, options: MapOptions);
    setCenter(position: LatLng): void;
    setLevel(level: number): void;
    setBounds(bounds: LatLngBounds, paddingTop?: number, paddingRight?: number, paddingBottom?: number, paddingLeft?: number): void;
    relayout(): void;
    setDraggable(draggable: boolean): void;
    setZoomable(zoomable: boolean): void;
  }

  interface MarkerOptions {
    position: LatLng;
    title?: string;
    clickable?: boolean;
    zIndex?: number;
  }

  class Marker {
    constructor(options: MarkerOptions);
    setMap(map: Map | null): void;
    setPosition(position: LatLng): void;
    setZIndex(zIndex: number): void;
  }

  namespace event {
    function addListener(target: Marker | Map, type: string, handler: () => void): void;
  }
}

interface Window {
  kakao?: { maps?: typeof kakao.maps };
}
