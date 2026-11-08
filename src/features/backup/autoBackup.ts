import { z } from "zod";
import type { Repositories } from "@/features/repositories";
import { BACKUP_FILE_NAME, backupFileName } from "./format";
import { createBackupJson } from "./service";

export const AUTO_BACKUP_KEY = "auto_backup";
export const AUTO_BACKUP_FREQUENCIES = ["daily", "weekly"] as const;
export type AutoBackupFrequency = (typeof AUTO_BACKUP_FREQUENCIES)[number];

/** Automatic backups (desktop only); stored in the settings row `auto_backup`. */
export const autoBackupConfigSchema = z.object({
  enabled: z.boolean(),
  folder: z.string().min(1).max(4096).nullable(),
  frequency: z.enum(AUTO_BACKUP_FREQUENCIES),
  /** Number of automatic backup files kept in the folder. */
  keep: z.number().int().min(1).max(100),
  lastRunAt: z.iso.datetime().nullable(),
  /** Message of the last failure (shown in settings), cleared on success. */
  lastError: z.string().max(500).nullable(),
});
export type AutoBackupConfig = z.infer<typeof autoBackupConfigSchema>;

export const DEFAULT_AUTO_BACKUP: AutoBackupConfig = {
  enabled: false,
  folder: null,
  frequency: "weekly",
  keep: 10,
  lastRunAt: null,
  lastError: null,
};

const INTERVAL_MS: Record<AutoBackupFrequency, number> = {
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
};

/** True if enabled, a folder is set and the interval since the last run has passed. */
export function isAutoBackupDue(config: AutoBackupConfig, now: Date): boolean {
  if (!config.enabled || !config.folder) return false;
  if (!config.lastRunAt) return true;
  return now.getTime() - new Date(config.lastRunAt).getTime() >= INTERVAL_MS[config.frequency];
}

/** Backup files beyond the newest `keep` (other files in the folder are never touched). */
export function backupsToPrune(fileNames: readonly string[], keep: number): string[] {
  return fileNames
    .filter((n) => BACKUP_FILE_NAME.test(n))
    .sort()
    .reverse()
    .slice(keep);
}

export function loadAutoBackupConfig(repos: Repositories): Promise<AutoBackupConfig> {
  return repos.settings.getValue(AUTO_BACKUP_KEY, autoBackupConfigSchema, DEFAULT_AUTO_BACKUP);
}

export async function saveAutoBackupConfig(
  repos: Repositories,
  config: AutoBackupConfig,
): Promise<void> {
  await repos.settings.setValue(AUTO_BACKUP_KEY, autoBackupConfigSchema.parse(config));
}

/**
 * Writes a backup into the configured folder (Tauri only) and prunes old
 * automatic backups. The folder is in the fs scope because the user picked
 * it in the dialog (persisted across restarts by tauri-plugin-persisted-scope).
 */
export async function writeAutoBackup(repos: Repositories, folder: string, keep: number) {
  const [{ join }, fs] = await Promise.all([
    import("@tauri-apps/api/path"),
    import("@tauri-apps/plugin-fs"),
  ]);
  const now = new Date();
  const path = await join(folder, backupFileName(now));
  await fs.writeFile(
    path,
    new TextEncoder().encode(await createBackupJson(repos, now.toISOString())),
  );
  const entries = await fs.readDir(folder);
  const prune = backupsToPrune(
    entries.filter((e) => e.isFile).map((e) => e.name),
    keep,
  );
  for (const name of prune) await fs.remove(await join(folder, name));
  return path;
}

/** Runs the automatic backup if due; records success or failure in the config. */
export async function runAutoBackupIfDue(repos: Repositories, now = new Date()) {
  const config = await loadAutoBackupConfig(repos);
  if (!isAutoBackupDue(config, now) || !config.folder) return null;
  return runAutoBackup(repos, config);
}

export async function runAutoBackup(repos: Repositories, config: AutoBackupConfig) {
  if (!config.folder) return null;
  try {
    const path = await writeAutoBackup(repos, config.folder, config.keep);
    await saveAutoBackupConfig(repos, {
      ...config,
      lastRunAt: new Date().toISOString(),
      lastError: null,
    });
    return path;
  } catch (error) {
    await saveAutoBackupConfig(repos, {
      ...config,
      lastError: String(error instanceof Error ? error.message : error).slice(0, 500),
    });
    throw error;
  }
}

/** Lets the user pick the backup folder (adds it to the fs scope). */
export async function pickBackupFolder(): Promise<string | null> {
  const { open } = await import("@tauri-apps/plugin-dialog");
  const folder = await open({ directory: true, multiple: false, recursive: true });
  return typeof folder === "string" ? folder : null;
}
