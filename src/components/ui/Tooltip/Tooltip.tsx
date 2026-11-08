"use client";

import { Tooltip as TooltipPrimitive } from "radix-ui";
import type { ReactElement, ReactNode } from "react";
import styles from "./Tooltip.module.css";

export interface TooltipProps {
  content: ReactNode;
  /** A single focusable element (button, link). */
  children: ReactElement;
  side?: "top" | "bottom" | "left" | "right";
}

/**
 * Supplementary hint on hover/focus. Never put essential information only
 * in a tooltip – it is unavailable on touch devices.
 */
export function Tooltip({ content, children, side = "top" }: TooltipProps) {
  return (
    <TooltipPrimitive.Provider delayDuration={400} skipDelayDuration={200}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content side={side} sideOffset={6} className={styles.content}>
            {content}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
