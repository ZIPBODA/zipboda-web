import { describe, it, expect } from "vitest";
import { TRACE_FILE_VERSION } from "../config/constants";
import type { TraceFile } from "../model/types";
import { defaultNameFromImage, parseTraceFile, sanitizeFileName, serializeTraceFile } from "./documentFile";
import { emptyDocument } from "./documentFromModel";

const file = (): TraceFile => ({
  version: TRACE_FILE_VERSION,
  name: "test2",
  imageUrl: "/mock/test2.jpg",
  document: { ...emptyDocument(), walls: [{ id: "w1", a: { x: 0, z: 0 }, b: { x: 4500, z: 0 } }], seq: 1 }
});

describe("serializeTraceFile / parseTraceFile", () => {
  it("저장한 작업을 그대로 되읽는다", () => {
    expect(parseTraceFile(serializeTraceFile(file()))).toEqual(file());
  });

  it("JSON이 아니면 무엇이 잘못됐는지 알린다", () => {
    expect(() => parseTraceFile("not json")).toThrow("JSON이 아닙니다");
  });

  it("버전이 다르면 읽지 않는다", () => {
    const older = JSON.stringify({ ...file(), version: TRACE_FILE_VERSION + 1 });
    expect(() => parseTraceFile(older)).toThrow("버전");
  });

  it("편집 내용이 없으면 읽지 않는다", () => {
    expect(() => parseTraceFile(JSON.stringify({ version: TRACE_FILE_VERSION, document: { walls: [] } }))).toThrow("편집 내용");
  });

  it("이름·이미지가 빠져 있어도 문서만 있으면 읽는다", () => {
    const parsed = parseTraceFile(JSON.stringify({ version: TRACE_FILE_VERSION, document: emptyDocument() }));
    expect(parsed.name).toBe("");
    expect(parsed.imageUrl).toBe("");
  });
});

describe("sanitizeFileName", () => {
  it("한글·숫자는 남기고 경로 문자는 걷어낸다", () => {
    expect(sanitizeFileName("종로구 미래지안 59A")).toBe("종로구-미래지안-59A");
    expect(sanitizeFileName("a/b\\c:d")).toBe("a-b-c-d");
  });

  it("빈 이름은 기본값으로 대체한다", () => {
    expect(sanitizeFileName("   ")).toBe("floorplan");
    expect(sanitizeFileName("///")).toBe("floorplan");
  });
});

describe("defaultNameFromImage", () => {
  it("경로에서 확장자와 쿼리를 뗀 파일명을 쓴다", () => {
    expect(defaultNameFromImage("/mock/test2.jpg")).toBe("test2");
    expect(defaultNameFromImage("https://x.test/a/b/plan-59A.png?v=2")).toBe("plan-59A");
  });

  it("blob 주소는 이름이 될 수 없어 기본값을 쓴다", () => {
    expect(defaultNameFromImage("blob:http://localhost/9f1c-77")).toBe("floorplan");
  });
});
