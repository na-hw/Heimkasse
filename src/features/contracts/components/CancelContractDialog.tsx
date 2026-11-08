"use client";

import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { DatePicker, Dialog, FormField } from "@/components/ui";
import { FormDialogFooter } from "@/features/shared/components/FormDialogFooter";
import styles from "@/features/shared/components/EntityList.module.css";
import { todayIso } from "@/lib/utils/dates";
import { endIfCancelledOn } from "../deadlines";
import { type ContractView, useContractMutations } from "../hooks";

/** Suggested end date: end of the current term, or the earliest possible end. */
function suggestedEnd({ info, contract }: ContractView): string {
  if (info?.kind === "open") return info.earliestEnd;
  if (info) return info.termEnd;
  return endIfCancelledOn(todayIso(), contract.notice_period_value, contract.notice_period_unit);
}

interface Props {
  view: ContractView | null;
  onClose: () => void;
}

/** Asks for the effective end date when a contract was cancelled. */
export function CancelContractDialog({ view, onClose }: Props) {
  const { t } = useTranslation();
  const formId = useId();
  const { cancel } = useContractMutations();

  return (
    <Dialog
      open={view !== null}
      onOpenChange={(open) => !open && onClose()}
      title={t("contracts.cancelDialog.title")}
      description={t("contracts.cancelDialog.text", { name: view?.contract.name ?? "" })}
      footer={
        <FormDialogFooter
          formId={formId}
          submitLabel={t("contracts.cancelDialog.confirm")}
          loading={cancel.isPending}
          onCancel={onClose}
        />
      }
    >
      {view && (
        <EndDateForm
          key={view.contract.id}
          formId={formId}
          initial={suggestedEnd(view)}
          onSubmit={(endDate) =>
            void cancel.mutateAsync({ contract: view.contract, endDate }).then(onClose)
          }
        />
      )}
    </Dialog>
  );
}

function EndDateForm({
  formId,
  initial,
  onSubmit,
}: {
  formId: string;
  initial: string;
  onSubmit: (endDate: string) => void;
}) {
  const { t } = useTranslation();
  const [endDate, setEndDate] = useState<string | null>(initial);
  return (
    <form
      id={formId}
      className={styles.form}
      onSubmit={(e) => {
        e.preventDefault();
        if (endDate) onSubmit(endDate);
      }}
    >
      <FormField label={t("contracts.cancelDialog.endDate")} required>
        <DatePicker value={endDate} onChange={setEndDate} />
      </FormField>
    </form>
  );
}
