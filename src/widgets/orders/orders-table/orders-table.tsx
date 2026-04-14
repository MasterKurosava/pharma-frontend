import { useMemo, useState, type MouseEvent } from "react";
import { Copy, Pencil } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/shared/ui/data-table/data-table";
import { StatusBadge } from "@/shared/ui/status-badge";
import { Button } from "@/shared/ui/button";
import { NativeSelect } from "@/shared/ui/native-select/native-select";
import type { Order, OrderSortBy, OrderSortOrder } from "@/entities/order/api/order-types";
import type { OrderUpdateFieldKey } from "@/entities/user/model/types";

function formatMoney(value?: number | null) {
  if (value === null || typeof value === "undefined") return "—";
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "KZT", maximumFractionDigits: 0 }).format(value);
}

function formatDateTime(date?: string) {
  if (!date) return "—";
  const dt = new Date(date);
  if (Number.isNaN(dt.getTime())) return date;
  const day = String(dt.getDate()).padStart(2, "0");
  const month = String(dt.getMonth() + 1).padStart(2, "0");
  const hours = String(dt.getHours()).padStart(2, "0");
  const minutes = String(dt.getMinutes()).padStart(2, "0");
  return `${day}.${month}, ${hours}.${minutes}`;
}

function formatDateShort(date?: string | null) {
  if (!date) return "—";
  const dt = new Date(date);
  if (Number.isNaN(dt.getTime())) return "—";
  const day = String(dt.getDate()).padStart(2, "0");
  const month = String(dt.getMonth() + 1).padStart(2, "0");
  return `${day}.${month}`;
}

function getAvailabilityToneClass(status?: string) {
  const normalized = (status ?? "").toLowerCase();
  if (normalized.includes("есть") || normalized.includes("stock")) return "text-emerald-600";
  if (normalized.includes("заказ") || normalized.includes("request")) return "text-amber-600";
  if (normalized.includes("нет") || normalized.includes("out")) return "text-rose-600";
  return "text-muted-foreground";
}

type Props = {
  orders: Order[];
  loading: boolean;
  emptyTitle: string;
  emptyDescription: string;
  onEditClick: (order: Order) => void;
  sortBy: OrderSortBy;
  sortOrder: OrderSortOrder;
  onSortChange: (sortBy: OrderSortBy, sortOrder: OrderSortOrder) => void;
  editableFields: Set<OrderUpdateFieldKey>;
  onInlineStatusChange: (payload: {
    id: number;
    field: "actionStatusCode" | "stateStatusCode" | "assemblyStatusCode";
    value: string;
  }) => void;
  selectedOrderIds: Set<number>;
  onToggleOrderSelection: (orderId: number, event: MouseEvent<HTMLInputElement>) => void;
  onToggleAllVisible: (checked: boolean) => void;
  options: {
    actionStatuses: Map<string, { label: string; color?: string }>;
    stateStatuses: Map<string, { label: string; color?: string }>;
    assemblyStatuses: Map<string, { label: string; color?: string }>;
    storagePlaces: Map<number, string>;
  };
};

export function OrdersTable({
  orders,
  loading,
  emptyTitle,
  emptyDescription,
  onEditClick,
  sortBy,
  sortOrder,
  onSortChange,
  editableFields,
  onInlineStatusChange,
  selectedOrderIds,
  onToggleOrderSelection,
  onToggleAllVisible,
  options,
}: Props) {
  const [editingCell, setEditingCell] = useState<{
    orderId: number;
    field: "actionStatusCode" | "stateStatusCode" | "assemblyStatusCode";
  } | null>(null);
  const visibleOrderIds = useMemo(() => orders.map((o) => o.id), [orders]);
  const allVisibleSelected =
    visibleOrderIds.length > 0 && visibleOrderIds.every((id) => selectedOrderIds.has(id));
  const canEdit = (field: OrderUpdateFieldKey) => editableFields.has(field);
  const getStatus = (map: Map<string, { label: string; color?: string }>, code?: string | null) =>
    code ? map.get(code) : undefined;
  const getRemainingTone = (order: Order): "danger" | "warning" | "success" =>
    order.paymentStatus === "UNPAID"
      ? "danger"
      : order.paymentStatus === "PREPAID_50"
        ? "warning"
        : "success";

  const renderStatusCell = (
    row: Order,
    field: "actionStatusCode" | "stateStatusCode" | "assemblyStatusCode",
    map: Map<string, { label: string; color?: string }>,
  ) => {
    const statusCode = row[field];
    const status = getStatus(map, statusCode ?? undefined);
    if (editingCell?.orderId === row.id && editingCell.field === field) {
      return (
        <div data-row-action="true" className="mx-auto max-w-[130px]">
          <NativeSelect
            value={String(statusCode ?? "")}
            options={Array.from(map.entries()).map(([value, meta]) => ({
              value,
              label: meta.label,
            }))}
            onValueChange={(next) => {
              if (next && String(next) !== String(statusCode ?? "")) {
                onInlineStatusChange({ id: row.id, field, value: String(next) });
              }
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
    return (
      <button
        type="button"
        data-row-action="true"
        className="inline-flex w-full max-w-[130px] justify-center"
        disabled={!canEdit(field)}
        onClick={(e) => {
          e.stopPropagation();
          if (canEdit(field)) setEditingCell({ orderId: row.id, field });
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
          onChange={(e) => onToggleAllVisible(e.target.checked)}
          className="h-4 w-4 rounded border-input accent-primary"
        />
      ),
      width: 44,
      align: "center",
      sortable: false,
      cell: (row) => (
        <input
          data-row-action="true"
          type="checkbox"
          checked={selectedOrderIds.has(row.id)}
          readOnly
          className="h-4 w-4 rounded border-input accent-primary"
          onClick={(e) => {
            e.stopPropagation();
            onToggleOrderSelection(row.id, e);
          }}
        />
      ),
    },
    {
      id: "meta",
      header: "ID / Даты",
      sortable: true,
      sortAccessor: (row) => row.createdAt ?? null,
      cell: (row) => (
        <div className="max-w-[170px]">
          <div className="flex items-center gap-1 text-xs font-semibold">
            <span>#{row.id}</span>
            <button
              type="button"
              data-row-action="true"
              onClick={(e) => {
                e.stopPropagation();
                void navigator.clipboard.writeText(String(row.id));
              }}
            >
              <Copy className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
          <div className="text-[11px] text-muted-foreground">Создан: {formatDateTime(row.createdAt)}</div>
          <div className="text-[11px] text-muted-foreground">Обновлен: {formatDateTime(row.updatedAt)}</div>
        </div>
      ),
    },
    {
      id: "drug",
      header: "Препарат",
      cell: (row) => (
        <div className="max-w-[170px] space-y-0.5">
          <div className="flex items-center gap-1">
            <span className="truncate text-xs font-medium">{row.productNameSnapshot ?? `#${row.productId}`}</span>
            <button
              type="button"
              data-row-action="true"
              onClick={(e) => {
                e.stopPropagation();
                void navigator.clipboard.writeText(row.productNameSnapshot ?? "");
              }}
            >
              <Copy className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
          <div className="text-[11px] text-muted-foreground">Кол-во: {row.quantity}</div>
          <div className={`text-[11px] ${getAvailabilityToneClass(row.productStatusNameSnapshot)}`}>
            Нал.: {row.productStatusNameSnapshot ?? "—"}
          </div>
          <div className="text-[11px] text-muted-foreground">{row.orderSourceNameSnapshot ?? "—"}</div>
          <div className="text-[11px] text-muted-foreground">{row.manufacturerNameSnapshot ?? "—"}</div>
          <div className="text-[11px] text-muted-foreground">{formatMoney(row.productPrice ?? null)}</div>
        </div>
      ),
    },
    {
      id: "actionStatusCode",
      header: "Статус действия",
      cell: (row) => renderStatusCell(row, "actionStatusCode", options.actionStatuses),
      sortable: true,
      align: "center",
      width: 145,
      sortAccessor: (row) => getStatus(options.actionStatuses, row.actionStatusCode)?.label ?? "",
    },
    {
      id: "stateStatusCode",
      header: "Статус состояния",
      cell: (row) => renderStatusCell(row, "stateStatusCode", options.stateStatuses),
      sortable: true,
      align: "center",
      width: 145,
      sortAccessor: (row) => getStatus(options.stateStatuses, row.stateStatusCode)?.label ?? "",
    },
    {
      id: "assemblyStatusCode",
      header: "Сборка",
      cell: (row) => renderStatusCell(row, "assemblyStatusCode", options.assemblyStatuses),
      sortable: true,
      align: "center",
      width: 145,
      sortAccessor: (row) =>
        getStatus(options.assemblyStatuses, row.assemblyStatusCode)?.label ?? "",
    },
    {
      id: "remaining",
      header: "Остаток",
      align: "right",
      cell: (row) => (
        <StatusBadge label={formatMoney(row.remainingAmount ?? null)} tone={getRemainingTone(row)} />
      ),
      sortable: true,
      sortAccessor: (row) => row.remainingAmount ?? null,
    },
    {
      id: "orderStorage",
      header: "Хранилище заказа",
      align: "center",
      cell: (row) => (
        <span className="inline-block max-w-[130px] truncate text-center text-xs">
          {row.orderStorage ?? options.storagePlaces.get(Number(row.storagePlaceId)) ?? "—"}
        </span>
      ),
    },
    {
      id: "paymentDates",
      header: "Даты",
      cell: (row) => (
        <div className="max-w-[110px] space-y-0.5 text-[11px]">
          <div className="text-amber-600">Предопл.: {formatDateShort(row.prepaymentDate ?? undefined)}</div>
          <div className="text-emerald-600">Оплата: {formatDateShort(row.paymentDate ?? undefined)}</div>
          <div className="text-sky-600">Сборка: {formatDateShort(row.assemblyDate ?? undefined)}</div>
        </div>
      ),
    },
    {
      id: "address",
      header: "Город / Адрес",
      cell: (row) => (
        <div className="max-w-[130px]">
          <div className="truncate text-xs">{row.city ?? "—"}</div>
          <div className="truncate text-xs text-muted-foreground">{row.address ?? "—"}</div>
        </div>
      ),
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
            onEditClick(row);
          }}
          aria-label="Редактировать заказ"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  const serverSortState = useMemo<{ columnId: string; order: "asc" | "desc" }>(
    () => {
      const columnId =
        sortBy === "remainingAmount"
          ? "remaining"
          : sortBy === "actionStatusCode"
            ? "actionStatusCode"
            : sortBy === "stateStatusCode"
              ? "stateStatusCode"
              : sortBy === "assemblyStatusCode"
                ? "assemblyStatusCode"
                : "meta";
      return { columnId, order: sortOrder };
    },
    [sortBy, sortOrder],
  );

  return (
    <DataTable<Order>
      columns={columns}
      data={orders}
      loading={loading}
      emptyTitle={emptyTitle}
      emptyDescription={emptyDescription}
      rowKey={(row) => row.id}
      sortState={serverSortState}
      onSortChange={(sort) => {
        if (!sort) return;
        if (sort.columnId === "remaining") return onSortChange("remainingAmount", sort.order);
        if (sort.columnId === "actionStatusCode") return onSortChange("actionStatusCode", sort.order);
        if (sort.columnId === "stateStatusCode") return onSortChange("stateStatusCode", sort.order);
        if (sort.columnId === "assemblyStatusCode") return onSortChange("assemblyStatusCode", sort.order);
        return onSortChange("createdAt", sort.order);
      }}
    />
  );
}
