// figma 135:9243 약관 동의 항목 (REQ-CO-009 필수/선택 구분)
export const SIGNUP_TERMS: { id: string; label: string; required: boolean }[] = [
  { id: "age14", label: "[필수] 만 14세 이상 이용자입니다.", required: true },
  { id: "terms", label: "[필수] 집보다 이용약관 동의", required: true },
  { id: "privacy", label: "[필수] 개인정보 수집 및 이용 동의", required: true },
  { id: "marketing", label: "[선택] 이벤트 및 마케팅 메일/SMS 수신 동의", required: false }
];
