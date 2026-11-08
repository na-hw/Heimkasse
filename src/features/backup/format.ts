import { z } from "zod";
import { TABLE_NAMES, type TableName } from "@/lib/db/schema";

/** Version of the backup file layout (not the database schema). */
export const BACKUP_FORMAT_VERSION = 1;
export const BACKUP_APP_ID = "heimkasse";

/**
 * Device-specific settings that are neither exported nor overwritten by a
 * restore: the app lock (password) and the auto-backup folder.
 */
export const DEVICE_SETTING_KEYS: readonly string[] = ["app_lock", "auto_backup"];

/** Attachment files are only ever stored below `attachments/` with a generated name. */
export const BACKUP_FILE_PATH = /^attachments\/[A-Za-z0-9-]{1,64}\.[a-z0-9]{1,8}$/;

const tablesShape = Object.fromEntries(
  TABLE_NAMES.map((name) => [name, z.array(z.record(z.string(), z.unknown())).default([])]),
) as Record<TableName, z.ZodDefault<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnknown>>>>;

/** Envelope of a backup file. Rows are validated per table afterwards. */
export const backupEnvelopeSchema = z.object({
  app: z.literal(BACKUP_APP_ID),
  format: z.number().int().min(1),
  schemaVersion: z.number().int().min(1),
  exportedAt: z.iso.datetime(),
  tables: z.strictObject(tablesShape),
  files: z
    .array(
      z.object({
        path: z.string().regex(BACKUP_FILE_PATH),
        /** Base64-encoded file content. */
        data: z.base64(),
      }),
    )
    .default([]),
});

export type BackupEnvelope = z.infer<typeof backupEnvelopeSchema>;

/** A validated backup ready to restore. */
export interface Backup {
  schemaVersion: number;
  exportedAt: string;
  tables: Record<TableName, Record<string, unknown>[]>;
  files: Array<{ path: string; data: Uint8Array }>;
}

export function backupCounts(backup: Backup): Record<TableName, number> {
  return Object.fromEntries(
    TABLE_NAMES.map((name) => [name, backup.tables[name].length]),
  ) as Record<TableName, number>;
}

/** "heimkasse-backup-2026-11-08-1530.json" (local time). */
export function backupFileName(now: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `heimkasse-backup-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}.json`;
}

export const BACKUP_FILE_NAME = /^heimkasse-backup-\d{4}-\d{2}-\d{2}-\d{4}\.json$/;
