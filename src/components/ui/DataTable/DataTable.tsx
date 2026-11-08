"use client";

import {
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useFormat } from "@/lib/i18n/useFormat";
import { cn } from "@/lib/utils/cn";
import { Checkbox } from "../Checkbox";
import { DirectionalIcon } from "../DirectionalIcon";
import { ErrorState } from "../ErrorState";
import { IconButton } from "../IconButton";
import { announce } from "../LiveRegion";
import { Skeleton } from "../Skeleton";
import "./columnMeta";
import styles from "./DataTable.module.css";

export interface DataTableProps<T> {
  data: readonly T[];
  // TanStack column definitions are invariant in their value type; `any` is the
  // library-recommended way to accept a mixed column array.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<T, any>[];
  getRowId: (row: T) => string;
  /** Accessible table caption (visually hidden unless showCaption). */
  caption: string;
  showCaption?: boolean;
  isLoading?: boolean;
  error?: ReactNode;
  onRetry?: () => void;
  /** Shown when there are no rows (after filtering). */
  emptyState?: ReactNode;
  /** Case-insensitive text filter across all columns. */
  globalFilter?: string;
  enableSelection?: boolean;
  selection?: RowSelectionState;
  onSelectionChange?: (selection: RowSelectionState) => void;
  initialSorting?: SortingState;
  /** Rows per page; ignored when virtualized. */
  pageSize?: number;
  /** Virtualize rows (for long lists). Requires a bounded height. */
  virtualize?: boolean;
  /** Max height of the scroll area when virtualized. */
  maxHeight?: string;
  estimateRowHeight?: number;
  className?: string;
}

/** Accessible data table: sorting, filtering, selection, pagination or virtualization. */
export function DataTable<T>({
  data,
  columns,
  getRowId,
  caption,
  showCaption,
  isLoading,
  error,
  onRetry,
  emptyState,
  globalFilter,
  enableSelection,
  selection,
  onSelectionChange,
  initialSorting = [],
  pageSize,
  virtualize,
  maxHeight = "70dvh",
  estimateRowHeight = 52,
  className,
}: DataTableProps<T>) {
  const { t } = useTranslation();
  const format = useFormat();
  const [sorting, setSorting] = useState<SortingState>(initialSorting);
  const [internalSelection, setInternalSelection] = useState<RowSelectionState>({});
  const rowSelection = selection ?? internalSelection;

  const allColumns = useMemo(() => {
    if (!enableSelection) return columns;
    const select: ColumnDef<T, unknown> = {
      id: "__select",
      enableSorting: false,
      header: ({ table }) => (
        <Checkbox
          aria-label={t("dataTable.selectAll")}
          checked={table.getIsAllRowsSelected() ? true : table.getIsSomeRowsSelected() ? "indeterminate" : false}
          onCheckedChange={(v) => table.toggleAllRowsSelected(v === true)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label={t("dataTable.selectRow")}
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(v === true)}
        />
      ),
    };
    return [select, ...columns];
  }, [columns, enableSelection, t]);

  const paginate = Boolean(pageSize) && !virtualize;

  // TanStack Table returns non-memoizable functions; the React Compiler skips this component.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: data as T[],
    columns: allColumns,
    getRowId,
    state: { sorting, rowSelection, globalFilter },
    onSortingChange: setSorting,
    onRowSelectionChange: (updater) => {
      const next = typeof updater === "function" ? updater(rowSelection) : updater;
      if (onSelectionChange) onSelectionChange(next);
      else setInternalSelection(next);
      const count = Object.values(next).filter(Boolean).length;
      announce(t("dataTable.selectedCount", { count }));
    },
    enableRowSelection: enableSelection,
    globalFilterFn: "includesString",
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    ...(paginate ? { getPaginationRowModel: getPaginationRowModel() } : {}),
    initialState: paginate ? { pagination: { pageIndex: 0, pageSize: pageSize ?? 25 } } : undefined,
  });

  const rows = table.getRowModel().rows;
  const scrollRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: virtualize ? rows.length : 0,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => estimateRowHeight,
    overscan: 10,
  });

  // Reset to the first page when the filter changes.
  useEffect(() => {
    if (paginate) table.setPageIndex(0);
  }, [globalFilter, paginate, table]);

  const colCount = table.getVisibleLeafColumns().length;
  const virtualItems = virtualize ? virtualizer.getVirtualItems() : [];
  const padStart = virtualItems[0]?.start ?? 0;
  const padEnd = virtualize ? virtualizer.getTotalSize() - (virtualItems.at(-1)?.end ?? 0) : 0;
  const visibleRows = virtualize ? virtualItems.flatMap((v) => (rows[v.index] ? [rows[v.index]] : [])) : rows;

  if (error) return <ErrorState description={error} onRetry={onRetry} />;

  const body = isLoading ? (
    Array.from({ length: 5 }, (_, i) => (
      <tr key={`sk-${i}`} className={styles.row}>
        {Array.from({ length: colCount }, (_, j) => (
          <td key={j} className={styles.cell}>
            <Skeleton width={j === 0 ? "70%" : "50%"} />
          </td>
        ))}
      </tr>
    ))
  ) : rows.length === 0 ? (
    <tr>
      <td colSpan={colCount}>{emptyState}</td>
    </tr>
  ) : (
    <>
      {padStart > 0 && <tr aria-hidden="true" style={{ blockSize: padStart }} />}
      {visibleRows.map((row) =>
        row ? (
          <tr key={row.id} className={styles.row} data-selected={row.getIsSelected() || undefined}>
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id} className={cn(styles.cell, styles[`align-${cell.column.columnDef.meta?.align ?? "start"}`])}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ) : null,
      )}
      {padEnd > 0 && <tr aria-hidden="true" style={{ blockSize: padEnd }} />}
    </>
  );

  return (
    <div className={cn(styles.wrapper, className)}>
      <div
        ref={scrollRef}
        className={styles.scroll}
        style={virtualize ? { maxBlockSize: maxHeight } : undefined}
        aria-busy={isLoading || undefined}
      >
        <table className={styles.table}>
          <caption className={showCaption ? styles.caption : "visually-hidden"}>{caption}</caption>
          <thead className={styles.head}>
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => {
                  const sorted = header.column.getIsSorted();
                  const canSort = header.column.getCanSort();
                  const align = header.column.columnDef.meta?.align ?? "start";
                  const content = header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext());
                  return (
                    <th
                      key={header.id}
                      scope="col"
                      className={cn(styles.th, styles[`align-${align}`])}
                      aria-sort={sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : canSort ? "none" : undefined}
                    >
                      {canSort ? (
                        <button type="button" className={styles.sortButton} onClick={header.column.getToggleSortingHandler()}>
                          {content}
                          {sorted === "asc" ? (
                            <ArrowUp size={14} aria-hidden="true" />
                          ) : sorted === "desc" ? (
                            <ArrowDown size={14} aria-hidden="true" />
                          ) : (
                            <ArrowUpDown size={14} aria-hidden="true" className={styles.sortIdle} />
                          )}
                        </button>
                      ) : (
                        content
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>{body}</tbody>
        </table>
      </div>
      {paginate && table.getPageCount() > 1 && (
        <nav className={styles.pagination} aria-label={caption}>
          <span className={styles.pageInfo}>
            {t("dataTable.pageOf", {
              page: format.number(table.getState().pagination.pageIndex + 1),
              pages: format.number(table.getPageCount()),
            })}
          </span>
          <IconButton
            label={t("dataTable.previousPage")}
            icon={<DirectionalIcon icon={ChevronLeft} />}
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            variant="secondary"
          />
          <IconButton
            label={t("dataTable.nextPage")}
            icon={<DirectionalIcon icon={ChevronRight} />}
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            variant="secondary"
          />
        </nav>
      )}
    </div>
  );
}
