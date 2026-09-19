"use client";

import { useEffect, useState } from "react";

const FEEDBACK_MS = 1600;

/**
 * 지금 보고 있는 주소를 공유한다.
 * 모바일은 운영체제 공유 시트를, 지원하지 않는 브라우저는 주소 복사로 대신한다.
 * 서버 없이 완결되는 동작이라 로그인이나 API를 기다리지 않는다.
 */
export function ShareButton({
  title,
  className,
  children,
  copiedLabel = "주소를 복사했습니다"
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
  copiedLabel?: string;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), FEEDBACK_MS);
    return () => clearTimeout(timer);
  }, [copied]);

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      // 사용자가 공유 시트를 닫으면 거절로 떨어진다. 실패가 아니므로 조용히 넘긴다
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button type="button" onClick={share} aria-label={copied ? copiedLabel : "공유"} className={className}>
      {copied ? <span className="whitespace-nowrap">복사됨</span> : children}
    </button>
  );
}
