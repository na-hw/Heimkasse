import type { IconKey } from "@/lib/appearance/icons";
import type { ColorKey } from "@/lib/appearance/palette";
import { cn } from "@/lib/utils/cn";
import { ICON_REGISTRY } from "./iconRegistry";
import styles from "./CategoryIcon.module.css";

export interface CategoryIconProps {
  icon: IconKey;
  color: ColorKey;
  size?: "sm" | "md" | "lg";
  /** Accessible name; omit when the icon is decorative (name shown next to it). */
  label?: string;
  className?: string;
}

/** Colored icon tile for categories, accounts and goals (theme-aware colors). */
export function CategoryIcon({ icon, color, size = "md", label, className }: CategoryIconProps) {
  const Icon = ICON_REGISTRY[icon];
  return (
    <span
      className={cn(styles.tile, styles[size], className)}
      style={{ "--tile-color": `var(--swatch-${color})` } as React.CSSProperties}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <Icon aria-hidden="true" />
    </span>
  );
}
