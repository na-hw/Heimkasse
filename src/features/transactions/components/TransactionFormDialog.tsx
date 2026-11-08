"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Landmark } from "lucide-react";
import Link from "next/link";
import { useId } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Button, DatePicker, Dialog, EmptyState, FormField } from "@/components/ui";
import { useAccounts } from "@/features/accounts/hooks";
import type { Account } from "@/features/accounts/schemas";
import { FormDialogFooter } from "@/features/shared/components/FormDialogFooter";
import { useUiStore } from "@/lib/preferences/uiStore";
import { todayIso } from "@/lib/utils/dates";
import { type EditorMode, useTransactionEditor } from "../editorStore";
import { useTransactionMutations } from "../hooks";
import { type Transaction, type TransactionCreate, transactionCreateSchema } from "../schemas";
import { TransactionFields } from "./TransactionFields";
import styles from "./TransactionForm.module.css";

function initialValues(
  mode: EditorMode,
  tx: Transaction | null,
  defaults: Partial<TransactionCreate>,
  accountId: string,
): TransactionCreate {
  if (tx) {
    return {
      type: tx.type,
      amount_cents: tx.amount_cents,
      date: mode === "duplicate" ? todayIso() : tx.date,
      account_id: tx.account_id,
      transfer_account_id: tx.transfer_account_id,
      category_id: tx.category_id,
      payee: tx.payee,
      note: tx.note,
      payment_method: tx.payment_method,
      tags: tx.tags,
      tax_category: tx.tax_category,
    };
  }
  return {
    type: "expense",
    amount_cents: null as unknown as number,
    date: todayIso(),
    account_id: accountId,
    transfer_account_id: null,
    category_id: null,
    payee: "",
    note: "",
    payment_method: null,
    tags: [],
    tax_category: null,
    ...defaults,
  };
}

/** The form is mounted fresh for every opening, so defaults always apply. */
function TransactionForm({ formId, accounts, onDone }: { formId: string; accounts: Account[]; onDone: () => void }) {
  const { t } = useTranslation();
  const { mode, transaction, defaults } = useTransactionEditor();
  const lastAccountId = useUiStore((s) => s.lastAccountId);
  const { create, update } = useTransactionMutations();
  const fallbackAccount = accounts.find((a) => a.id === lastAccountId)?.id ?? accounts[0]?.id ?? "";
  const form = useForm<TransactionCreate>({
    resolver: zodResolver(transactionCreateSchema),
    defaultValues: initialValues(mode, transaction, defaults, fallbackAccount),
  });

  // Archived accounts stay selectable when editing a transaction that uses them.
  const usedArchived = transaction
    ? accounts.filter((a) => a.id === transaction.account_id || a.id === transaction.transfer_account_id)
    : [];
  const selectable = [...new Map([...accounts.filter((a) => !a.archived), ...usedArchived].map((a) => [a.id, a])).values()];

  const submit = form.handleSubmit(async (values) => {
    if (mode === "edit" && transaction) {
      const { recurring_rule_id: _r, import_hash: _i, ...patch } = values;
      await update.mutateAsync({ id: transaction.id, patch });
    } else {
      await create.mutateAsync({ ...values, recurring_rule_id: null, import_hash: null });
    }
    onDone();
  });

  return (
    <FormProvider {...form}>
      <form id={formId} noValidate onSubmit={(e) => void submit(e)} className={styles.form}>
        <TransactionFields
          accounts={selectable}
          besideAmount={
            <FormField label={t("transactions.fields.date")} required error={form.formState.errors.date?.message}>
              <Controller
                control={form.control}
                name="date"
                render={({ field }) => <DatePicker value={field.value} onChange={(v) => field.onChange(v ?? "")} />}
              />
            </FormField>
          }
        />
      </form>
    </FormProvider>
  );
}

/** App-wide dialog for creating, editing and duplicating transactions. */
export function TransactionFormDialog() {
  const { t } = useTranslation();
  const formId = useId();
  const { open, mode, close } = useTransactionEditor();
  const accounts = useAccounts();
  const { create, update } = useTransactionMutations();
  const all = accounts.data?.all ?? [];
  const hasAccounts = (accounts.data?.active.length ?? 0) > 0;
  const title = { create: t("transactions.new"), edit: t("transactions.edit"), duplicate: t("transactions.duplicateTitle") }[mode];

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !next && close()}
      title={title}
      footer={
        hasAccounts ? (
          <FormDialogFooter
            formId={formId}
            submitLabel={mode === "edit" ? t("common.saveChanges") : t("common.save")}
            loading={create.isPending || update.isPending}
            onCancel={close}
          />
        ) : undefined
      }
    >
      {accounts.data && !hasAccounts ? (
        <EmptyState
          headingLevel={3}
          icon={<Landmark />}
          title={t("transactions.needAccount.title")}
          description={t("transactions.needAccount.text")}
          action={
            <Button asChild variant="primary" onClick={close}>
              <Link href="/accounts/">{t("transactions.needAccount.action")}</Link>
            </Button>
          }
        />
      ) : (
        accounts.data && <TransactionForm formId={formId} accounts={all} onDone={close} />
      )}
    </Dialog>
  );
}
