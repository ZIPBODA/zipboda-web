import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoginForm } from "./LoginForm";

describe("LoginForm", () => {
  it("이메일·비밀번호 입력과 로그인 버튼을 렌더한다", () => {
    render(<LoginForm />);

    expect(screen.getByLabelText("이메일")).toHaveAttribute("type", "email");
    expect(screen.getByLabelText("비밀번호")).toHaveAttribute("type", "password");
    expect(screen.getByPlaceholderText("이메일 주소를 입력해주세요")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "로그인" })).toHaveAttribute("type", "submit");
  });

  it("비밀번호 찾기·회원가입으로 이동할 수 있다", () => {
    render(<LoginForm />);

    expect(screen.getByRole("link", { name: "비밀번호 찾기" })).toHaveAttribute("href", "/password/find");
    expect(screen.getByRole("link", { name: "회원가입" })).toHaveAttribute("href", "/signup");
  });

  it("소셜 로그인 3종을 접근 가능한 이름으로 제공한다", () => {
    render(<LoginForm />);

    expect(screen.getByRole("button", { name: "카카오 로그인" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "네이버 로그인" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "구글 로그인" })).toBeInTheDocument();
  });
});
