"use client";

import { usePathname } from "next/navigation";
import { isFullscreenRoute } from "@/shared/config/routes";

// 풀스크린 라우트(평면도 뷰어 등)에서는 전역 헤더/푸터/하단탭을 숨기고 콘텐츠만 렌더한다.
// 슬롯(element)로 받아 Footer 등의 서버 컴포넌트 성격을 보존한다.
export function AppChrome({
  header,
  footer,
  bottomNav,
  children
}: {
  header: React.ReactNode;
  footer: React.ReactNode;
  bottomNav: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (isFullscreenRoute(pathname)) return <>{children}</>;

  return (
    <>
      {header}
      <div className="flex-1">{children}</div>
      {footer}
      {/* 고정된 모바일 하단 탭이 푸터를 가리지 않도록 탭 높이(h-16)만큼 여백을 둔다 */}
      <div aria-hidden className="h-16 md:hidden" />
      {bottomNav}
    </>
  );
}
