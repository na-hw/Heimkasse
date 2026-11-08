import "@tanstack/react-table";

declare module "@tanstack/react-table" {
  // Generic parameters must match the library declaration.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    /** Cell alignment; use "end" for amounts. */
    align?: "start" | "center" | "end";
    /** Plain-text header used for the sort button label. */
    headerLabel?: string;
  }
}
