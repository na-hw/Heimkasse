"use client";

import { Landmark } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, EmptyState, FileInput, FormField, Select } from "@/components/ui";
import type { Account } from "@/features/accounts/schemas";
import { BUILTIN_PRESETS } from "../presets";
import styles from "./ImportScreen.module.css";

/** 10 MB is far beyond any bank export; protects against picking the wrong file. */
export const MAX_CSV_BYTES = 10 * 1024 * 1024;

interface Props {
  accounts: Account[];
  accountId: string;
  onAccountChange: (id: string) => void;
  onFile: (file: { name: string; bytes: Uint8Array }) => void;
}

/** Step 1: target account and CSV file. */
export function FileStep({ accounts, accountId, onAccountChange, onFile }: Props) {
  const { t } = useTranslation();
  const [error, setError] = useState<string | undefined>();

  if (accounts.length === 0) {
    return (
      <EmptyState
        icon={<Landmark />}
        title={t("transactions.needAccount.title")}
        description={t("import.needAccount")}
        action={
          <Button asChild variant="primary">
            <Link href="/accounts/">{t("transactions.needAccount.action")}</Link>
          </Button>
        }
      />
    );
  }

  const handleFiles = async ([file]: File[]) => {
    if (!file) return;
    if (file.size > MAX_CSV_BYTES) {
      setError(t("import.file.tooLarge"));
      return;
    }
    setError(undefined);
    onFile({ name: file.name, bytes: new Uint8Array(await file.arrayBuffer()) });
  };

  return (
    <div className={styles.step}>
      <FormField label={t("import.file.account")} required>
        <Select
          value={accountId || undefined}
          onValueChange={onAccountChange}
          options={accounts.map((a) => ({ value: a.id, label: a.name }))}
        />
      </FormField>
      <FormField
        label={t("import.file.label")}
        hint={t("import.file.hint", {
          banks: BUILTIN_PRESETS.map((p) => p.name).join(", "),
        })}
        error={error}
      >
        <FileInput
          variant="primary"
          accept=".csv,.txt,text/csv,text/plain"
          disabled={!accountId}
          onFiles={(files) => void handleFiles(files)}
        >
          {t("import.file.choose")}
        </FileInput>
      </FormField>
    </div>
  );
}
