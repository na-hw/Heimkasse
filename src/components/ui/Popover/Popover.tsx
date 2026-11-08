"use client";

import { Popover as PopoverPrimitive } from "radix-ui";
import type { ReactElement, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import control from "../shared/control.module.css";
import styles from "./Popover.module.css";

export interface PopoverProps {
  /** The element that opens the popover (usually a Button). */
  trigger: ReactElement;
  children: ReactNode;
  /** Accessible name of the popover content. */
  label: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  className?: string;
}

/** Non-modal floating panel anchored to its trigger. Escape closes and returns focus. */
export function Popover({
  trigger,
  children,
  label,
  open,
  onOpenChange,
  side = "bottom",
  align = "start",
  className,
}: PopoverProps) {
  return (
    <PopoverPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <PopoverPrimitive.Trigger asChild>{trigger}</PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          aria-label={label}
          side={side}
          align={align}
          sideOffset={6}
          collisionPadding={16}
          className={cn(control.panel, styles.content, className)}
        >
          {children}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
