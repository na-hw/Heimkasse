import { isTauriRuntime } from "@/lib/db/runtime";

export interface SaveFileInput {
  fileName: string;
  mimeType: string;
  data: string | Uint8Array;
}

/**
 * Saves an export. Desktop: native "Save as" dialog, then writes the chosen
 * file. Browser: regular download. Returns false if the user cancelled.
 */
export async function saveFile({ fileName, mimeType, data }: SaveFileInput): Promise<boolean> {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  if (await isTauriRuntime()) {
    const [{ save }, { writeFile }] = await Promise.all([
      import("@tauri-apps/plugin-dialog"),
      import("@tauri-apps/plugin-fs"),
    ]);
    const extension = fileName.split(".").pop() ?? "";
    const path = await save({
      defaultPath: fileName,
      filters: extension ? [{ name: extension.toUpperCase(), extensions: [extension] }] : undefined,
    });
    if (!path) return false;
    await writeFile(path, bytes);
    return true;
  }
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: mimeType }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.rel = "noopener";
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}
