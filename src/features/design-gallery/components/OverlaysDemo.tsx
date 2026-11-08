"use client";

import { Copy, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  ConfirmDialog,
  Dialog,
  DialogClose,
  DropdownMenu,
  IconButton,
  Popover,
  Sheet,
  Tabs,
  Tooltip,
  toast,
} from "@/components/ui";
import { GallerySection } from "./GallerySection";
import styles from "./DesignGallery.module.css";

export function OverlaysDemo() {
  const { t } = useTranslation();
  const [confirmOpen, setConfirmOpen] = useState(false);
  return (
    <GallerySection title={t("design.sections.overlays")}>
      <div className={styles.row}>
        <Dialog
          trigger={<Button>{t("design.overlays.openDialog")}</Button>}
          title={t("design.overlays.dialogTitle")}
          description={t("design.overlays.dialogText")}
          footer={
            <DialogClose asChild>
              <Button variant="primary">{t("common.close")}</Button>
            </DialogClose>
          }
        />
        <Button variant="danger" onClick={() => setConfirmOpen(true)}>
          {t("design.overlays.openConfirm")}
        </Button>
        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title={t("design.overlays.confirmTitle")}
          description={t("design.overlays.confirmText")}
          confirmLabel={t("common.delete")}
          confirmationWord={t("design.overlays.confirmWord")}
          onConfirm={() => {
            toast.success(t("design.feedback.toastDeletedTitle"));
          }}
        />
        <Sheet trigger={<Button>{t("design.overlays.openSheet")}</Button>} title={t("design.overlays.sheetTitle")}>
          <p>{t("design.overlays.dialogText")}</p>
        </Sheet>
        <Popover trigger={<Button>{t("design.overlays.popover")}</Button>} label={t("design.overlays.popover")}>
          <p>{t("design.overlays.popoverText")}</p>
        </Popover>
        <Tooltip content={t("design.overlays.tooltip")}>
          <Button variant="ghost">{t("design.overlays.tooltip")}</Button>
        </Tooltip>
        <DropdownMenu
          trigger={<IconButton label={t("design.overlays.openMenu")} icon={<MoreHorizontal />} variant="secondary" />}
          items={[
            { id: "edit", label: t("common.edit"), icon: <Pencil />, onSelect: () => toast.success(t("common.edit")) },
            { id: "dup", label: t("common.add"), icon: <Copy />, onSelect: () => toast.success(t("common.add")) },
            { type: "separator", id: "sep" },
            { id: "del", label: t("common.delete"), icon: <Trash2 />, tone: "danger", onSelect: () => setConfirmOpen(true) },
          ]}
        />
      </div>
      <Tabs
        label={t("design.sections.overlays")}
        items={[
          { value: "a", label: t("theme.light"), content: <p>{t("design.overlays.popoverText")}</p> },
          { value: "b", label: t("theme.dark"), content: <p>{t("design.overlays.dialogText")}</p> },
        ]}
      />
    </GallerySection>
  );
}
