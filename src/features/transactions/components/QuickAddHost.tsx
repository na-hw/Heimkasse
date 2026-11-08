"use client";

import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Fab } from "@/components/ui";
import { useModHotkey } from "@/lib/utils/useHotkey";
import { useTransactionEditor } from "../editorStore";
import { TransactionFormDialog } from "./TransactionFormDialog";

/** Global quick add: ⌘N / Ctrl+N anywhere, floating "+" on phones. */
export function QuickAddHost() {
  const { t } = useTranslation();
  const openCreate = useTransactionEditor((s) => s.openCreate);
  useModHotkey("n", () => openCreate());
  return (
    <>
      <Fab label={t("nav.quickAdd")} icon={<Plus />} onClick={() => openCreate()} />
      <TransactionFormDialog />
    </>
  );
}
