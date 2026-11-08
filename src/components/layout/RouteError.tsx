"use client";

import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ErrorState } from "@/components/ui";

interface RouteErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/** Error boundary content for a route segment; the rest of the app keeps working. */
export default function RouteError({ error, reset }: RouteErrorProps) {
  const { t } = useTranslation();
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <ErrorState
      description={t("errors.routeDescription")}
      details={error.message}
      onRetry={reset}
    />
  );
}
