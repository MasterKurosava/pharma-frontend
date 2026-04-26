import { Pencil } from "lucide-react";
import { useMemo, useState } from "react";

import type {
  OrderStatusConfigItem,
  UpdateOrderStatusConfigDto,
} from "@/entities/order-status/api/order-status-types";
import {
  useOrderStatusConfigsQuery,
  useUpdateOrderStatusConfigMutation,
} from "@/features/orders/api/order-status-queries";
import { ORDER_TABLE_GROUP_LABELS, type OrderStatusType, type OrderTableGroup } from "@/shared/config/order-static";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { DataTable, type DataTableColumn } from "@/shared/ui/data-table/data-table";
import { Input } from "@/shared/ui/input";
import { ModalShell } from "@/shared/ui/modal-shell";
// NativeSelect is intentionally not used here now: table groups are multi-select checkboxes.

type Props = {
  type: OrderStatusType;
  title: string;
  emptyDescription: string;
};

type StatusFormState = {
  name: string;
  color: string;
  tableGroups: OrderTableGroup[];
  reserveOnSet: boolean;
  writeOffOnSet: boolean;
  setAssemblyDateOnSet: boolean;
  sortOrder: number;
  isActive: boolean;
};

const emptyForm: StatusFormState = {
  name: "",
  color: "",
  tableGroups: [],
  reserveOnSet: false,
  writeOffOnSet: false,
  setAssemblyDateOnSet: false,
  sortOrder: 0,
  isActive: true,
};

export function OrderStatusesManagementSection({ type, title, emptyDescription }: Props) {
  const statusesQuery = useOrderStatusConfigsQuery(type);
  const updateMutation = useUpdateOrderStatusConfigMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<OrderStatusConfigItem | null>(null);
  const [form, setForm] = useState<StatusFormState>(emptyForm);

  const tableGroupOptions = useMemo(
    () =>
      Object.entries(ORDER_TABLE_GROUP_LABELS).map(([value, label]) => ({
        value,
        label,
      })),
    [],
  );

  const openEdit = (status: OrderStatusConfigItem) => {
    setEditingStatus(status);
    setForm({
      name: status.name,
      color: status.color ?? "",
      tableGroups: status.tableGroups ?? [],
      reserveOnSet: status.reserveOnSet,
      writeOffOnSet: status.writeOffOnSet,
      setAssemblyDateOnSet: status.setAssemblyDateOnSet,
      sortOrder: status.sortOrder,
      isActive: status.isActive,
    });
    setIsModalOpen(true);
  };

  const submit = async () => {
    if (!editingStatus) return;
    const dto: UpdateOrderStatusConfigDto = {
      name: form.name.trim(),
      color: form.color.trim() || null,
      tableGroups: form.tableGroups,
      reserveOnSet: type === "ACTION" ? form.reserveOnSet : false,
      writeOffOnSet: type === "ACTION" ? form.writeOffOnSet : false,
      setAssemblyDateOnSet: type === "ACTION" ? form.setAssemblyDateOnSet : false,
      sortOrder: form.sortOrder,
      isActive: form.isActive,
    };
    await updateMutation.mutateAsync({ id: editingStatus.id, dto });
    setIsModalOpen(false);
  };

  const columns: Array<DataTableColumn<OrderStatusConfigItem>> = [
    { id: "code", header: "Код", accessorKey: "code" },
    { id: "name", header: "Название", accessorKey: "name" },
    {
      id: "color",
      header: "Цвет",
      cell: (row) => (
        <div className="inline-flex items-center gap-2">
          <span
            className="h-3 w-3 rounded-full border"
            style={{ backgroundColor: row.color ?? "#94a3b8" }}
          />
          <span className="text-xs">{row.color ?? "—"}</span>
        </div>
      ),
    },
    {
      id: "tableGroups",
      header: "Таблица(ы)",
      cell: (row: OrderStatusConfigItem) =>
        row.tableGroups?.length ? row.tableGroups.map((g) => ORDER_TABLE_GROUP_LABELS[g]).join(", ") : "—",
    },
    ...(type === "ACTION"
      ? ([
          {
            id: "flags",
            header: "Флаги",
            cell: (row: OrderStatusConfigItem) =>
              [
                row.reserveOnSet ? "Резерв" : "",
                row.writeOffOnSet ? "Списание" : "",
                row.setAssemblyDateOnSet ? "Дата сборки" : "",
              ]
                .filter(Boolean)
                .join(", ") || "—",
          },
        ] satisfies Array<DataTableColumn<OrderStatusConfigItem>>)
      : []),
    {
      id: "actions",
      header: "",
      width: 60,
      align: "right",
      cell: (row) => (
        <Button
          data-row-action="true"
          size="icon"
          variant="ghost"
          onClick={() => openEdit(row)}
          aria-label="Редактировать статус"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Card className="border-border/70 shadow-sm">
        <div className="px-4 py-3">
          <h3 className="text-base font-semibold">{title}</h3>
        </div>
        <div className="px-4 pb-4">
          <DataTable<OrderStatusConfigItem>
            columns={columns}
            data={statusesQuery.data ?? []}
            loading={statusesQuery.isPending}
            emptyTitle="Статусы не найдены"
            emptyDescription={emptyDescription}
            rowKey={(row) => row.id}
          />
        </div>
      </Card>
      <ModalShell open={isModalOpen} onOpenChange={setIsModalOpen} title="Редактировать статус">
        <div className="flex flex-col gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Код (неизменяемый)</label>
            <Input value={editingStatus?.code ?? ""} disabled />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Название</label>
            <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Цвет</label>
            <Input value={form.color} onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Таблицы</label>
            <div className="grid gap-2 rounded-xl border bg-card p-3 sm:grid-cols-2">
              {tableGroupOptions.map((opt) => {
                const value = opt.value as OrderTableGroup;
                const checked = form.tableGroups.includes(value);
                return (
                  <label key={String(opt.value)} className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const nextChecked = e.target.checked;
                        setForm((p) => {
                          const current = p.tableGroups;
                          if (nextChecked) {
                            return current.includes(value) ? p : { ...p, tableGroups: [...current, value] };
                          }
                          return { ...p, tableGroups: current.filter((g) => g !== value) };
                        });
                      }}
                    />
                    {opt.label}
                  </label>
                );
              })}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Порядок</label>
            <Input
              type="number"
              value={form.sortOrder}
              onChange={(e) =>
                setForm((p) => ({ ...p, sortOrder: Number(e.target.value || "0") }))
              }
            />
          </div>
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
            />
            Активен
          </label>
          <div className="flex flex-col gap-2">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.reserveOnSet}
                disabled={type !== "ACTION"}
                onChange={(e) => setForm((p) => ({ ...p, reserveOnSet: e.target.checked }))}
              />
              Добавлять в резерв
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.writeOffOnSet}
                disabled={type !== "ACTION"}
                onChange={(e) => setForm((p) => ({ ...p, writeOffOnSet: e.target.checked }))}
              />
              Списывать при установке
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.setAssemblyDateOnSet}
                disabled={type !== "ACTION"}
                onChange={(e) =>
                  setForm((p) => ({ ...p, setAssemblyDateOnSet: e.target.checked }))
                }
              />
              Ставить дату сборки
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Отмена
            </Button>
            <Button onClick={() => void submit()} disabled={updateMutation.isPending}>
              Сохранить
            </Button>
          </div>
        </div>
      </ModalShell>
    </div>
  );
}
