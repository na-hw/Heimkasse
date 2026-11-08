"use client";

import { Download, FileText, Paperclip, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Dialog,
  EmptyState,
  ErrorState,
  FileInput,
  IconButton,
  Skeleton,
} from "@/components/ui";
import { useErrorMessage } from "@/lib/errors/useErrorMessage";
import { useFormat } from "@/lib/i18n/useFormat";
import { useAttachmentImage, useAttachmentMutations, useAttachments } from "../hooks";
import type { Attachment, AttachmentEntityType } from "../schemas";
import { ATTACHMENT_ACCEPT, isPreviewableImage } from "../service";
import styles from "./AttachmentsDialog.module.css";

export interface AttachmentsTarget {
  entityType: AttachmentEntityType;
  entityId: string;
  /** Name of the transaction/contract (dialog title). */
  title: string;
}

function Thumbnail({ attachment, onOpen }: { attachment: Attachment; onOpen: () => void }) {
  const { t } = useTranslation();
  const previewable = isPreviewableImage(attachment.mime_type);
  const image = useAttachmentImage(attachment, previewable);
  if (!previewable) {
    return (
      <span className={styles.fileIcon} aria-hidden="true">
        <FileText />
      </span>
    );
  }
  if (!image.data) return <Skeleton width={56} height={56} radius="md" />;
  return (
    <button
      type="button"
      className={styles.thumbButton}
      onClick={onOpen}
      aria-label={t("attachments.preview", { name: attachment.file_name })}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- local data URL, no optimisation possible */}
      <img src={image.data} alt="" className={styles.thumb} />
    </button>
  );
}

function Preview({ attachment, onClose }: { attachment: Attachment; onClose: () => void }) {
  const { t } = useTranslation();
  const image = useAttachmentImage(attachment, true);
  return (
    <figure className={styles.preview}>
      {image.data ? (
        // eslint-disable-next-line @next/next/no-img-element -- local data URL, no optimisation possible
        <img src={image.data} alt={attachment.file_name} className={styles.previewImage} />
      ) : (
        <Skeleton height="16rem" />
      )}
      <figcaption className={styles.caption}>
        <span>{attachment.file_name}</span>
        <Button size="sm" onClick={onClose}>
          {t("attachments.backToList")}
        </Button>
      </figcaption>
    </figure>
  );
}

/** Receipts of a transaction or contract: add, preview (images), save and delete. */
export function AttachmentsDialog({
  target,
  onClose,
}: {
  target: AttachmentsTarget | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const format = useFormat();
  const errorMessage = useErrorMessage();
  const attachments = useAttachments(target?.entityType ?? "transaction", target?.entityId ?? null);
  const { add, addFiles, remove, download } = useAttachmentMutations();
  const [previewId, setPreviewId] = useState<string | null>(null);
  const preview = attachments.data.find((a) => a.id === previewId);

  const picker = target && (
    <FileInput
      multiple
      accept={ATTACHMENT_ACCEPT}
      icon={<Paperclip />}
      loading={add.isPending}
      onFiles={(files) => void addFiles(target.entityType, target.entityId, files)}
    >
      {t("attachments.add")}
    </FileInput>
  );

  return (
    <Dialog
      open={target !== null}
      onOpenChange={(next) => {
        if (!next) {
          setPreviewId(null);
          onClose();
        }
      }}
      title={t("attachments.title", { name: target?.title ?? "" })}
      description={t("attachments.hint")}
    >
      {preview ? (
        <Preview attachment={preview} onClose={() => setPreviewId(null)} />
      ) : attachments.isError ? (
        <ErrorState
          description={errorMessage(attachments.error)}
          onRetry={() => void attachments.refetch()}
        />
      ) : attachments.isPending ? (
        <Skeleton height="4rem" />
      ) : attachments.data.length === 0 ? (
        <EmptyState
          headingLevel={3}
          icon={<Paperclip />}
          title={t("attachments.empty.title")}
          description={t("attachments.empty.text")}
          action={picker}
        />
      ) : (
        <div className={styles.body}>
          <ul className={styles.list} aria-label={t("attachments.listLabel")}>
            {attachments.data.map((a) => (
              <li key={a.id} className={styles.item}>
                <Thumbnail attachment={a} onOpen={() => setPreviewId(a.id)} />
                <div className={styles.text}>
                  <span className={styles.name}>{a.file_name}</span>
                  <span className={styles.meta}>
                    {format.fileSize(a.size_bytes)} · {format.date(a.created_at.slice(0, 10))}
                  </span>
                </div>
                <IconButton
                  label={t("attachments.save", { name: a.file_name })}
                  icon={<Download />}
                  onClick={() => void download(a)}
                />
                <IconButton
                  label={t("attachments.delete", { name: a.file_name })}
                  icon={<Trash2 />}
                  onClick={() => remove.mutate(a)}
                />
              </li>
            ))}
          </ul>
          <div>{picker}</div>
        </div>
      )}
    </Dialog>
  );
}
