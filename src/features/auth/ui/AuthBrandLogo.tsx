import Image from "next/image";
import icon from "@/shared/assets/brand/icon-logo.png";

// figma 419:11103·419:11183 모바일 인증 브랜드 로고(아이콘 + 집보다)
export function AuthBrandLogo() {
  return (
    <span className="flex items-center gap-2" aria-label="집보다">
      <span className="relative size-9 shrink-0 overflow-hidden rounded-lg">
        <Image src={icon} alt="" fill sizes="36px" className="object-contain" />
      </span>
      <span className="text-h2 font-bold text-fg-heading">집보다</span>
    </span>
  );
}
