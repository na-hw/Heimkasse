import { create } from "zustand";
import { createId } from "@/lib/utils/id";

export type ToastTone = "success" | "error" | "info";

export interface ToastAction {
  label: string;
  /** Describes the action for screen readers when the toast is announced. */
  altText: string;
  onAction: () => void;
}

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
  action?: ToastAction;
  /** Milliseconds; toasts with an action stay longer by default. */
  duration: number;
}

interface ToastState {
  toasts: ToastItem[];
  show: (
    toast: Omit<ToastItem, "id" | "duration" | "tone"> &
      Partial<Pick<ToastItem, "duration" | "tone">>,
  ) => string;
  dismiss: (id: string) => void;
}

const MAX_VISIBLE = 3;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  show: (input) => {
    const id = createId();
    const toast: ToastItem = {
      tone: "info",
      duration: input.action ? 8000 : 4000,
      ...input,
      id,
    };
    set((s) => ({ toasts: [...s.toasts, toast].slice(-MAX_VISIBLE) }));
    return id;
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Imperative API usable from hooks and mutation callbacks. */
export const toast = {
  show: (input: Parameters<ToastState["show"]>[0]) => useToastStore.getState().show(input),
  success: (title: string, extra?: Partial<Omit<ToastItem, "id" | "title" | "tone">>) =>
    useToastStore.getState().show({ title, tone: "success", ...extra }),
  error: (title: string, extra?: Partial<Omit<ToastItem, "id" | "title" | "tone">>) =>
    useToastStore.getState().show({ title, tone: "error", ...extra }),
  dismiss: (id: string) => useToastStore.getState().dismiss(id),
};
