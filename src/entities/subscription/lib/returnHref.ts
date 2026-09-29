import { SUBSCRIPTIONS_PATH, SUBSCRIPTIONS_RETURN_STORAGE_KEY } from "../config/constants";

// 저장소는 사생활 보호 모드·차단 설정에서 접근만 해도 예외를 던진다. 못 쓰면 첫 화면으로 돌아간다
export function rememberSubscriptionsReturn(href: string) {
  try {
    sessionStorage.setItem(SUBSCRIPTIONS_RETURN_STORAGE_KEY, href);
  } catch {
    return;
  }
}

export function readSubscriptionsReturn(): string {
  try {
    const href = sessionStorage.getItem(SUBSCRIPTIONS_RETURN_STORAGE_KEY);
    // 청약 화면 주소가 아닌 값은 따르지 않는다
    return href?.startsWith(SUBSCRIPTIONS_PATH) ? href : SUBSCRIPTIONS_PATH;
  } catch {
    return SUBSCRIPTIONS_PATH;
  }
}
