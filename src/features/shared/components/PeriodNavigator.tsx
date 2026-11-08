"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button, DirectionalIcon, IconButton } from "@/components/ui";
import styles from "./PeriodNavigator.module.css";

interface PeriodNavigatorProps {
  /** Visible period label, announced politely when it changes. */
  label: string;
  previousLabel: string;
  nextLabel: string;
  onPrevious: () => void;
  onNext: () => void;
  /** "Back to current period" button; hidden when already current. */
  currentLabel: string;
  isCurrent: boolean;
  onCurrent: () => void;
}

/** Previous/next stepping through months, budget periods or years. */
export function PeriodNavigator({
  label,
  previousLabel,
  nextLabel,
  onPrevious,
  onNext,
  currentLabel,
  isCurrent,
  onCurrent,
}: PeriodNavigatorProps) {
  return (
    <div className={styles.navigator}>
      <IconButton
        label={previousLabel}
        icon={<DirectionalIcon icon={ChevronLeft} />}
        onClick={onPrevious}
      />
      <p className={styles.label} aria-live="polite">
        {label}
      </p>
      <IconButton
        label={nextLabel}
        icon={<DirectionalIcon icon={ChevronRight} />}
        onClick={onNext}
      />
      {!isCurrent && (
        <Button variant="ghost" onClick={onCurrent}>
          {currentLabel}
        </Button>
      )}
    </div>
  );
}
