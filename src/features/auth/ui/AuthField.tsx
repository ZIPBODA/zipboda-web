import { Input } from "@/shared/ui";

interface Props {
  id: string;
  label: string;
  type?: React.HTMLInputTypeAttribute;
  placeholder: string;
  autoComplete?: string;
}

/**
 * figma 135:9038 입력 필드 — 라벨 + 공용 Input(20:113).
 * 디자인시스템 §12는 placeholder를 #99A1AF로 규정하나 @zipboda/ui-core 의 inputBaseClass 가
 * text-fg-muted(#6A7282)로 구현돼 있어, 상류 수정 전까지 우선순위를 강제한다.
 */
export function AuthField({ id, label, type = "text", placeholder, autoComplete }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-semibold text-fg-heading">
        {label}
      </label>
      <Input
        id={id}
        name={id}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="placeholder:!text-fg-disabled"
      />
    </div>
  );
}
