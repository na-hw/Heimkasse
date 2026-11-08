"use client";

import { CircleCheck } from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, EmptyState, ErrorState, toast } from "@/components/ui";
import { useAccounts } from "@/features/accounts/hooks";
import { useAllCategories } from "@/features/categories/hooks";
import { categoryOptions } from "@/features/categories/options";
import { ListSkeleton } from "@/features/shared/components/ListSkeleton";
import { useErrorMessage } from "@/lib/errors/useErrorMessage";
import { useFormat } from "@/lib/i18n/useFormat";
import { useUiStore } from "@/lib/preferences/uiStore";
import { createId } from "@/lib/utils/id";
import { type ParsedFile, applyPreset, detectFormat, updateFormat } from "../detect";
import { extractRows } from "../extract";
import type { ImportFormat } from "../format";
import { useBankPresets, useDuplicateLoader, useImportMutations, useImportRules } from "../hooks";
import { presetFromMapping } from "../presets";
import { type ImportCandidate, buildCandidates } from "../review";
import { FileStep } from "./FileStep";
import styles from "./ImportScreen.module.css";
import { MappingStep } from "./MappingStep";
import { ReviewStep } from "./ReviewStep";
import { SavePresetDialog } from "./SavePresetDialog";

type Step = "file" | "mapping" | "review" | "done";
const STEPS: readonly Exclude<Step, "done">[] = ["file", "mapping", "review"];

interface Source {
  name: string;
  bytes: Uint8Array;
}

/** CSV import: file → mapping with preview → review → atomic save. */
export function ImportWizard() {
  const { t } = useTranslation();
  const fmt = useFormat();
  const errorMessage = useErrorMessage();
  const accounts = useAccounts();
  const categories = useAllCategories();
  const rules = useImportRules();
  const presets = useBankPresets();
  const loadDuplicates = useDuplicateLoader();
  const { run, savePreset } = useImportMutations();
  const lastAccountId = useUiStore((s) => s.lastAccountId);

  const [step, setStep] = useState<Step>("file");
  const [chosenAccount, setAccountId] = useState<string | null>(null);
  const [source, setSource] = useState<Source | null>(null);
  const [parsed, setParsed] = useState<{ file: ParsedFile; format: ImportFormat } | null>(null);
  const [presetId, setPresetId] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<ImportCandidate[]>([]);
  const [imported, setImported] = useState(0);
  const [presetDialog, setPresetDialog] = useState(false);
  const [preparing, setPreparing] = useState(false);

  const active = accounts.data?.active ?? [];
  const accountId =
    chosenAccount ?? active.find((a) => a.id === lastAccountId)?.id ?? active[0]?.id ?? "";

  const options = useMemo(
    () => ({
      income: categoryOptions(t, categories.data ?? [], "income"),
      expense: categoryOptions(t, categories.data ?? [], "expense"),
    }),
    [t, categories.data],
  );

  const onChange = useCallback(
    (line: number, patch: Partial<ImportCandidate>) =>
      setCandidates((list) => list.map((c) => (c.line === line ? { ...c, ...patch } : c))),
    [],
  );

  if (accounts.isError || presets.isError || rules.isError || categories.isError) {
    return (
      <ErrorState
        description={errorMessage(
          accounts.error ?? presets.error ?? rules.error ?? categories.error,
        )}
        onRetry={() => {
          void accounts.refetch();
          void presets.refetch();
          void rules.refetch();
          void categories.refetch();
        }}
      />
    );
  }
  if (!accounts.data || !presets.data || !rules.data || !categories.data) return <ListSkeleton />;

  const handleFile = (next: Source) => {
    const detected = detectFormat(next.bytes, presets.all);
    if (detected.file.rows.length < 2) {
      toast.error(t("import.file.empty"), { description: next.name });
      return;
    }
    setSource(next);
    setParsed({ file: detected.file, format: detected.format });
    setPresetId(detected.preset?.id ?? null);
    setStep("mapping");
    if (detected.preset) toast.success(t("import.file.detected", { bank: detected.preset.name }));
  };

  const handlePreset = (id: string) => {
    if (!parsed) return;
    const preset = presets.all.find((p) => p.id === id);
    if (!preset) {
      setPresetId(null);
      return;
    }
    // Encoding/delimiter of the preset may require re-parsing first.
    const structural = updateFormat(
      source?.bytes ?? new Uint8Array(),
      parsed,
      {
        encoding: preset.encoding ?? parsed.format.encoding,
        delimiter: preset.delimiter ?? parsed.format.delimiter,
      },
      presets.all,
      id,
    );
    setParsed({
      file: structural.file,
      format: applyPreset(structural.file, structural.format, preset),
    });
    setPresetId(id);
  };

  const prepareReview = async () => {
    if (!parsed) return;
    setPreparing(true);
    try {
      const context = await loadDuplicates(accountId);
      setCandidates(
        buildCandidates({
          rows: extractRows(parsed.file.rows, parsed.format),
          accountId,
          rules: rules.data,
          categories: categories.data,
          context,
        }),
      );
      setStep("review");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setPreparing(false);
    }
  };

  const doImport = async () => {
    const count = await run.mutateAsync({ accountId, candidates });
    useUiStore.getState().setLastAccountId(accountId);
    setImported(count);
    setStep("done");
  };

  const reset = () => {
    setSource(null);
    setParsed(null);
    setCandidates([]);
    setStep("file");
  };

  const currentUserPreset = presets.user.find((p) => p.id === presetId);

  return (
    <div className={styles.wizard}>
      {step !== "done" && (
        <ol className={styles.steps} aria-label={t("import.steps.label")}>
          {STEPS.map((s, i) => (
            <li key={s} aria-current={s === step ? "step" : undefined} className={styles.stepItem}>
              <span className={styles.stepNumber} aria-hidden="true">
                {fmt.number(i + 1)}
              </span>
              {t(`import.steps.${s}`)}
            </li>
          ))}
        </ol>
      )}
      {source && step !== "file" && step !== "done" && (
        <p className={styles.hint}>{t("import.file.current", { name: source.name })}</p>
      )}

      {step === "file" && (
        <FileStep
          accounts={active}
          accountId={accountId}
          onAccountChange={setAccountId}
          onFile={handleFile}
        />
      )}
      {step === "mapping" && parsed && source && (
        <MappingStep
          file={parsed.file}
          format={parsed.format}
          presets={presets.all}
          presetId={presetId}
          onFormatChange={(patch) => {
            const next = updateFormat(source.bytes, parsed, patch, presets.all, presetId);
            setParsed({ file: next.file, format: next.format });
            setPresetId(next.presetId);
          }}
          onPresetChange={handlePreset}
          onSavePreset={() => setPresetDialog(true)}
          onBack={reset}
          onNext={() => void prepareReview()}
        />
      )}
      {preparing && <ListSkeleton rows={3} />}
      {step === "review" && (
        <ReviewStep
          candidates={candidates}
          categoryOptions={options}
          importing={run.isPending}
          onChange={onChange}
          onSelectAll={(selected) =>
            setCandidates((list) =>
              list.map((c) => (c.status === "invalid" ? c : { ...c, selected })),
            )
          }
          onBack={() => setStep("mapping")}
          onImport={() => void doImport()}
        />
      )}
      {step === "done" && (
        <EmptyState
          icon={<CircleCheck />}
          title={t("import.doneTitle")}
          description={t("import.done", { count: imported, formatted: fmt.number(imported) })}
          action={
            <div className={styles.actions}>
              <Button onClick={reset}>{t("import.again")}</Button>
              <Button asChild variant="primary">
                <Link href="/transactions/">{t("import.toTransactions")}</Link>
              </Button>
            </div>
          }
        />
      )}

      {parsed && (
        <SavePresetDialog
          open={presetDialog}
          initialName={currentUserPreset?.name ?? ""}
          saving={savePreset.isPending}
          onClose={() => setPresetDialog(false)}
          onSave={async (name) => {
            const preset = presetFromMapping(
              {
                id: currentUserPreset?.name === name ? currentUserPreset.id : createId(),
                name,
                encoding: parsed.format.encoding,
                delimiter: parsed.format.delimiter,
                dateFormat: parsed.format.dateFormat,
                decimal: parsed.format.decimal,
                invertAmounts: parsed.format.invertAmounts,
              },
              parsed.file.header,
              parsed.format.mapping,
            );
            await savePreset.mutateAsync(preset);
            setPresetId(preset.id);
            setPresetDialog(false);
          }}
        />
      )}
    </div>
  );
}
