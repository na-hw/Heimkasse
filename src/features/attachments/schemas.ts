import { z } from "zod";
import { baseEntitySchema, idSchema, requiredText } from "@/lib/validation/common";

export const ATTACHMENT_ENTITY_TYPES = ["transaction", "contract"] as const;
export const ATTACHMENT_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/pdf",
] as const;

const fields = {
  entity_type: z.enum(ATTACHMENT_ENTITY_TYPES),
  entity_id: idSchema,
  file_name: requiredText(255),
  mime_type: z.enum(ATTACHMENT_MIME_TYPES),
  /** Path relative to the app data folder. */
  file_path: requiredText(1024),
  size_bytes: z.number().int().min(0),
};

export const attachmentSchema = baseEntitySchema.extend(fields);
export const attachmentCreateSchema = z.object(fields);
export const attachmentUpdateSchema = z.object({ file_name: fields.file_name }).partial();

export type Attachment = z.infer<typeof attachmentSchema>;
export type AttachmentCreate = z.input<typeof attachmentCreateSchema>;
export type AttachmentUpdate = z.input<typeof attachmentUpdateSchema>;
