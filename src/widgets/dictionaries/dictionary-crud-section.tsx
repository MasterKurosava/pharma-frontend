import { Pencil, Trash2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { useDebouncedValue } from "@/shared/lib/use-debounced-value";
import { DataTable, type DataTableColumn } from "@/shared/ui/data-table/data-table";
import { FilterBar } from "@/shared/ui/filter-bar/filter-bar";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { StatusBadge } from "@/shared/ui/status-badge";
import { DictionaryModalForm } from "@/features/dictionaries/ui/dictionary-modal-form";
import { getSimpleDictionaryConfig } from "@/features/dictionaries/model/simple-dictionaries-config";
import { useDictionaryListQuery, useDeleteDictionaryMutation } from "@/features/dictionaries/api/dictionary-crud-hooks";
import type { DictionaryItem, DictionaryResourceName } from "@/entities/dictionary/api/dictionary-types";
import { cn } from "@/shared/lib/utils";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/model/use-auth";
import { canEditResource } from "@/shared/lib/access-control";

type DictionaryCrudSectionProps = {
  resource: DictionaryResourceName;
};

export function DictionaryCrudSection({ resource }: DictionaryCrudSectionProps) {
  const config = getSimpleDictionaryConfig(resource);
  const { user } = useAuth();
  const canEdit = canEditResource(user?.role, resource);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);

  const listQuery = useDictionaryListQuery(resource, {
    search: debouncedSearch || undefined,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedItem, setSelectedItem] = useState<DictionaryItem | null>(null);

  const { mutateAsync: deleteDictionaryAsync, isPending: isDeletingDictionary } = useDeleteDictionaryMutation(resource);

  const handleDelete = useCallback(async (row: DictionaryItem) => {
    try {
      await deleteDictionaryAsync(row.id);
      toast.success("Элемент удален");
    } catch {
      // Error toast is shown in mutation onError.
    }
  }, [deleteDictionaryAsync]);

  const columns = useMemo<Array<DataTableColumn<DictionaryItem>>>(
    () => {
      const base: Array<DataTableColumn<DictionaryItem>> = [
        ...(config.supportsCode
          ? [
              {
                id: "code",
                header: "Код",
                cell: (row: DictionaryItem) => <span>{row.code ?? "—"}</span>,
                sortable: true,
                sortAccessor: (row: DictionaryItem) => row.code ?? "",
              } satisfies DataTableColumn<DictionaryItem>,
            ]
          : []),
        {
          id: "name",
          header: config.singularLabel,
          cell: (row) =>
            config.supportsColor ? (
              <StatusBadge label={row.name || row.label} customColor={row.color} />
            ) : (
              <span>{row.name || row.label}</span>
            ),
          sortable: true,
          sortAccessor: (row) => row.name || row.label,
        },
      ];

      if (config.supportsActive) {
        base.push({
          id: "isActive",
          header: "Статус",
          cell: (row) => {
            const active = Boolean(row.isActive);
            return (
              <StatusBadge
                label={active ? "Активный" : "Неактивный"}
                tone={active ? "success" : "neutral"}
              />
            );
          },
          sortable: true,
          sortAccessor: (row) => (row.isActive ? 1 : 0),
        });
      }

      base.push({
        id: "actions",
        header: "",
        align: "right",
        width: 112,
        cell: (row) => (
          <div data-row-action="true" className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                setModalMode("edit");
                setSelectedItem(row);
                setModalOpen(true);
              }}
              aria-label="Редактировать элемент"
              disabled={!canEdit}
            >
              <Pencil className={cn("h-4 w-4")} />
            </Button>

            <ConfirmDialog
              trigger={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Удалить элемент"
                  onClick={(e) => e.stopPropagation()}
                  disabled={isDeletingDictionary || !canEdit}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              }
              title={`Удалить ${config.singularLabel.toLowerCase()}?`}
              description={`Элемент "${row.name || row.label}" будет удален.`}
              confirmLabel="Удалить"
              cancelLabel="Отмена"
              confirmVariant="destructive"
              isConfirming={isDeletingDictionary}
              onConfirm={() => handleDelete(row)}
            />
          </div>
        ),
      });

      return base;
    },
    [
      canEdit,
      config.singularLabel,
      config.supportsActive,
      config.supportsCode,
      handleDelete,
      isDeletingDictionary,
    ],
  );

  const onCreate = () => {
    setModalMode("create");
    setSelectedItem(null);
    setModalOpen(true);
  };

  return (
    <>
      <FilterBar
        search={
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Поиск ${config.singularLabel.toLowerCase()}...`}
          />
        }
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={onCreate} disabled={!canEdit}>
              Создать
            </Button>
          </div>
        }
      />

      <div className="mt-4">
        <DataTable<DictionaryItem>
          columns={columns}
          data={listQuery.data ?? []}
          loading={listQuery.isPending}
          rowKey={(row) => row.id}
          emptyTitle={`Нет ${config.singularLabel.toLowerCase()} найдено`}
          emptyDescription="Попробуйте изменить поиск или создать новый элемент."
        />
      </div>

      <DictionaryModalForm
        open={modalOpen}
        onOpenChange={setModalOpen}
        resource={resource}
        mode={modalMode}
        initialItem={selectedItem}
        readOnly={!canEdit}
      />
    </>
  );
}

