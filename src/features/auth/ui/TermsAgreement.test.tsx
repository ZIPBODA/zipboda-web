import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TermsAgreement } from "./TermsAgreement";
import { SIGNUP_TERMS } from "../config/constants";

// 체크 표시(✓)는 aria-hidden이라 접근명에 포함되지 않는다 → 역할+접근명으로 조회한다
const allBox = () => screen.getByRole("checkbox", { name: "전체 동의 (선택 정보 포함)" });
const termBox = (label: string) => screen.getByRole("checkbox", { name: label });
const boxes = () => screen.getAllByRole("checkbox");

describe("TermsAgreement", () => {
  it("약관 4종과 전체 동의를 렌더한다", () => {
    render(<TermsAgreement />);

    expect(boxes()).toHaveLength(SIGNUP_TERMS.length + 1);
    for (const term of SIGNUP_TERMS) {
      expect(termBox(term.label)).toBeInTheDocument();
    }
  });

  it("전체 동의를 켜면 모든 항목이 함께 켜진다", () => {
    render(<TermsAgreement />);
    fireEvent.click(allBox());

    for (const box of boxes()) {
      expect(box).toBeChecked();
    }
  });

  it("전체 동의를 다시 끄면 모든 항목이 해제된다", () => {
    render(<TermsAgreement />);
    fireEvent.click(allBox());
    fireEvent.click(allBox());

    for (const box of boxes()) {
      expect(box).not.toBeChecked();
    }
  });

  it("개별 항목을 모두 켜면 전체 동의도 켜진다", () => {
    render(<TermsAgreement />);
    for (const term of SIGNUP_TERMS) {
      fireEvent.click(termBox(term.label));
    }

    expect(allBox()).toBeChecked();
  });

  it("개별 항목 하나를 끄면 전체 동의가 풀린다", () => {
    render(<TermsAgreement />);
    fireEvent.click(allBox());
    fireEvent.click(termBox(SIGNUP_TERMS[0].label));

    expect(allBox()).not.toBeChecked();
    expect(termBox(SIGNUP_TERMS[1].label)).toBeChecked();
  });

  it("필수 약관만 required로 표시한다", () => {
    render(<TermsAgreement />);

    for (const term of SIGNUP_TERMS) {
      const box = termBox(term.label);
      if (term.required) expect(box).toBeRequired();
      else expect(box).not.toBeRequired();
    }
  });
});
