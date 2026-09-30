import { useEffect, useRef } from "react";
import { MOBILE_MEDIA_QUERY } from "@/shared/config/viewport";

/**
 * 모바일 상세는 화면 전체를 덮어 별도 페이지처럼 보인다. 휴대폰 뒤로가기가 지도를 떠나지 않고 상세만 닫도록 방문 기록을 하나 쌓는다.
 * 화면 안 버튼으로 닫으면 그 기록을 되돌려, 나중에 뒤로가기를 한 번 더 눌러야 하는 일이 없게 한다.
 * 되돌아간 기록의 주소는 여기서 고치지 않는다 — 지도 자리를 주소에 담는 쪽이 뒤로가기 때마다 맞춘다.
 * 기록에 표시를 달아 두지 않는다 — Next 라우터가 곧이어 기록 상태를 제 것으로 덮어써 표시가 사라진다.
 * 늘 떠 있는 작업 공간에서 불러야 한다 — 상세 안에서 부르면 개발 모드의 이중 실행이 기록을 넣었다 빼며 상세를 곧바로 닫는다.
 */
export function useCloseOnBack(open: boolean, onClose: () => void) {
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    if (!open || !window.matchMedia?.(MOBILE_MEDIA_QUERY).matches) return;
    const page = window.location.pathname;
    window.history.pushState({}, "", window.location.href);
    let wentBack = false;
    const onPop = () => { wentBack = true; close.current(); };
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      // 뒤로가기로 이미 닫혔거나, 상세 안 링크로 다른 페이지로 떠난 경우에는 되돌리지 않는다
      if (wentBack || window.location.pathname !== page) return;
      window.history.back();
    };
  }, [open]);
}
