import { isTauriRuntime } from "@/lib/db/runtime";

/**
 * Shows a native system notification in the desktop app (asks for permission
 * once). Returns false in the browser or when permission is denied – callers
 * always show an in-app toast as well.
 */
export async function notifyNative(title: string, body: string): Promise<boolean> {
  if (!(await isTauriRuntime())) return false;
  const { isPermissionGranted, requestPermission, sendNotification } =
    await import("@tauri-apps/plugin-notification");
  let granted = await isPermissionGranted();
  if (!granted) granted = (await requestPermission()) === "granted";
  if (granted) sendNotification({ title, body });
  return granted;
}
