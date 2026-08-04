import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

describe("ForgotPasswordForm", () => {
  it("이메일 입력과 재설정 링크 보내기 버튼을 렌더한다", () => {
    render(<ForgotPasswordForm />);
    expect(screen.getByRole("heading", { name: "비밀번호 찾기" })).toBeInTheDocument();
    expect(screen.getByLabelText("이메일")).toHaveAttribute("type", "email");
    expect(screen.getByRole("button", { name: "재설정 링크 보내기" })).toHaveAttribute("type", "submit");
  });

  it("제출하면 이메일 전송 완료 상태로 전환한다", () => {
    render(<ForgotPasswordForm />);
    fireEvent.change(screen.getByLabelText("이메일"), { target: { value: "test@email.com" } });
    fireEvent.click(screen.getByRole("button", { name: "재설정 링크 보내기" }));

    expect(screen.getByRole("heading", { name: "이메일을 확인해주세요" })).toBeInTheDocument();
    expect(screen.getByText(/test@email\.com/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "이메일 다시 보내기" })).toBeInTheDocument();
  });
});
