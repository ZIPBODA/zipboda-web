/** 공고는 하루 몇 차례 수집되고 D-day는 날마다 바뀐다. 같은 조회가 몰려도 API를 매번 부르지 않을 만큼만 묵힌다 */
export const API_REVALIDATE_SECONDS = 60;

/** 응답이 이보다 늦으면 실패로 끝낸다. 서버 렌더링이 API를 기다리며 멈춰 있지 않게 */
export const API_TIMEOUT_MS = 10_000;
