import { Pencil, Trash2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { useCitiesQuery, useDeleteCityMutation } from "@/features/cities/api/city-crud-hooks";
import { CityModalForm } from "@/features/cities/ui/city-modal-form";
import { useCountryOptionsQuery } from "@/features/cities/model/use-country-options";
import { useDebouncedValue } from "@/shared/lib/use-debounced-value";
import { Button } from "@/shared/ui/button";
import { FilterBar } from "@/shared/ui/filter-bar/filter-bar";
import { NativeSelect } from "@/shared/ui/native-select/native-select";
import { DataTable, type DataTableColumn } from "@/shared/ui/data-table/data-table";
import { Input } from "@/shared/ui/input";
import { SegmentedControl } from "@/shared/ui/segmented-control/segmented-control";
import { StatusBadge } from "@/shared/ui/status-badge";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { toast } from "sonner";
import type { City } from "@/entities/city/api/city-types";

type ActiveFilterValue = "all" | "active" | "inactive";

export function CitiesCrudSection() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);

  const [countryId, setCountryId] = useState<number | "">("");
  const [activeFilter, setActiveFilter] = useState<ActiveFilterValue>("all");

  const listQuery = useCitiesQuery({
    search: debouncedSearch ? debouncedSearch : undefined,
    countryId: countryId === "" ? undefined : countryId,
    isActive: activeFilter === "all" ? undefined : activeFilter === "active",
  });

  const { options: countryOptions, isPending: isCountriesPending } = useCountryOptionsQuery();

  const countryById = useMemo(() => {
    const map = new Map<number, string>();
    for (const opt of countryOptions) {
      map.set(opt.value, opt.label);
    }
    return map;
  }, [countryOptions]);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedCityId, setSelectedCityId] = useState<number | string | undefined>(undefined);

  const { mutateAsync: deleteCityAsync, isPending: isDeletingCity } = useDeleteCityMutation();

  const handleDelete = useCallback(async (row: City) => {
    try {
      await deleteCityAsync(row.id);
      toast.success("Город удален");
    } catch {
      // Error toast is shown in mutation onError.
    }
  }, [deleteCityAsync]);

  const columns = useMemo<Array<DataTableColumn<City>>>(
    () => [
      { id: "name", header: "Город", accessorKey: "name", sortable: true },
      {
        id: "countryId",
        header: "Страна",
        cell: (row) => <span>{countryById.get(row.countryId) ?? "—"}</span>,
        sortable: true,
        sortAccessor: (row) => countryById.get(row.countryId) ?? "",
      },
      {
        id: "isActive",
        header: "Status",
        cell: (row) => (
          <StatusBadge
            label={row.isActive ? "Активен" : "Неактивен"}
            tone={row.isActive ? "success" : "neutral"}
          />
        ),
        sortable: true,
        sortAccessor: (row) => (row.isActive ? 1 : 0),
      },
      {
        id: "actions",
        header: "",
        align: "right",
        width: 112,
        cell: (row) => (
          <div data-row-action="true" className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Редактировать город"
              onClick={(e) => {
                e.stopPropagation();
                setModalMode("edit");
                setSelectedCityId(row.id);
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
                  aria-label="Удалить город"
                  onClick={(e) => e.stopPropagation()}
                  disabled={isDeletingCity}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              }
              title="Удалить город?"
              description={`Город "${row.name}" будет удален.`}
              confirmLabel="Удалить"
              cancelLabel="Отмена"
              confirmVariant="destructive"
              isConfirming={isDeletingCity}
              onConfirm={() => handleDelete(row)}
            />
          </div>
        ),
      },
    ],
    [countryById, handleDelete, isDeletingCity],
  );

  const activeFilterControl = (
    <SegmentedControl
      value={activeFilter}
      options={[
        { value: "all", label: "Все" },
        { value: "active", label: "Активные" },
        { value: "inactive", label: "Неактивные" },
      ]}
      onChange={(next) => setActiveFilter(next)}
    />
  );

  return (
    <>
      <FilterBar
        search={
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по названию города"
          />
        }
        actions={
          <Button
            size="sm"
            onClick={() => {
              setModalMode("create");
              setSelectedCityId(undefined);
              setModalOpen(true);
            }}
          >
            Создать город
          </Button>
        }
      >
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
          <div className="w-full sm:w-64">
            <NativeSelect
              value={countryId}
              options={countryOptions}
              onValueChange={(next) => setCountryId(next)}
              placeholder="Все страны"
            />
          </div>
          <div className="sm:flex-1">{activeFilterControl}</div>
          {listQuery.isFetching ? (
            <div className="text-xs text-muted-foreground">Updating...</div>
          ) : null}
        </div>
      </FilterBar>

      <div className="mt-4">
        <DataTable<City>
          columns={columns}
          data={listQuery.data ?? []}
          loading={listQuery.isPending || isCountriesPending}
          emptyTitle="No cities found"
          emptyDescription="Try adjusting search and filters, or create a new city."
          rowKey={(row) => row.id}
        />
      </div>

      <CityModalForm
        open={modalOpen}
        onOpenChange={(next) => setModalOpen(next)}
        mode={modalMode}
        cityId={selectedCityId}
      />
    </>
  );
}

