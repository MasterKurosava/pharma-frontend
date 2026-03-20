import { Pencil, Trash2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { useDebouncedValue } from "@/shared/lib/use-debounced-value";
import { DataTable, type DataTableColumn } from "@/shared/ui/data-table/data-table";
import { FilterBar } from "@/shared/ui/filter-bar/filter-bar";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { NativeSelect } from "@/shared/ui/native-select/native-select";
import { StatusBadge } from "@/shared/ui/status-badge";
import { ClientModalForm } from "@/features/clients/ui/client-modal-form";
import { useClientsQuery, useDeleteClientMutation } from "@/features/clients/api/client-crud-hooks";
import { useClientStatusOptionsQuery } from "@/features/clients/model/use-client-status-options";
import type { Client } from "@/entities/client/api/client-types";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { toast } from "sonner";

type ActiveFilterValue = number | "";

function formatDate(date?: string) {
  if (!date) return "—";
  const dt = new Date(date);
  if (Number.isNaN(dt.getTime())) return date;
  return new Intl.DateTimeFormat("ru-RU", { year: "numeric", month: "2-digit", day: "2-digit" }).format(dt);
}

export function ClientsCrudSection() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);

  const [clientStatusId, setClientStatusId] = useState<ActiveFilterValue>("");

  const listQuery = useClientsQuery({
    search: debouncedSearch ? debouncedSearch : undefined,
    clientStatusId: clientStatusId === "" ? undefined : clientStatusId,
  });

  const { options: statusOptions, isPending: isStatusesPending } = useClientStatusOptionsQuery();

  const statusById = useMemo(() => {
    const map = new Map<number, string>();
    for (const opt of statusOptions) map.set(opt.value, opt.label);
    return map;
  }, [statusOptions]);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedClientId, setSelectedClientId] = useState<number | string | undefined>(undefined);

  const { mutateAsync: deleteClientAsync, isPending: isDeletingClient } = useDeleteClientMutation();

  const handleDelete = useCallback(async (row: Client) => {
    try {
      await deleteClientAsync(row.id);
      toast.success("Клиент удален");
    } catch {
      // Error toast is shown in mutation onError.
    }
  }, [deleteClientAsync]);

  const columns = useMemo<Array<DataTableColumn<Client>>>(
    () => [
      { id: "name", header: "Клиент", accessorKey: "name", sortable: true },
      { id: "phone", header: "Телефон", accessorKey: "phone", sortable: true },
      {
        id: "status",
        header: "Статус",
        cell: (row) => {
          const label = row.clientStatusId ? statusById.get(row.clientStatusId) ?? "—" : "—";
          return <StatusBadge label={label} tone="neutral" />;
        },
        sortable: true,
        sortAccessor: (row) => (row.clientStatusId ? statusById.get(row.clientStatusId) ?? "" : ""),
      },
      {
        id: "createdAt",
        header: "Создано",
        cell: (row) => <span className="text-muted-foreground">{formatDate(row.createdAt)}</span>,
        sortable: true,
        sortAccessor: (row) => row.createdAt ?? null,
      },
      {
        id: "actions",
        header: "",
        width: 112,
        align: "right",
        cell: (row) => (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Редактировать клиента"
              onClick={(e) => {
                e.stopPropagation();
                setModalMode("edit");
                setSelectedClientId(row.id);
                setModalOpen(true);
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>

            <ConfirmDialog
              trigger={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Удалить клиента"
                  onClick={(e) => e.stopPropagation()}
                  disabled={isDeletingClient}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              }
              title="Удалить клиента?"
              description={`Клиент "${row.name}" будет удален.`}
              confirmLabel="Удалить"
              cancelLabel="Отмена"
              confirmVariant="destructive"
              isConfirming={isDeletingClient}
              onConfirm={() => handleDelete(row)}
            />
          </div>
        ),
      },
    ],
    [statusById, handleDelete, isDeletingClient],
  );

  return (
    <>
      <FilterBar
        search={
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по имени или телефону"
          />
        }
        actions={
          <Button
            size="sm"
            onClick={() => {
              setModalMode("create");
              setSelectedClientId(undefined);
              setModalOpen(true);
            }}
          >
            Создать клиента 
          </Button>
        }
      >
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full sm:w-72">
            <NativeSelect
              value={clientStatusId}
              options={statusOptions}
              onValueChange={(next) => setClientStatusId(next === "" ? "" : next)}
              placeholder="Все статусы"
              disabled={isStatusesPending}
            />
          </div>
        </div>
      </FilterBar>

      <div className="mt-4">
        <DataTable<Client>
          columns={columns}
          data={listQuery.data ?? []}
          loading={listQuery.isPending}
          emptyTitle="Нет клиентов найдено"
          emptyDescription="Try adjusting search or client status filter."
          rowKey={(row) => row.id}
          onRowClick={(row) => {
            setModalMode("edit");
            setSelectedClientId(row.id);
            setModalOpen(true);
          }}
        />
      </div>

      <ClientModalForm
        open={modalOpen}
        onOpenChange={setModalOpen}
        mode={modalMode}
        clientId={selectedClientId}
      />
    </>
  );
}

