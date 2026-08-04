import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ResetPasswordForm } from "./ResetPasswordForm";

describe("ResetPasswordForm", () => {
  it("새 비밀번호·확인 입력과 변경 버튼을 렌더한다", () => {
    render(<ResetPasswordForm />);
    expect(screen.getByRole("heading", { name: "새 비밀번호 설정" })).toBeInTheDocument();
    expect(screen.getByLabelText("새 비밀번호")).toHaveAttribute("type", "password");
    expect(screen.getByLabelText("새 비밀번호 확인")).toHaveAttribute("type", "password");
    expect(screen.getByRole("button", { name: "비밀번호 변경하기" })).toHaveAttribute("type", "submit");
  });

  it("제출하면 완료 상태로 전환하고 로그인하기 링크를 제공한다", () => {
    render(<ResetPasswordForm />);
    fireEvent.click(screen.getByRole("button", { name: "비밀번호 변경하기" }));

    expect(screen.getByRole("heading", { name: "비밀번호가 변경되었습니다" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "로그인하기" })).toHaveAttribute("href", "/login");
  });
});
