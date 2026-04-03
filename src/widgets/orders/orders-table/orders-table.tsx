import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { DataTable, type DataTableColumn } from "@/shared/ui/data-table/data-table";
import { StatusBadge } from "@/shared/ui/status-badge";
import type { Order, OrderSortBy, OrderSortOrder } from "@/entities/order/api/order-types";
import { Button } from "@/shared/ui/button";
import { Pencil } from "lucide-react";
import { NativeSelect } from "@/shared/ui/native-select/native-select";
import type { OrderUpdateFieldKey } from "@/entities/user/model/types";

function formatMoney(value?: number | null) {
  if (value === null || typeof value === "undefined") return "—";
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "KZT", maximumFractionDigits: 0 }).format(value);
}

function formatDate(date?: string) {
  if (!date) return "—";
  const dt = new Date(date);
  if (Number.isNaN(dt.getTime())) return date;
  return new Intl.DateTimeFormat("ru-RU", { year: "numeric", month: "2-digit", day: "2-digit" }).format(dt);
}

type OrdersTableProps = {
  orders: Order[];
  loading: boolean;
  emptyTitle: string;
  emptyDescription: string;
  onRowClick: (order: Order) => void;
  sortBy: OrderSortBy;
  sortOrder: OrderSortOrder;
  onSortChange: (sortBy: OrderSortBy, sortOrder: OrderSortOrder) => void;
  editableFields: Set<OrderUpdateFieldKey>;
  onInlineStatusChange: (payload: {
    id: number;
    field: "orderStatus" | "paymentStatus" | "deliveryStatus";
    value: string;
  }) => void;
  selectedOrderIds: Set<number>;
  onToggleOrderSelection: (orderId: number, event: MouseEvent<HTMLInputElement>) => void;
  onToggleAllVisible: (checked: boolean) => void;
  options: {
    countries: Map<number, string>;
    paymentStatuses: Map<string, { label: string; color?: string }>;
    orderStatuses: Map<string, { label: string; color?: string }>;
    deliveryStatuses: Map<string, { label: string; color?: string }>;
    storagePlaces: Map<number, string>;
  };
};

type AnimatedOrderRow = {
  order: Order;
  phase: "enter" | "stable" | "exit";
};

const ROW_ENTER_DELAY_MS = 16;
const ROW_EXIT_DURATION_MS = 220;

export function OrdersTable({
  orders,
  loading,
  emptyTitle,
  emptyDescription,
  onRowClick,
  sortBy,
  sortOrder,
  onSortChange: onServerSortChange,
  editableFields,
  onInlineStatusChange,
  selectedOrderIds,
  onToggleOrderSelection,
  onToggleAllVisible,
  options,
}: OrdersTableProps) {
  const [localSortState, setLocalSortState] = useState<{ columnId: string; order: "asc" | "desc" } | null>(null);
  const [editingCell, setEditingCell] = useState<{
    orderId: number;
    field: "orderStatus" | "paymentStatus" | "deliveryStatus";
  } | null>(null);
  const [animatedRows, setAnimatedRows] = useState<AnimatedOrderRow[]>(() =>
    orders.map((order) => ({ order, phase: "stable" })),
  );
  const enterTimerRef = useRef<number | null>(null);
  const exitTimerRef = useRef<number | null>(null);

  const getMapLabel = (map: Map<number, string>, id: number | string | null | undefined) => {
    if (typeof id === "number") return map.get(id);
    if (typeof id === "string") {
      const parsed = Number(id);
      if (Number.isFinite(parsed)) return map.get(parsed);
    }
    return undefined;
  };

  const getStatus = (
    map: Map<string, { label: string; color?: string }>,
    id: string | null | undefined,
  ) => {
    if (!id) return undefined;
    return map.get(id);
  };
  const isEditable = (field: OrderUpdateFieldKey) => editableFields.has(field);
  const visibleOrderIds = useMemo(() => orders.map((order) => order.id), [orders]);
  const allVisibleSelected =
    visibleOrderIds.length > 0 && visibleOrderIds.every((id) => selectedOrderIds.has(id));

  useEffect(() => {
    const incomingById = new Map(orders.map((order) => [order.id, order]));

    setAnimatedRows((prev) => {
      if (prev.length === 0) {
        return orders.map((order) => ({ order, phase: "enter" }));
      }

      const nextMap = new Map<number, AnimatedOrderRow>();
      for (const row of prev) {
        const nextOrder = incomingById.get(row.order.id);
        if (nextOrder) {
          nextMap.set(row.order.id, { order: nextOrder, phase: row.phase === "exit" ? "stable" : row.phase });
        } else if (row.phase !== "exit") {
          nextMap.set(row.order.id, { ...row, phase: "exit" });
        } else {
          nextMap.set(row.order.id, row);
        }
      }

      for (const order of orders) {
        if (!nextMap.has(order.id)) {
          nextMap.set(order.id, { order, phase: "enter" });
        }
      }

      const orderedVisible = orders
        .map((order) => nextMap.get(order.id))
        .filter((row): row is AnimatedOrderRow => Boolean(row));
      const exiting = Array.from(nextMap.values()).filter((row) => row.phase === "exit");

      return [...orderedVisible, ...exiting];
    });
  }, [orders]);

  useEffect(() => {
    if (enterTimerRef.current) {
      window.clearTimeout(enterTimerRef.current);
      enterTimerRef.current = null;
    }
    if (!animatedRows.some((row) => row.phase === "enter")) return;

    enterTimerRef.current = window.setTimeout(() => {
      setAnimatedRows((prev) =>
        prev.map((row) => (row.phase === "enter" ? { ...row, phase: "stable" } : row)),
      );
    }, ROW_ENTER_DELAY_MS);

    return () => {
      if (enterTimerRef.current) {
        window.clearTimeout(enterTimerRef.current);
        enterTimerRef.current = null;
      }
    };
  }, [animatedRows]);

  useEffect(() => {
    if (exitTimerRef.current) {
      window.clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
    if (!animatedRows.some((row) => row.phase === "exit")) return;

    exitTimerRef.current = window.setTimeout(() => {
      setAnimatedRows((prev) => prev.filter((row) => row.phase !== "exit"));
    }, ROW_EXIT_DURATION_MS);

    return () => {
      if (exitTimerRef.current) {
        window.clearTimeout(exitTimerRef.current);
        exitTimerRef.current = null;
      }
    };
  }, [animatedRows]);

  const rowPhaseById = useMemo(
    () => new Map(animatedRows.map((row) => [row.order.id, row.phase])),
    [animatedRows],
  );

  const renderStatusCell = (
    row: Order,
    field: "orderStatus" | "paymentStatus" | "deliveryStatus",
    map: Map<string, { label: string; color?: string }>,
  ) => {
    const statusCode = row[field];
    const status = getStatus(map, statusCode ?? undefined);
    const isCellEditing = editingCell?.orderId === row.id && editingCell.field === field;
    const canEdit = isEditable(field);
    const optionsList = Array.from(map.entries()).map(([value, meta]) => ({
      value,
      label: meta.label,
    }));

    if (isCellEditing) {
      return (
        <div data-row-action="true" className="min-w-[180px]">
          <NativeSelect
            value={String(statusCode ?? "")}
            options={optionsList}
            onValueChange={(next) => {
              if (!next || String(next) === String(statusCode ?? "")) {
                setEditingCell(null);
                return;
              }
              onInlineStatusChange({
                id: row.id,
                field,
                value: String(next),
              });
              setEditingCell(null);
            }}
            onBlur={() => setEditingCell(null)}
            placeholder="Выберите статус"
            searchable={false}
            autoFocus
          />
        </div>
      );
    }

    if (!canEdit) {
      return <StatusBadge label={status?.label ?? "—"} customColor={status?.color} tone="neutral" />;
    }

    return (
      <button
        type="button"
        data-row-action="true"
        className="inline-flex"
        onClick={(event) => {
          event.stopPropagation();
          setEditingCell({ orderId: row.id, field });
        }}
      >
        <StatusBadge label={status?.label ?? "—"} customColor={status?.color} tone="neutral" />
      </button>
    );
  };

  const columns: Array<DataTableColumn<Order>> = [
    {
      id: "select",
      header: (
        <input
          data-row-action="true"
          type="checkbox"
          checked={allVisibleSelected}
          onChange={(event) => onToggleAllVisible(event.target.checked)}
          aria-label="Выбрать все заказы на странице"
          className="h-4 w-4 rounded border-input accent-primary"
        />
      ),
      width: 44,
      align: "center",
      cell: (row) => (
        <input
          data-row-action="true"
          type="checkbox"
          checked={selectedOrderIds.has(row.id)}
          readOnly
          aria-label={`Выбрать заказ ${row.id}`}
          className="h-4 w-4 rounded border-input accent-primary"
          onClick={(event) => {
            event.stopPropagation();
            onToggleOrderSelection(row.id, event);
          }}
        />
      ),
      sortable: false,
    },
    { id: "id", header: "ID", accessorKey: "id", width: 90, sortable: false },
    {
      id: "location",
      header: "Страна/город",
      cell: (row) => {
        const country = getMapLabel(options.countries, row.countryId) ?? "—";
        const city = row.city ?? "—";
        return (
          <div className="min-w-0">
            <div className="truncate text-sm">{country}</div>
            <div className="truncate text-xs text-muted-foreground">{city}</div>
            <div className="truncate text-xs text-muted-foreground">{row.address ?? "—"}</div>
          </div>
        );
      },
    },
    {
      id: "clientPhone",
      header: "Телефон клиента",
      cell: (row) => <span className="text-sm">{row.clientPhone ?? "—"}</span>,
    },
    {
      id: "products",
      header: "Препараты",
      cell: (row) => {
        const previewItems = (row.items ?? []).slice(0, 2);
        if (previewItems.length === 0) {
          return <span className="text-xs text-muted-foreground">—</span>;
        }
        return (
          <div className="space-y-0.5">
            {previewItems.map((item, idx) => (
              <div key={`${item.productId}-${idx}`} className="text-xs leading-4 text-muted-foreground">
                {(item.productNameSnapshot ?? `#${item.productId}`)} x {item.quantity}
              </div>
            ))}
          </div>
        );
      },
    },
    {
      id: "orderStatus",
      header: "Статус заказа",
      cell: (row) => renderStatusCell(row, "orderStatus", options.orderStatuses),
      sortable: true,
      sortAccessor: (row) => getStatus(options.orderStatuses, row.orderStatus)?.label ?? "",
    },
    {
      id: "paymentStatus",
      header: "Статус оплаты",
      cell: (row) => renderStatusCell(row, "paymentStatus", options.paymentStatuses),
      sortable: true,
      sortAccessor: (row) => getStatus(options.paymentStatuses, row.paymentStatus)?.label ?? "",
    },
    {
      id: "deliveryStatus",
      header: "Куда собрать",
      cell: (row) => renderStatusCell(row, "deliveryStatus", options.deliveryStatuses),
      sortable: true,
      sortAccessor: (row) => getStatus(options.deliveryStatuses, row.deliveryStatus)?.label ?? "",
    },
    {
      id: "total",
      header: "Итого",
      align: "right",
      cell: (row) => <span className="tabular-nums">{formatMoney(row.totalPrice ?? null)}</span>,
      sortable: true,
      sortAccessor: (row) => row.totalPrice ?? null,
    },
    {
      id: "paid",
      header: "Оплачено",
      align: "right",
      cell: (row) => <span className="tabular-nums">{formatMoney(row.paidAmount ?? null)}</span>,
    },
    {
      id: "remaining",
      header: "Остаток",
      align: "right",
      cell: (row) => {
        const remaining = row.remainingAmount ?? null;
        const tone = remaining === null || typeof remaining === "undefined" ? "neutral" : remaining <= 0 ? "danger" : remaining < 100 ? "warning" : "success";
        return <StatusBadge label={formatMoney(remaining)} tone={tone} />;
      },
      sortable: true,
      sortAccessor: (row) => row.remainingAmount ?? null,
    },
    {
      id: "createdAt",
      header: "Создано",
      cell: (row) => <span className="text-sm text-muted-foreground">{formatDate(row.createdAt)}</span>,
      sortable: true,
      sortAccessor: (row) => row.createdAt ?? null,
    },
    {
      id: "actions",
      header: "",
      width: 56,
      align: "right",
      cell: (row) => (
          <Button
          data-row-action="true"
            size="icon"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onRowClick(row);
            }}
            aria-label="Редактировать заказ"
          >
            <Pencil className="h-4 w-4" />
          </Button>
      ),
    },
  ];

  const serverSortState = useMemo<{ columnId: string; order: "asc" | "desc" }>(
    () => ({
      columnId:
        sortBy === "totalPrice"
          ? "total"
          : sortBy === "remainingAmount"
            ? "remaining"
            : sortBy,
      order: sortOrder,
    }),
    [sortBy, sortOrder],
  );

  const activeSortState = localSortState ?? serverSortState;

  return (
    <DataTable<Order>
      columns={columns}
      data={animatedRows.map((row) => row.order)}
      loading={loading}
      emptyTitle={emptyTitle}
      emptyDescription={emptyDescription}
      rowKey={(row) => row.id}
      rowClassName={(row) => {
        const phase = rowPhaseById.get(row.id);
        if (phase === "enter") {
          return "opacity-0 -translate-y-1 transition-all duration-200 ease-out";
        }
        if (phase === "exit") {
          return "pointer-events-none opacity-0 translate-x-2 transition-all duration-200 ease-out";
        }
        return "opacity-100 translate-x-0 translate-y-0 transition-all duration-200 ease-out";
      }}
      onRowClick={onRowClick}
      sortState={activeSortState}
      onSortChange={(sort) => {
        if (!sort) {
          setLocalSortState(null);
          onServerSortChange("createdAt", "desc");
          return;
        }

        if (sort.columnId === "orderStatus" || sort.columnId === "paymentStatus" || sort.columnId === "deliveryStatus") {
          setLocalSortState(sort);
          return;
        }

        setLocalSortState(null);

        const mappedSortBy: OrderSortBy =
          sort.columnId === "total"
            ? "totalPrice"
            : sort.columnId === "remaining"
              ? "remainingAmount"
              : "createdAt";

        onServerSortChange(mappedSortBy, sort.order);
      }}
    />
  );
}

