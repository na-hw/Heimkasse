"use client";

import { useTranslation } from "react-i18next";
import { toAppError } from "./AppError";

/** Returns a function that converts any error into a translated, user-friendly message. */
export function useErrorMessage(): (error: unknown) => string {
  const { t } = useTranslation();
  return (error: unknown) => t(`errors.codes.${toAppError(error).code}`);
}
