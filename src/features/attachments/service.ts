import type { Repositories } from "@/features/repositories";
import { AppError } from "@/lib/errors/AppError";
import { createId } from "@/lib/utils/id";
import {
  ATTACHMENT_MIME_TYPES,
  type Attachment,
  type AttachmentEntityType,
  type AttachmentMimeType,
} from "./schemas";

export const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024;
export const ATTACHMENT_ACCEPT = "image/jpeg,image/png,image/webp,image/heic,application/pdf,.heic";

const EXTENSION_MIME: Record<string, AttachmentMimeType> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  pdf: "application/pdf",
};
const MIME_EXTENSION: Record<AttachmentMimeType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "application/pdf": "pdf",
};

/** Mime type from the browser or, if missing (HEIC often is), from the extension. */
export function resolveMimeType(fileName: string, type: string): AttachmentMimeType | null {
  if ((ATTACHMENT_MIME_TYPES as readonly string[]).includes(type))
    return type as AttachmentMimeType;
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";
  return EXTENSION_MIME[extension] ?? null;
}

/** Images the webview can display inline (HEIC can only be saved). */
export function isPreviewableImage(mime: AttachmentMimeType): boolean {
  return mime === "image/jpeg" || mime === "image/png" || mime === "image/webp";
}

export type AttachmentRejection = "type" | "size";

export interface NewAttachment {
  entityType: AttachmentEntityType;
  entityId: string;
  fileName: string;
  type: string;
  bytes: Uint8Array;
}

/** Validates type/size; returns the reason if the file can't be attached. */
export function checkAttachment(file: Pick<NewAttachment, "fileName" | "type" | "bytes">) {
  if (!resolveMimeType(file.fileName, file.type)) return "type" as const;
  if (file.bytes.byteLength > MAX_ATTACHMENT_BYTES) return "size" as const;
  return null;
}

/**
 * Stores the file first, then the database row; if the row can't be
 * written, the file is removed again (no orphans).
 */
export async function addAttachment(
  repos: Repositories,
  input: NewAttachment,
): Promise<Attachment> {
  const mime = resolveMimeType(input.fileName, input.type);
  if (!mime || input.bytes.byteLength > MAX_ATTACHMENT_BYTES) {
    throw new AppError("validation_failed", input.fileName);
  }
  const path = `attachments/${createId()}.${MIME_EXTENSION[mime]}`;
  await repos.files.write(path, input.bytes);
  try {
    return await repos.attachments.create({
      entity_type: input.entityType,
      entity_id: input.entityId,
      file_name: input.fileName.slice(0, 255) || path,
      mime_type: mime,
      file_path: path,
      size_bytes: input.bytes.byteLength,
    });
  } catch (error) {
    await repos.files.remove(path);
    throw error;
  }
}

async function removeFiles(repos: Repositories, attachments: readonly Attachment[]) {
  // Files go after the rows are gone; a failed file removal never resurrects a row.
  await Promise.allSettled(attachments.map((a) => repos.files.remove(a.file_path)));
}

/** Permanently deletes attachment rows and their files. */
export async function purgeAttachments(
  repos: Repositories,
  attachments: readonly Attachment[],
): Promise<void> {
  await repos.attachments.purge(attachments.map((a) => a.id));
  await removeFiles(repos, attachments);
}

/** All attachments (incl. deleted ones) of the given parents. */
export function attachmentsOf(
  repos: Repositories,
  entityType: AttachmentEntityType,
  entityIds: readonly string[],
): Promise<Attachment[]> {
  return repos.attachments.list({
    where: [
      { field: "entity_type", op: "eq", value: entityType },
      { field: "entity_id", op: "in", values: [...entityIds] },
    ],
    deleted: "include",
  });
}

/** Purges parents (transactions/contracts) together with their attachments (rows atomic, then files). */
export async function purgeWithAttachments(
  repos: Repositories,
  entityType: AttachmentEntityType,
  ids: readonly string[],
): Promise<void> {
  const attachments = await attachmentsOf(repos, entityType, ids);
  const parent = entityType === "transaction" ? repos.transactions : repos.contracts;
  await repos.storage.write([
    ...repos.attachments.preparePurge(attachments.map((a) => a.id)),
    ...parent.preparePurge(ids),
  ]);
  await removeFiles(repos, attachments);
}

/** Attachments removed by the user (undo window is over after a restart) are purged with their files. */
export async function cleanupDeletedAttachments(repos: Repositories): Promise<number> {
  const deleted = await repos.attachments.list({ deleted: "only" });
  if (deleted.length > 0) await purgeAttachments(repos, deleted);
  return deleted.length;
}
