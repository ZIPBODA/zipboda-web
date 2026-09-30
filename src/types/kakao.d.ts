/**
 * 카카오 지도 SDK 중 우리가 실제로 쓰는 멤버만 선언한다.
 * 공식 타입 패키지를 설치하면 전역 kakao 네임스페이스가 모든 파일에 노출되어,
 * "SDK 타입은 shared/ui/map 밖으로 나가지 않는다"는 경계가 타입 차원에서 무너진다.
 */
declare namespace kakao.maps {
  function load(callback: () => void): void;
  const MapTypeId: { ROADMAP: number; HYBRID: number };
  const CopyrightPosition: { BOTTOMLEFT: number; BOTTOMRIGHT: number };

  class LatLng {
    constructor(lat: number, lng: number);
    getLat(): number;
    getLng(): number;
  }

  class LatLngBounds {
    constructor(sw?: LatLng, ne?: LatLng);
    extend(point: LatLng): void;
    isEmpty(): boolean;
    contain(point: LatLng): boolean;
  }

  interface MapOptions {
    center: LatLng;
    level?: number;
    draggable?: boolean;
    scrollwheel?: boolean;
    disableDoubleClickZoom?: boolean;
  }

  class Point {
    constructor(x: number, y: number);
    x: number;
    y: number;
  }

  class Map {
    getProjection(): { containerPointFromCoords(point: LatLng): Point; coordsFromContainerPoint(point: Point): LatLng };
    constructor(container: HTMLElement, options: MapOptions);
    setCenter(position: LatLng): void;
    setLevel(level: number, options?: { anchor?: LatLng; animate?: boolean | { duration: number } }): void;
    jump(position: LatLng, level: number, options?: { animate?: boolean | { duration: number } }): void;
    getLevel(): number;
    getCenter(): LatLng;
    getBounds(): LatLngBounds;
    setBounds(bounds: LatLngBounds, paddingTop?: number, paddingRight?: number, paddingBottom?: number, paddingLeft?: number): void;
    relayout(): void;
    setDraggable(draggable: boolean): void;
    setMapTypeId(type: number): void;
    setCopyrightPosition(position: number, reversed?: boolean): void;
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

  class CustomOverlay {
    constructor(options: { map?: Map; position: LatLng; content: HTMLElement | string; xAnchor?: number; yAnchor?: number; zIndex?: number; clickable?: boolean });
    setMap(map: Map | null): void;
    setPosition(position: LatLng): void;
    setZIndex(zIndex: number): void;
    getContent(): HTMLElement | string;
  }

  class Circle {
    constructor(options: { center: LatLng; radius: number; strokeWeight?: number; strokeColor?: string; strokeOpacity?: number; fillColor?: string; fillOpacity?: number });
    setMap(map: Map | null): void;
  }

  interface MarkerClustererOptions {
    map: Map;
    gridSize?: number;
    minLevel?: number;
    minClusterSize?: number;
    averageCenter?: boolean;
    disableClickZoom?: boolean;
    styles?: Record<string, string>[];
    texts?: (size: number) => string;
  }

  class MarkerClusterer {
    constructor(options: MarkerClustererOptions);
    getMinClusterSize(): number;
    setMinClusterSize(size: number): void;
    addMarkers(markers: Marker[], nodraw?: boolean): void;
    removeMarkers(markers: Marker[], nodraw?: boolean): void;
    clear(): void;
    redraw(): void;
  }

  interface Cluster {
    getMarkers(): Marker[];
    getCenter(): LatLng;
    getSize(): number;
    getClusterMarker(): CustomOverlay;
  }

  namespace event {
    function addListener(target: Marker | Map, type: string, handler: () => void): void;
    function removeListener(target: Marker | Map, type: string, handler: () => void): void;
    function addListener(target: MarkerClusterer, type: "clusterclick", handler: (cluster: Cluster) => void): void;
    function removeListener(target: MarkerClusterer, type: "clusterclick", handler: (cluster: Cluster) => void): void;
    function addListener(target: MarkerClusterer, type: "clustered", handler: (clusters: Cluster[]) => void): void;
    function removeListener(target: MarkerClusterer, type: "clustered", handler: (clusters: Cluster[]) => void): void;
  }
}

interface Window {
  kakao?: { maps?: typeof kakao.maps };
}
