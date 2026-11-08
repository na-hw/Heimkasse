import { BaseRepository, type RepositoryDeps } from "@/lib/db/repository";
import {
  type Attachment,
  type AttachmentCreate,
  type AttachmentUpdate,
  attachmentCreateSchema,
  attachmentSchema,
  attachmentUpdateSchema,
} from "./schemas";

export class AttachmentsRepository extends BaseRepository<Attachment, AttachmentCreate, AttachmentUpdate> {
  constructor(deps: RepositoryDeps) {
    super(
      "attachments",
      { entity: attachmentSchema, create: attachmentCreateSchema, update: attachmentUpdateSchema },
      deps,
    );
  }
}
