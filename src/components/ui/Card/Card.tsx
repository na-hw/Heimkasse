import { type ReactNode, useId } from "react";
import { cn } from "@/lib/utils/cn";
import styles from "./Card.module.css";

export interface CardProps {
  title?: ReactNode;
  description?: ReactNode;
  /** Controls rendered at the end of the header (buttons, menus). */
  actions?: ReactNode;
  /** Heading level of the title (default 2). */
  headingLevel?: 2 | 3 | 4;
  padding?: "none" | "md" | "lg";
  as?: "section" | "article" | "div";
  className?: string;
  children?: ReactNode;
}

/** Surface container. With a title it becomes a labelled region. */
export function Card({
  title,
  description,
  actions,
  headingLevel = 2,
  padding = "md",
  as: Tag = "section",
  className,
  children,
}: CardProps) {
  const id = useId();
  const Heading = `h${headingLevel}` as const;
  const headingId = title ? `card-${id}` : undefined;
  return (
    <Tag className={cn(styles.card, styles[`pad-${padding}`], className)} aria-labelledby={Tag !== "div" ? headingId : undefined}>
      {(title || actions) && (
        <header className={styles.header}>
          <div className={styles.headings}>
            {title && (
              <Heading id={headingId} className={styles.title}>
                {title}
              </Heading>
            )}
            {description && <p className={styles.description}>{description}</p>}
          </div>
          {actions && <div className={styles.actions}>{actions}</div>}
        </header>
      )}
      {children}
    </Tag>
  );
}
