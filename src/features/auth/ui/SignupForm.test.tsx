import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SignupForm } from "./SignupForm";

describe("SignupForm", () => {
  it("가입 입력 5종을 렌더한다", () => {
    render(<SignupForm />);

    expect(screen.getByLabelText("이름")).toBeInTheDocument();
    expect(screen.getByLabelText("이메일")).toHaveAttribute("type", "email");
    expect(screen.getByLabelText("비밀번호")).toHaveAttribute("type", "password");
    expect(screen.getByLabelText("비밀번호 확인")).toHaveAttribute("type", "password");
    expect(screen.getByLabelText("휴대폰 번호")).toHaveAttribute("type", "tel");
  });

  it("비밀번호 규칙을 placeholder로 안내한다", () => {
    render(<SignupForm />);

    expect(screen.getByPlaceholderText("8자 이상, 영문, 숫자, 특수문자 조합")).toBeInTheDocument();
  });

  it("가입 CTA와 로그인 이동 링크를 렌더한다", () => {
    render(<SignupForm />);

    expect(screen.getByRole("button", { name: "동의하고 회원가입" })).toHaveAttribute("type", "submit");
    expect(screen.getByRole("link", { name: "로그인하기" })).toHaveAttribute("href", "/login");
  });
});
