import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type DataTableColumn<T> = {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  headerClassName?: string;
  cellClassName?: string;
  /**
   * When `onRowClick` is set, clicks and key events on this cell do not trigger the row handler
   * (e.g. row actions menus).
   */
  isolateRowClick?: boolean;
};

export type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  data: T[];
  getRowId: (row: T) => string;
  /**
   * Renders in the top bar above the scroll region (search, filters, etc.).
   * Omit entirely so the toolbar row is not mounted.
   */
  toolbar?: ReactNode;
  /**
   * Shown below the scroll region (counts, pagination hints).
   * Omit entirely so the footer bar is not mounted.
   */
  footer?: ReactNode;
  /**
   * When provided, rows respond to click / Enter / Space like links.
   * Omit so rows are plain data rows with no row-level navigation.
   */
  onRowClick?: (row: T) => void;
  /** Used with `onRowClick` for screen readers. */
  getRowAriaLabel?: (row: T) => string;
  /**
   * When `data` is empty, optional single row spanning all columns (e.g. “No results”).
   * If omitted with empty data, the tbody is empty.
   */
  emptyState?: ReactNode;
  className?: string;
  /** Classes for the scrollable region wrapping `<table>`. */
  scrollRegionClassName?: string;
  /** Minimum width of the table (horizontal scroll on small viewports). */
  minTableWidth?: string;
  tableClassName?: string;
};

const interactiveRowClass =
  "cursor-pointer bg-card transition-colors hover:bg-accent/50 focus-visible:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const defaultScroll = "max-h-[min(70vh,32rem)] overflow-auto";

export function DataTable<T>({
  columns,
  data,
  getRowId,
  toolbar,
  footer,
  onRowClick,
  getRowAriaLabel,
  emptyState,
  className,
  scrollRegionClassName,
  minTableWidth = "720px",
  tableClassName,
}: DataTableProps<T>) {
  const rowInteractive = Boolean(onRowClick);

  return (
    <div
      data-slot="data-table"
      className={cn("overflow-hidden rounded-lg border border-border bg-card", className)}
    >
      {toolbar ? (
        <div className="flex flex-col gap-3 border-b border-border bg-muted/20 px-3 py-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-4">
          {toolbar}
        </div>
      ) : null}

      <div className={cn(defaultScroll, scrollRegionClassName)}>
        <table
          className={cn(
            "w-full border-collapse text-left text-sm",
            tableClassName
          )}
          style={{ minWidth: minTableWidth }}
        >
          <thead className="sticky top-0 z-10 border-b border-border bg-muted/80 backdrop-blur-sm">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.id}
                  scope="col"
                  className={cn(
                    "whitespace-nowrap px-3 py-2.5 font-medium text-foreground",
                    col.headerClassName
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.length === 0 && emptyState ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-3 py-6 text-center text-sm text-muted-foreground"
                >
                  {emptyState}
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={getRowId(row)}
                  className={cn("bg-card", rowInteractive && interactiveRowClass)}
                  tabIndex={rowInteractive ? 0 : undefined}
                  role={rowInteractive ? "link" : undefined}
                  aria-label={
                    rowInteractive && getRowAriaLabel ? getRowAriaLabel(row) : undefined
                  }
                  onClick={rowInteractive ? () => onRowClick?.(row) : undefined}
                  onKeyDown={
                    rowInteractive
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onRowClick?.(row);
                          }
                        }
                      : undefined
                  }
                >
                  {columns.map((col) => (
                    <td
                      key={col.id}
                      className={col.cellClassName}
                      onClick={col.isolateRowClick ? (e) => e.stopPropagation() : undefined}
                      onKeyDown={
                        col.isolateRowClick ? (e) => e.stopPropagation() : undefined
                      }
                    >
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {footer ? (
        <div className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
          {footer}
        </div>
      ) : null}
    </div>
  );
}
