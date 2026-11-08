"use client";

import { useEffect, useRef } from "react";

/** True on Apple platforms, where "mod" means ⌘ instead of Ctrl. */
export function isApplePlatform(): boolean {
  return typeof navigator !== "undefined" && /Mac|iPhone|iPad/i.test(navigator.userAgent);
}

/** Display label for a "mod+<key>" shortcut ("⌘K" or "Ctrl+K"). */
export function shortcutLabel(key: string): string {
  return isApplePlatform() ? `⌘${key.toUpperCase()}` : `Ctrl+${key.toUpperCase()}`;
}

/**
 * Registers a global "mod+<key>" shortcut (⌘ on macOS, Ctrl elsewhere).
 * Works regardless of keyboard layout via `event.code`.
 */
export function useModHotkey(key: string, handler: () => void, enabled = true): void {
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const mod = isApplePlatform() ? event.metaKey : event.ctrlKey;
      if (!mod || event.altKey || event.shiftKey) return;
      if (
        event.code === `Key${key.toUpperCase()}` ||
        event.key.toLowerCase() === key.toLowerCase()
      ) {
        event.preventDefault();
        handlerRef.current();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [key, enabled]);
}
