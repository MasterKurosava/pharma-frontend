import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

import { EmptyState } from "@/shared/ui/empty-state";
import { Skeleton, TableSkeleton } from "@/shared/ui/skeleton/skeleton";
import { cn } from "@/shared/lib/utils";

type Align = "left" | "center" | "right";

export type DataTableColumn<T> = {
  id: string;
  header: ReactNode;
  width?: number | string;
  align?: Align;
  className?: string;
  sortable?: boolean;
  sortAccessor?: (row: T) => string | number | Date | null | undefined;
  /**
   * Either `accessorKey` or `cell` can be used to render the value.
   * `cell` is the most flexible option (custom renderer).
   */
  accessorKey?: keyof T;
  cell?: (row: T) => ReactNode;
};

export type DataTableProps<T> = {
  columns: Array<DataTableColumn<T>>;
  data: Array<T>;
  loading?: boolean;
  className?: string;
  rowKey?: (row: T, index: number) => string | number;
  onRowClick?: (row: T) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  loadingColumnsCount?: number;
  sortState?: { columnId: string; order: "asc" | "desc" } | null;
  onSortChange?: (sort: { columnId: string; order: "asc" | "desc" } | null) => void;
  rowClassName?: (row: T, index: number) => string | undefined;
};

export function DataTable<T>({
  columns,
  data,
  loading = false,
  className,
  rowKey,
  onRowClick,
  emptyTitle = "Nothing found",
  emptyDescription,
  loadingColumnsCount,
  sortState,
  onSortChange,
  rowClassName,
}: DataTableProps<T>) {
  const columnsCount = loadingColumnsCount ?? columns.length;
  const [internalSortState, setInternalSortState] = useState<{ columnId: string; order: "asc" | "desc" } | null>(null);
  const activeSort = typeof onSortChange === "function" ? (sortState ?? null) : internalSortState;

  const sortedData = useMemo(() => {
    if (!activeSort) return data;
    const column = columns.find((c) => c.id === activeSort.columnId);
    if (!column) return data;

    const getSortValue = (row: T): string | number | Date | null | undefined => {
      if (column.sortAccessor) return column.sortAccessor(row);
      if (column.accessorKey) return row[column.accessorKey] as unknown as string | number | Date | null | undefined;
      return null;
    };

    const sorted = [...data].sort((a, b) => {
      const aValue = getSortValue(a);
      const bValue = getSortValue(b);

      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      if (typeof aValue === "number" && typeof bValue === "number") {
        return aValue - bValue;
      }

      const aTs = aValue instanceof Date ? aValue.getTime() : null;
      const bTs = bValue instanceof Date ? bValue.getTime() : null;
      if (aTs !== null && bTs !== null) {
        return aTs - bTs;
      }

      return String(aValue).localeCompare(String(bValue), "ru", { sensitivity: "base", numeric: true });
    });

    return activeSort.order === "asc" ? sorted : sorted.reverse();
  }, [activeSort, columns, data]);

  const handleSortClick = (column: DataTableColumn<T>) => {
    const isSortable =
      typeof onSortChange === "function" ? column.sortable === true : (column.sortable ?? Boolean(column.accessorKey));
    if (!isSortable) return;

    const current = activeSort?.columnId === column.id ? activeSort : null;
    const next =
      !current ? { columnId: column.id, order: "asc" as const } : current.order === "asc" ? { columnId: column.id, order: "desc" as const } : null;

    if (typeof onSortChange === "function") {
      onSortChange(next);
    } else {
      setInternalSortState(next);
    }
  };

  return (
    <div className={cn("rounded-xl border bg-card shadow-sm", className)}>
      <div className="w-full overflow-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border/70">
              {columns.map((column) => (
                <th
                  key={column.id}
                  style={column.width ? { width: column.width } : undefined}
                  className={cn(
                    "px-4 py-3 text-left text-xs font-medium text-muted-foreground",
                    column.align === "center" ? "text-center" : null,
                    column.align === "right" ? "text-right" : null,
                    column.className,
                  )}
                >
                  <button
                    type="button"
                    onClick={() => handleSortClick(column)}
                    className={cn(
                      "inline-flex items-center gap-1.5",
                      typeof onSortChange === "function" ? (column.sortable === true ? "cursor-pointer" : "cursor-default") : (column.sortable ?? Boolean(column.accessorKey)) ? "cursor-pointer" : "cursor-default",
                    )}
                  >
                    <span>{column.header}</span>
                    {(typeof onSortChange === "function" ? column.sortable === true : (column.sortable ?? Boolean(column.accessorKey))) ? (
                      activeSort?.columnId === column.id ? (
                        activeSort.order === "asc" ? (
                          <ArrowUp className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 opacity-60" />
                      )
                    ) : null}
                  </button>
                </th>
              ))}
            </tr>
          </thead>

          {loading ? (
            <tbody>
              <TableSkeleton columnsCount={columnsCount} />
            </tbody>
          ) : data.length === 0 ? (
            <tbody>
              <tr>
                <td colSpan={columns.length} className="px-4 py-10">
                  <EmptyState title={emptyTitle} description={emptyDescription} />
                </td>
              </tr>
            </tbody>
          ) : (
            <tbody className="divide-y divide-border/60">
              {sortedData.map((row, index) => (
                <tr
                  key={rowKey ? rowKey(row, index) : index}
                  onClick={
                    onRowClick
                      ? (event) => {
                          const target = event.target as HTMLElement | null;
                          if (target?.closest('[data-row-action="true"]')) return;
                          onRowClick(row);
                        }
                      : undefined
                  }
                  className={cn(
                    "transition-colors",
                    onRowClick ? "cursor-pointer hover:bg-muted/30" : null,
                    rowClassName?.(row, index),
                  )}
                >
                  {columns.map((column) => {
                    const value = column.accessorKey ? (row[column.accessorKey] as unknown) : undefined;
                    return (
                      <td
                        key={column.id}
                        className={cn(
                          "px-4 py-3 text-sm text-foreground",
                          column.align === "center" ? "text-center" : null,
                          column.align === "right" ? "text-right" : null,
                        )}
                      >
                        {column.cell ? column.cell(row) : value !== undefined ? String(value) : <Skeleton className="h-4 w-20" />}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          )}
        </table>
      </div>
    </div>
  );
}

