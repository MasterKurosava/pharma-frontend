import { useEffect, useRef, type RefObject } from "react";

/**
 * Закрытие по клику вне элемента (mousedown на document).
 * Колбэк всегда актуальный за счёт ref — не нужно мемоизировать снаружи.
 */
export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T | null>,
  enabled: boolean,
  onOutside: () => void,
): void {
  const onOutsideRef = useRef(onOutside);
  onOutsideRef.current = onOutside;

  useEffect(() => {
    if (!enabled) return;
    const listener = (event: MouseEvent) => {
      const el = ref.current;
      if (!el || el.contains(event.target as Node)) return;
      onOutsideRef.current();
    };
    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, [ref, enabled]);
}
