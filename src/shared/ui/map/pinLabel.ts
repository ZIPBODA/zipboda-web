import { cn } from "../cn";

/** 핀 머리 위에 뜨는 이름표. 누르면 그 핀을 누른 것과 같다 */
export function createPinLabel(name: string, onChoose: () => void) {
  const node = document.createElement("div");
  node.textContent = name;
  node.setAttribute("role", "button");
  node.tabIndex = 0;
  const keydown = (event: KeyboardEvent) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onChoose();
  };
  node.addEventListener("click", onChoose);
  node.addEventListener("keydown", keydown);
  return {
    node,
    /** 여러 이름표 사이에서 고른 집만 브랜드 색으로 칠해 드러낸다 */
    paint(selected: boolean) {
      node.setAttribute("aria-pressed", String(selected));
      node.className = cn(
        "mb-11 cursor-pointer whitespace-nowrap rounded-lg border px-3 py-2 text-xs font-bold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
        selected ? "border-brand bg-brand text-brand-on" : "border-line bg-surface text-fg-heading"
      );
    },
    dispose() {
      node.removeEventListener("click", onChoose);
      node.removeEventListener("keydown", keydown);
    }
  };
}
