import type { LucideIcon, LucideProps } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface DirectionalIconProps extends LucideProps {
  icon: LucideIcon;
}

/**
 * Renders an icon that points in the reading direction (arrows, chevrons).
 * Authored for LTR; mirrored automatically in RTL.
 */
export function DirectionalIcon({ icon: Icon, className, ...props }: DirectionalIconProps) {
  return <Icon aria-hidden="true" className={cn("flip-rtl", className)} {...props} />;
}
