import type { ComponentPropsWithRef, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { Tooltip } from "../Tooltip";
import styles from "./IconButton.module.css";

export interface IconButtonProps extends Omit<ComponentPropsWithRef<"button">, "children"> {
  /** Accessible name; also shown as tooltip. Required because there is no visible text. */
  label: string;
  icon: ReactNode;
  variant?: "ghost" | "secondary" | "primary";
  size?: "sm" | "md";
  showTooltip?: boolean;
}

/** Square, icon-only button with an accessible label and optional tooltip. */
export function IconButton({
  label,
  icon,
  variant = "ghost",
  size = "md",
  showTooltip = true,
  className,
  type = "button",
  ...props
}: IconButtonProps) {
  const button = (
    <button
      type={type}
      aria-label={label}
      className={cn(styles.iconButton, styles[variant], styles[size], className)}
      {...props}
    >
      <span aria-hidden="true" className={styles.icon}>
        {icon}
      </span>
    </button>
  );
  return showTooltip ? <Tooltip content={label}>{button}</Tooltip> : button;
}
