/**
 * next/image가 받는 원격 사진 주소 앞부분. next.config.mjs의 images.remotePatterns와 같은 목록이다(shared/lib/imageSrc.test.ts가 맞춰 본다).
 * 목록 밖 주소를 next/image에 넘기면 사진 하나 때문에 화면 전체가 오류가 난다
 */
export const REMOTE_IMAGE_PREFIXES: readonly string[] = ["https://apply.lh.or.kr/upload/"];
