/**
 * 주택 주소를 좌표로 한 번만 바꿔 정적 자산으로 고정한다.
 *   KAKAO_REST_API_KEY=... node scripts/run-ts.cjs scripts/geocode-housing.ts [--force]
 *
 * 런타임에 지오코딩하지 않는 이유는 현황도 파이프라인과 같다 — 원본에서 뽑아 파일로 굳히고, 서비스는 읽기만 한다.
 * catalog.json은 prepare-housing-sources.py가 통째로 다시 쓰므로 좌표를 거기 두면 다음 재추출에서 사라진다.
 * method가 manual인 항목은 사람이 고친 것이라 --force로도 덮지 않는다.
 */
import fs from "node:fs";
import path from "node:path";
import { HOUSING_SOURCE_DATA } from "@/shared/api/housing-data";
import { isInKorea } from "@/shared/lib/geo";

interface GeocodeEntry {
  propertyId: string;
  lat: number;
  lng: number;
  method: "kakao-address" | "manual";
  queryAddress: string;
  resolvedAddress: string | null;
  region1: string | null;
  region2: string | null;
  geocodedAt: string;
}

const OUT = path.resolve(__dirname, "../src/shared/api/housing-data/geocode.json");
const REST_KEY = process.env.KAKAO_REST_API_KEY ?? "";
const force = process.argv.includes("--force");

/** 도로명 뒤의 "(법정동,건물명)"은 검색 정확도를 떨어뜨려 떼고 묻는다 */
const toQuery = (address: string) => address.split("(")[0].trim();

const readExisting = (): GeocodeEntry[] => (fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : []);

async function geocode(query: string) {
  const response = await fetch(`https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(query)}`, {
    headers: { Authorization: `KakaoAK ${REST_KEY}` }
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const body = (await response.json()) as {
    documents: { x: string; y: string; address_name: string; address?: { region_1depth_name: string; region_2depth_name: string } }[];
  };
  return body.documents[0] ?? null;
}

async function main() {
  if (!REST_KEY) throw new Error("KAKAO_REST_API_KEY가 없습니다. 카카오 개발자 콘솔의 REST API 키를 환경변수로 주세요.");

  const existing = new Map(readExisting().map((entry) => [entry.propertyId, entry]));
  const result: GeocodeEntry[] = [];
  const failed: string[] = [];

  for (const property of HOUSING_SOURCE_DATA) {
    const kept = existing.get(property.id);
    if (kept && (kept.method === "manual" || !force)) {
      result.push(kept);
      console.log(`${property.id}: 유지(${kept.method})`);
      continue;
    }

    const query = toQuery(property.address);
    try {
      const found = await geocode(query);
      if (!found) {
        failed.push(`${property.id}: 검색 결과 없음 — "${query}"`);
        continue;
      }
      const point = { lat: Number(found.y), lng: Number(found.x) };
      if (!isInKorea(point)) {
        failed.push(`${property.id}: 국내 좌표가 아님 — ${point.lat}, ${point.lng}`);
        continue;
      }
      result.push({
        propertyId: property.id,
        lat: point.lat,
        lng: point.lng,
        method: "kakao-address",
        queryAddress: query,
        resolvedAddress: found.address_name ?? null,
        region1: found.address?.region_1depth_name ?? null,
        region2: found.address?.region_2depth_name ?? null,
        geocodedAt: new Date().toISOString()
      });
      console.log(`${property.id}: ${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}  ${found.address_name}`);
    } catch (error) {
      failed.push(`${property.id}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  result.sort((a, b) => a.propertyId.localeCompare(b.propertyId));
  fs.writeFileSync(OUT, JSON.stringify(result, null, 2) + "\n");

  console.log(`\n${result.length}/${HOUSING_SOURCE_DATA.length}건 저장 → ${path.relative(process.cwd(), OUT)}`);
  if (failed.length) {
    console.log("\n실패(파일에 넣지 않음 — 지도는 주소 표시로 대체된다):");
    for (const line of failed) console.log(`  ${line}`);
  }
}

void main();
