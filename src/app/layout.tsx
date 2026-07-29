import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "집보다",
  description: "LH·SH·GH·IH 공공 청약 정보·평면도·3D 집구경"
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
      <body className="font-sans bg-surface text-fg-strong">{children}</body>
    </html>
  );
}
