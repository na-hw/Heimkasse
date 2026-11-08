"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useRepositories } from "@/components/providers/RepositoriesContext";
import { announce, toast } from "@/components/ui";
import { queryKeys } from "@/features/queryKeys";
import { useDataMutation } from "@/features/shared/useDataMutation";
import { saveFile } from "@/lib/export/saveFile";
import { useErrorMessage } from "@/lib/errors/useErrorMessage";
import type { Attachment, AttachmentEntityType } from "./schemas";
import { type NewAttachment, addAttachment, checkAttachment } from "./service";

/** All active attachments (small rows; files are loaded on demand). */
function useAllAttachments() {
  const repos = useRepositories();
  return useQuery({
    queryKey: [...queryKeys.attachments, "list"],
    queryFn: () => repos.attachments.list({ orderBy: [{ field: "created_at" }] }),
  });
}

/** Attachments of one transaction or contract. */
export function useAttachments(entityType: AttachmentEntityType, entityId: string | null) {
  const query = useAllAttachments();
  const data = useMemo(
    () => query.data?.filter((a) => a.entity_type === entityType && a.entity_id === entityId) ?? [],
    [query.data, entityType, entityId],
  );
  return { ...query, data };
}

/** Number of attachments per entity id (for paperclip indicators). */
export function useAttachmentCounts(entityType: AttachmentEntityType) {
  const query = useAllAttachments();
  return useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of query.data ?? []) {
      if (a.entity_type === entityType) counts.set(a.entity_id, (counts.get(a.entity_id) ?? 0) + 1);
    }
    return counts;
  }, [query.data, entityType]);
}

function toDataUrl(bytes: Uint8Array, mime: string): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return `data:${mime};base64,${btoa(binary)}`;
}

/** Image as data URL (allowed by the CSP, nothing to revoke). Only for previewable images. */
export function useAttachmentImage(attachment: Attachment, enabled: boolean) {
  const repos = useRepositories();
  return useQuery({
    queryKey: [...queryKeys.attachments, "image", attachment.id],
    queryFn: async () =>
      toDataUrl(await repos.files.read(attachment.file_path), attachment.mime_type),
    enabled,
    staleTime: Number.POSITIVE_INFINITY,
  });
}

export function useAttachmentMutations() {
  const { t } = useTranslation();
  const repos = useRepositories();
  const errorMessage = useErrorMessage();

  const add = useDataMutation({
    mutationFn: async (r, files: NewAttachment[]) => {
      for (const file of files) await addAttachment(r, file);
      return files.length;
    },
    onSuccess: (count) => toast.success(t("attachments.added", { count })),
  });

  const restore = useDataMutation({
    mutationFn: (r, id: string) => r.attachments.restore([id]),
    onSuccess: () => announce(t("transactions.restored")),
  });

  const remove = useDataMutation({
    mutationFn: (r, attachment: Attachment) => r.attachments.softDelete([attachment.id]),
    onSuccess: (_r, attachment) =>
      toast.show({
        title: t("attachments.deleted", { name: attachment.file_name }),
        tone: "success",
        action: {
          label: t("common.undo"),
          altText: t("common.undo"),
          onAction: () => restore.mutate(attachment.id),
        },
      }),
  });

  /** Picks files, rejects invalid ones with a toast and stores the rest. */
  const addFiles = async (entityType: AttachmentEntityType, entityId: string, files: File[]) => {
    const accepted: NewAttachment[] = [];
    for (const file of files) {
      const candidate = {
        entityType,
        entityId,
        fileName: file.name,
        type: file.type,
        bytes: new Uint8Array(await file.arrayBuffer()),
      };
      const problem = checkAttachment(candidate);
      if (problem) toast.error(t(`attachments.rejected.${problem}`), { description: file.name });
      else accepted.push(candidate);
    }
    if (accepted.length > 0) await add.mutateAsync(accepted);
  };

  /** Opens the system "save as" dialog (desktop) or downloads the file (browser). */
  const download = async (attachment: Attachment) => {
    try {
      await saveFile({
        fileName: attachment.file_name,
        mimeType: attachment.mime_type,
        data: await repos.files.read(attachment.file_path),
      });
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return { add, addFiles, remove, download };
}
