import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";
import { MobileBottomNav } from "@/widgets/mobile-bottom-nav";
import { CartProvider, CartDrawer } from "@/features/cart";
import { AppChrome } from "./AppChrome";
import { getSearchData } from "./searchData";

export const metadata: Metadata = {
  title: "집보다",
  description: "LH·SH·GH·IH 공공 청약 정보·평면도·3D 집구경",
  // 파비콘은 public/favicon/ 한 폴더에서 관리(Next 규약 파일 대신 metadata로 선언)
  icons: {
    icon: [
      { url: "/favicon/favicon.ico", sizes: "any" },
      { url: "/favicon/favicon-48x48.png", type: "image/png", sizes: "48x48" },
      { url: "/favicon/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon/favicon-16x16.png", type: "image/png", sizes: "16x16" }
    ],
    apple: [{ url: "/favicon/apple-touch-icon.png", sizes: "180x180" }]
  },
  manifest: "/favicon/site.webmanifest"
};

export const viewport: Viewport = {
  themeColor: "#FFBA17"
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { index } = await getSearchData();
  return (
    <html lang="ko">
      <head>
        {/* Pretendard (디자인시스템 기본 폰트) */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body className="flex min-h-screen flex-col bg-surface font-sans text-fg-strong">
        <CartProvider>
          {/* 인증 미구현 프로토타입 — 로그인 후 헤더(찜·알림·프로필)를 기본 노출. 로그인 화면은 /login 직접 접근 */}
          {/* AppChrome이 풀스크린 라우트(평면도 뷰어)에서 헤더/푸터/하단탭을 숨긴다 */}
          <AppChrome header={<Header authenticated searchIndex={index} />} footer={<Footer />} bottomNav={<MobileBottomNav />}>
            {children}
          </AppChrome>
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
