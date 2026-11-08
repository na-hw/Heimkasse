"use client";

import { X } from "lucide-react";
import { type KeyboardEvent, useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils/cn";
import { useFormFieldControl } from "../FormField";
import control from "../shared/control.module.css";
import styles from "./TagInput.module.css";

export interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  /** Existing tags offered as suggestions. */
  suggestions?: readonly string[];
  maxTags?: number;
  id?: string;
}

/** Free-form tags: Enter or comma adds, Backspace on empty input removes the last one. */
export function TagInput({ value, onChange, suggestions = [], maxTags = 20, id }: TagInputProps) {
  const { t } = useTranslation();
  const listId = useId();
  const [draft, setDraft] = useState("");
  const a11y = useFormFieldControl({ id });

  const add = (raw: string) => {
    const tags = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const next = [...value];
    for (const tag of tags)
      if (!next.includes(tag) && next.length < maxTags) next.push(tag.slice(0, 40));
    if (next.length !== value.length) onChange(next);
    setDraft("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === ",") && draft.trim()) {
      e.preventDefault();
      add(draft);
    } else if (e.key === "Backspace" && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div className={cn(control.control, styles.wrapper)}>
      {value.length > 0 && (
        <ul className={styles.tags} role="list">
          {value.map((tag) => (
            <li key={tag} className={styles.tag}>
              <span>{tag}</span>
              <button
                type="button"
                className={styles.remove}
                aria-label={t("tagInput.remove", { tag })}
                onClick={() => onChange(value.filter((v) => v !== tag))}
              >
                <X size={14} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <input
        {...a11y}
        className={cn(control.bareInput, styles.input)}
        value={draft}
        list={listId}
        placeholder={value.length ? undefined : t("tagInput.placeholder")}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => draft.trim() && add(draft)}
        autoComplete="off"
      />
      <datalist id={listId}>
        {suggestions
          .filter((s) => !value.includes(s))
          .map((s) => (
            <option key={s} value={s} />
          ))}
      </datalist>
    </div>
  );
}
