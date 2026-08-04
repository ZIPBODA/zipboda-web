import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";
import { CartProvider, CartDrawer } from "@/features/cart";

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
          <Header />
          <div className="flex-1">{children}</div>
          <Footer />
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
