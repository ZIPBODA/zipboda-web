import { cache } from "react";
import { getSubscriptionDetail } from "@/entities/subscription";

/**
 * generateMetadata와 페이지가 한 요청 안에서 상세 API를 두 번 부르지 않게 한다. API 클라이언트는 시간 제한 신호를 달아
 * Next의 fetch 중복 제거를 받지 못한다. cache()는 서버 컴포넌트 환경에만 있어 앱 레이어에 둔다
 */
export const getRequestSubscriptionDetail = cache(getSubscriptionDetail);
