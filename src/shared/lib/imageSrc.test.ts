import { describe, expect, it } from "vitest";
import nextConfig from "../../../next.config.mjs";
import { REMOTE_IMAGE_PREFIXES } from "@/shared/config/images";
import { displayableImageOf } from "./imageSrc";

describe("displayableImageOf", () => {
  it("우리 정적 파일과 허용한 원격 사진 주소만 남긴다", () => {
    expect(displayableImageOf("/housing/gangnam-gaepo/exterior.png")).toBe("/housing/gangnam-gaepo/exterior.png");
    expect(displayableImageOf("https://apply.lh.or.kr/upload/Files/upload_dec/2026/LSE/10/22/1.jpg")).toBe("https://apply.lh.or.kr/upload/Files/upload_dec/2026/LSE/10/22/1.jpg");
    expect(displayableImageOf(null)).toBeNull();
  });

  // 목록 밖 주소를 next/image에 넘기면 화면 전체가 오류가 난다 — 사진 없음으로 그린다
  it("보기 페이지·다른 호스트·프로토콜 상대 주소는 사진 없음이다", () => {
    expect(displayableImageOf("https://apply.lh.or.kr/lhapply/lhImageView2.do?fileid=1")).toBeNull();
    expect(displayableImageOf("https://example.com/a.jpg")).toBeNull();
    expect(displayableImageOf("//example.com/a.jpg")).toBeNull();
  });

  it("허용 목록은 next.config.mjs의 images.remotePatterns와 같다", () => {
    const patterns = nextConfig("phase-production-build").images?.remotePatterns ?? [];
    const prefixes = patterns.map((pattern) => `${pattern.protocol}://${pattern.hostname}${String(pattern.pathname).replace(/\*\*$/, "")}`);
    expect(prefixes).toEqual([...REMOTE_IMAGE_PREFIXES]);
  });
});
