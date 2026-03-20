import { Pencil, Search, SlidersHorizontal, Trash2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { useDebouncedValue } from "@/shared/lib/use-debounced-value";
import { DataTable, type DataTableColumn } from "@/shared/ui/data-table/data-table";
import { NativeSelect } from "@/shared/ui/native-select/native-select";
import { StatusBadge } from "@/shared/ui/status-badge";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Card } from "@/shared/ui/card";

import { useDictionaryOptionsQuery } from "@/features/dictionaries/model/use-dictionary-options";
import type { Product } from "@/entities/product/api/product-types";
import { ProductDrawer } from "@/features/products/ui/product-drawer";
import { useProductsQuery, useDeleteProductMutation } from "@/features/products/api/product-crud-hooks";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { toast } from "sonner";

type ActiveFilterValue = "all" | "active" | "inactive";

function formatDate(date?: string) {
  if (!date) return "—";
  const dt = new Date(date);
  if (Number.isNaN(dt.getTime())) return date;
  return new Intl.DateTimeFormat("ru-RU", { year: "numeric", month: "2-digit", day: "2-digit" }).format(dt);
}

export function ProductsCrudSection() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);

  const [manufacturerId, setManufacturerId] = useState<number | "">("");
  const [activeSubstanceId, setActiveSubstanceId] = useState<number | "">("");
  const [productStatusId, setProductStatusId] = useState<number | "">("");
  const [productOrderSourceId, setProductOrderSourceId] = useState<number | "">("");
  const [isActiveFilter, setIsActiveFilter] = useState<ActiveFilterValue>("all");

  const { options: manufacturerOptions, isPending: isManufacturersPending } = useDictionaryOptionsQuery("manufacturers", {
    params: { isActive: true, search: undefined },
  });
  const { options: activeSubstanceOptions, isPending: isActiveSubstancesPending } = useDictionaryOptionsQuery(
    "active-substances",
    { params: { isActive: true, search: undefined } },
  );
  const { options: productStatusOptions, isPending: isProductStatusesPending } = useDictionaryOptionsQuery("product-statuses", {
    params: { isActive: true, search: undefined },
  });
  const { options: productOrderSourceOptions, isPending: isProductOrderSourcesPending } = useDictionaryOptionsQuery(
    "product-order-sources",
    { params: { isActive: true, search: undefined } },
  );

  const isDictionariesPending =
    isManufacturersPending || isActiveSubstancesPending || isProductStatusesPending || isProductOrderSourcesPending;

  const manufacturerById = useMemo(() => mapOptionsToMap(manufacturerOptions), [manufacturerOptions]);
  const activeSubstanceById = useMemo(() => mapOptionsToMap(activeSubstanceOptions), [activeSubstanceOptions]);
  const productStatusById = useMemo(() => mapOptionsToMap(productStatusOptions), [productStatusOptions]);
  const listQuery = useProductsQuery({
    search: debouncedSearch || undefined,
    manufacturerId: manufacturerId === "" ? undefined : manufacturerId,
    activeSubstanceId: activeSubstanceId === "" ? undefined : activeSubstanceId,
    productStatusId: productStatusId === "" ? undefined : productStatusId,
    productOrderSourceId: productOrderSourceId === "" ? undefined : productOrderSourceId,
    isActive: isActiveFilter === "all" ? undefined : isActiveFilter === "active",
  });

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const [activeProductId, setActiveProductId] = useState<number | string | undefined>(undefined);

  const { mutateAsync: deleteProductAsync, isPending: isDeletingProduct } = useDeleteProductMutation();

  const handleDelete = useCallback(async (row: Product) => {
    try {
      await deleteProductAsync(row.id);
      toast.success("Product deleted");
    } catch {
      // Error toast is shown in mutation onError.
    }
  }, [deleteProductAsync]);

  const openCreate = () => {
    setDrawerMode("create");
    setActiveProductId(undefined);
    setDrawerOpen(true);
  };

  const openEdit = useCallback((productId: number | string) => {
    setDrawerMode("edit");
    setActiveProductId(productId);
    setDrawerOpen(true);
  }, []);

  const columns = useMemo<Array<DataTableColumn<Product>>>(() => {
    return [
      { id: "name", header: "Препарат", accessorKey: "name" },
      {
        id: "manufacturerId",
        header: "Производитель",
        cell: (row) => <span>{manufacturerById.get(row.manufacturerId) ?? "—"}</span>,
        sortable: true,
        sortAccessor: (row) => manufacturerById.get(row.manufacturerId) ?? "",
      },
      {
        id: "activeSubstanceId",
        header: "Действующее вещество",
        cell: (row) => <span>{activeSubstanceById.get(row.activeSubstanceId) ?? "—"}</span>,
        sortable: true,
        sortAccessor: (row) => activeSubstanceById.get(row.activeSubstanceId) ?? "",
      },
      {
        id: "productStatusId",
        header: "Статус",
        cell: (row) => <StatusBadge label={productStatusById.get(row.productStatusId) ?? "—"} tone="neutral" />,
        sortable: true,
        sortAccessor: (row) => productStatusById.get(row.productStatusId) ?? "",
      },
      {
        id: "stockQuantity",
        header: "Запас",
        accessorKey: "stockQuantity",
        align: "right",
        cell: (row) => <span className="tabular-nums">{row.stockQuantity}</span>,
        sortable: true,
      },
      {
        id: "reservedQuantity",
        header: "Резерв",
        accessorKey: "reservedQuantity",
        align: "right",
        cell: (row) => <span className="tabular-nums">{row.reservedQuantity}</span>,
        sortable: true,
      },
      {
        id: "availableQuantity",
        header: "Доступно",
        align: "right",
        cell: (row) => {
          const tone = row.availableQuantity <= 0 ? "danger" : row.availableQuantity < 5 ? "warning" : "success";
          return <StatusBadge label={`${row.availableQuantity}`} tone={tone} />;
        },
      },
      {
        id: "isActive",
        header: "Активен",
        cell: (row) => (
          <StatusBadge label={row.isActive ? "Да" : "Нет"} tone={row.isActive ? "success" : "neutral"} />
        ),
        sortable: true,
        sortAccessor: (row) => (row.isActive ? 1 : 0),
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
              aria-label="Edit product"
              onClick={(e) => {
                e.stopPropagation();
                openEdit(row.id);
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>

            <ConfirmDialog
              trigger={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Delete product"
                  onClick={(e) => e.stopPropagation()}
                  disabled={isDeletingProduct}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              }
              title="Delete product?"
              description={`Product "${row.name}" will be permanently deleted.`}
              confirmLabel="Delete"
              cancelLabel="Cancel"
              confirmVariant="destructive"
              isConfirming={isDeletingProduct}
              onConfirm={() => handleDelete(row)}
            />
          </div>
        ),
      },
    ];
  }, [activeSubstanceById, manufacturerById, productStatusById, openEdit, handleDelete, isDeletingProduct]);

  const onResetFilters = () => {
    setSearch("");
    setManufacturerId("");
    setActiveSubstanceId("");
    setProductStatusId("");
    setProductOrderSourceId("");
    setIsActiveFilter("all");
  };

  return (
    <>
      <Card className="border-border/70 shadow-sm">
        <div className="space-y-3 p-3 md:p-4">
          <div className="flex flex-wrap items-end gap-2">
            <div className="relative min-w-[260px] flex-1 lg:max-w-[420px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск по названию препарата..."
                className="pl-9"
              />
            </div>

            <div className="w-full sm:w-[190px]">
              <NativeSelect
                value={manufacturerId}
                options={manufacturerOptions}
                onValueChange={(next) => setManufacturerId(next)}
                placeholder="Производитель"
                disabled={isDictionariesPending}
              />
            </div>

            <div className="w-full sm:w-[210px]">
              <NativeSelect
                value={activeSubstanceId}
                options={activeSubstanceOptions}
                onValueChange={(next) => setActiveSubstanceId(next)}
                placeholder="Действующее вещество"
                disabled={isDictionariesPending}
              />
            </div>

            <div className="w-full sm:w-[180px]">
              <NativeSelect
                value={productStatusId}
                options={productStatusOptions}
                onValueChange={(next) => setProductStatusId(next)}
                placeholder="Статус"
                disabled={isDictionariesPending}
              />
            </div>

            <div className="w-full sm:w-[210px]">
              <NativeSelect
                value={productOrderSourceId}
                options={productOrderSourceOptions}
                onValueChange={(next) => setProductOrderSourceId(next)}
                placeholder="Источник поступления"
                disabled={isDictionariesPending}
              />
            </div>

            <div className="w-full sm:w-[150px]">
              <NativeSelect
                value={isActiveFilter}
                options={[
                  { value: "all", label: "Все" },
                  { value: "active", label: "Активные" },
                  { value: "inactive", label: "Неактивные" },
                ]}
                onValueChange={(next) => setIsActiveFilter(next === "" ? "all" : next)}
                disabled={isDictionariesPending}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3">
            <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Фильтры и действия
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={onResetFilters}>
                Сбросить
              </Button>
              <Button size="sm" onClick={openCreate}>
                Создать препарат
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <div className="mt-4">
        <DataTable<Product>
          columns={columns}
          data={listQuery.data ?? []}
          loading={listQuery.isPending || isDictionariesPending}
          emptyTitle="Нет препаратов"
          emptyDescription="Создайте новый препарат или измените фильтры."
          rowKey={(row) => row.id}
          onRowClick={(row) => openEdit(row.id)}
        />
      </div>

      <ProductDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        mode={drawerMode}
        productId={activeProductId}
      />
    </>
  );
}

function mapOptionsToMap(options: Array<{ value: number; label: string }>) {
  const map = new Map<number, string>();
  for (const opt of options) map.set(opt.value, opt.label);
  return map;
}

