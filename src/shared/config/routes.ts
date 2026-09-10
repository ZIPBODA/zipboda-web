/** 전역 헤더·푸터·하단탭 없이 몰입 풀스크린으로 렌더하는 라우트 */
export const FULLSCREEN_ROUTES: RegExp[] = [/^\/subscriptions\/[^/]+\/floorplan$/];

export const isFullscreenRoute = (pathname: string): boolean => FULLSCREEN_ROUTES.some((re) => re.test(pathname));
