import { describe, it, expect, beforeEach } from "vitest";
import { DRAFT_STORAGE_PREFIX, TRACE_FILE_VERSION } from "../config/constants";
import type { TraceFile } from "../model/types";
import { clearDraft, loadDraft, saveDraft } from "./draftStorage";
import { emptyDocument } from "./documentFromModel";

const IMAGE = "/mock/test2.jpg";
const file = (): TraceFile => ({
  version: TRACE_FILE_VERSION,
  name: "test2",
  imageUrl: IMAGE,
  document: { ...emptyDocument(), walls: [{ id: "w1", a: { x: 0, z: 0 }, b: { x: 4500, z: 0 } }], seq: 1 }
});

describe("draftStorage", () => {
  beforeEach(() => window.localStorage.clear());

  it("남긴 내용을 도면별로 되읽는다", () => {
    saveDraft(file());
    const draft = loadDraft(IMAGE);
    expect(draft?.file).toEqual(file());
    expect(draft?.savedAt).toBeGreaterThan(0);
    expect(loadDraft("/mock/다른도면.jpg")).toBeNull();
  });

  it("남긴 것이 없으면 null", () => {
    expect(loadDraft(IMAGE)).toBeNull();
  });

  it("깨진 값·옛 형식은 없는 셈 친다", () => {
    window.localStorage.setItem(DRAFT_STORAGE_PREFIX + IMAGE, "{-");
    expect(loadDraft(IMAGE)).toBeNull();
    window.localStorage.setItem(DRAFT_STORAGE_PREFIX + IMAGE, JSON.stringify({ ...file(), version: TRACE_FILE_VERSION + 1 }));
    expect(loadDraft(IMAGE)).toBeNull();
  });

  it("지우면 사라진다", () => {
    saveDraft(file());
    clearDraft(IMAGE);
    expect(loadDraft(IMAGE)).toBeNull();
  });

  it("도면을 모르면 남기지도 읽지도 않는다", () => {
    saveDraft({ ...file(), imageUrl: "" });
    expect(window.localStorage.length).toBe(0);
    expect(loadDraft("")).toBeNull();
  });
});
