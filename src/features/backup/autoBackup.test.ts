import { describe, expect, it } from "vitest";
import { DEFAULT_AUTO_BACKUP, backupsToPrune, isAutoBackupDue } from "./autoBackup";

describe("auto backup", () => {
  const base = { ...DEFAULT_AUTO_BACKUP, enabled: true, folder: "/Backups" };
  const now = new Date("2026-11-08T10:00:00.000Z");

  it("is due when enabled with a folder and the interval has passed", () => {
    expect(isAutoBackupDue({ ...base, enabled: false }, now)).toBe(false);
    expect(isAutoBackupDue({ ...base, folder: null }, now)).toBe(false);
    expect(isAutoBackupDue(base, now)).toBe(true);
    const daily = { ...base, frequency: "daily" as const };
    expect(isAutoBackupDue({ ...daily, lastRunAt: "2026-11-07T11:00:00.000Z" }, now)).toBe(false);
    expect(isAutoBackupDue({ ...daily, lastRunAt: "2026-11-07T10:00:00.000Z" }, now)).toBe(true);
    expect(isAutoBackupDue({ ...base, lastRunAt: "2026-11-03T10:00:00.000Z" }, now)).toBe(false);
    expect(isAutoBackupDue({ ...base, lastRunAt: "2026-11-01T10:00:00.000Z" }, now)).toBe(true);
  });

  it("prunes only old automatic backup files", () => {
    const files = [
      "heimkasse-backup-2026-11-01-1000.json",
      "notes.txt",
      "heimkasse-backup-2026-11-08-1000.json",
      "heimkasse-backup-2026-10-25-1000.json",
      "heimkasse-backup-2026-11-07-2300.json",
    ];
    expect(backupsToPrune(files, 2)).toEqual([
      "heimkasse-backup-2026-11-01-1000.json",
      "heimkasse-backup-2026-10-25-1000.json",
    ]);
    expect(backupsToPrune(files, 10)).toEqual([]);
  });
});
