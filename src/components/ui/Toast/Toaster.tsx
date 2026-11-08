"use client";

import { CircleAlert, CircleCheck, Info, X } from "lucide-react";
import { Toast as ToastPrimitive } from "radix-ui";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils/cn";
import { type ToastTone, useToastStore } from "./toastStore";
import styles from "./Toast.module.css";

const ICONS: Record<ToastTone, typeof Info> = {
  success: CircleCheck,
  error: CircleAlert,
  info: Info,
};

/**
 * Renders queued toasts. Radix announces them via an aria-live region;
 * errors use the assertive "foreground" type. F8 focuses the region.
 */
export function Toaster({ dir }: { dir: "ltr" | "rtl" }) {
  const { t } = useTranslation();
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <ToastPrimitive.Provider
      swipeDirection={dir === "rtl" ? "left" : "right"}
      label={t("toast.region", { hotkey: "F8" })}
    >
      {toasts.map((item) => {
        const Icon = ICONS[item.tone];
        return (
          <ToastPrimitive.Root
            key={item.id}
            duration={item.duration}
            type={item.tone === "error" ? "foreground" : "background"}
            onOpenChange={(open) => {
              if (!open) dismiss(item.id);
            }}
            className={cn(styles.toast, styles[item.tone])}
          >
            <Icon className={styles.icon} aria-hidden="true" />
            <div className={styles.text}>
              <ToastPrimitive.Title className={styles.title}>{item.title}</ToastPrimitive.Title>
              {item.description && (
                <ToastPrimitive.Description className={styles.description}>
                  {item.description}
                </ToastPrimitive.Description>
              )}
            </div>
            {item.action && (
              <ToastPrimitive.Action
                altText={item.action.altText}
                className={styles.action}
                onClick={item.action.onAction}
              >
                {item.action.label}
              </ToastPrimitive.Action>
            )}
            <ToastPrimitive.Close className={styles.close} aria-label={t("toast.dismiss")}>
              <X size={16} aria-hidden="true" />
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        );
      })}
      <ToastPrimitive.Viewport className={styles.viewport} />
    </ToastPrimitive.Provider>
  );
}
