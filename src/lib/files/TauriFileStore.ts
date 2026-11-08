import type { FileStore } from "./types";

/** Only these folders inside the app data directory are used (and allowed in the capability). */
export const FILE_ROOTS = ["attachments"] as const;

/**
 * Files in the app data directory (desktop/mobile) via tauri-plugin-fs.
 * The capability limits access to `$APPDATA/attachments/**`.
 */
export class TauriFileStore implements FileStore {
  readonly kind = "appdata" as const;

  private async fs() {
    return import("@tauri-apps/plugin-fs");
  }

  async write(path: string, data: Uint8Array): Promise<void> {
    const { BaseDirectory, mkdir, writeFile } = await this.fs();
    const dir = path.split("/").slice(0, -1).join("/");
    if (dir) await mkdir(dir, { baseDir: BaseDirectory.AppData, recursive: true });
    await writeFile(path, data, { baseDir: BaseDirectory.AppData });
  }

  async read(path: string): Promise<Uint8Array> {
    const { BaseDirectory, readFile } = await this.fs();
    return readFile(path, { baseDir: BaseDirectory.AppData });
  }

  async remove(path: string): Promise<void> {
    const { BaseDirectory, exists, remove } = await this.fs();
    if (await exists(path, { baseDir: BaseDirectory.AppData })) {
      await remove(path, { baseDir: BaseDirectory.AppData });
    }
  }

  async list(): Promise<string[]> {
    const { BaseDirectory, exists, readDir } = await this.fs();
    const paths: string[] = [];
    for (const root of FILE_ROOTS) {
      if (!(await exists(root, { baseDir: BaseDirectory.AppData }))) continue;
      for (const entry of await readDir(root, { baseDir: BaseDirectory.AppData })) {
        if (entry.isFile) paths.push(`${root}/${entry.name}`);
      }
    }
    return paths;
  }
}
