import { loadSearchSuggestions } from "../../searchSuggestions";

/**
 * 헤더 검색 추천(GET). 서버 액션으로 두면 Next가 액션을 한 번에 하나씩 보내, 늦은 추천이 '더 보기'·지도 상세 액션을 막는다.
 * 읽기 전용 GET이라 브라우저가 지난 검색어 요청을 끊을 수 있다
 */
export async function GET(request: Request): Promise<Response> {
  const query = new URL(request.url).searchParams.get("q") ?? "";
  return Response.json(await loadSearchSuggestions(query));
}
