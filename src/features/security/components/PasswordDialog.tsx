"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useId } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Dialog, FormField, Input } from "@/components/ui";
import { FormDialogFooter } from "@/features/shared/components/FormDialogFooter";
import styles from "@/features/shared/components/EntityList.module.css";
import { validationMessage } from "@/lib/validation/messages";
import { isWrongPassword, useAppLockMutations } from "../hooks";
import { type PasswordForm, newPasswordSchema } from "../schemas";

export type PasswordDialogMode = "set" | "change" | "remove";

const EMPTY: PasswordForm = { current: "", password: "", confirm: "" };
const WRONG = validationMessage("validation.wrongPassword");

/** Set, change or remove the app password. Change/remove require the current one. */
export function PasswordDialog({
  mode,
  onClose,
}: {
  mode: PasswordDialogMode | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const formId = useId();
  const { setPassword, changePassword, removeLock } = useAppLockMutations();
  const form = useForm<PasswordForm>({
    // Removing only needs the current password; the new-password rules don't apply.
    resolver: mode === "remove" ? undefined : zodResolver(newPasswordSchema),
    defaultValues: EMPTY,
  });
  useEffect(() => {
    if (mode) form.reset(EMPTY);
  }, [mode, form]);
  const { errors } = form.formState;
  const pending = setPassword.isPending || changePassword.isPending || removeLock.isPending;

  const submit = form.handleSubmit(async (values) => {
    try {
      if (mode === "set") await setPassword.mutateAsync(values);
      else if (mode === "change") await changePassword.mutateAsync(values);
      else if (mode === "remove") {
        if (!values.current) {
          form.setError("current", { message: validationMessage("validation.required") });
          return;
        }
        await removeLock.mutateAsync(values);
      }
      onClose();
    } catch (error) {
      if (isWrongPassword(error)) form.setError("current", { message: WRONG });
    }
  });

  const title =
    mode === "set"
      ? t("security.setPassword")
      : mode === "change"
        ? t("security.changePassword")
        : t("security.removeLock");

  return (
    <Dialog
      open={mode !== null}
      onOpenChange={(next) => !next && onClose()}
      title={title}
      description={mode === "set" ? t("security.setHint") : undefined}
      size="sm"
      footer={
        <FormDialogFooter
          formId={formId}
          submitLabel={mode === "remove" ? t("security.removeLock") : t("common.save")}
          loading={pending}
          onCancel={onClose}
        />
      }
    >
      <form id={formId} noValidate onSubmit={(e) => void submit(e)} className={styles.form}>
        {mode !== "set" && (
          <FormField label={t("security.fields.current")} required error={errors.current?.message}>
            <Input
              type="password"
              autoComplete="current-password"
              autoFocus
              {...form.register("current")}
            />
          </FormField>
        )}
        {mode !== "remove" && (
          <>
            <FormField
              label={t("security.fields.new")}
              hint={t("security.fields.newHint")}
              required
              error={errors.password?.message}
            >
              <Input
                type="password"
                autoComplete="new-password"
                autoFocus={mode === "set"}
                {...form.register("password")}
              />
            </FormField>
            <FormField
              label={t("security.fields.confirm")}
              required
              error={errors.confirm?.message}
            >
              <Input type="password" autoComplete="new-password" {...form.register("confirm")} />
            </FormField>
          </>
        )}
      </form>
    </Dialog>
  );
}
