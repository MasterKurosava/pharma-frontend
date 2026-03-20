import { ChevronLeft, ChevronRight } from "lucide-react";

import type { OrdersListUrlState } from "@/features/orders/model/orders-url";
import type { OrdersListResponse } from "@/entities/order/api/order-types";

import { Button } from "@/shared/ui/button";
import { NativeSelect } from "@/shared/ui/native-select/native-select";

const pageSizeOptions = [10, 20, 50, 100] as const;

type OrdersPaginationProps = {
  state: Pick<OrdersListUrlState, "page" | "pageSize">;
  response?: OrdersListResponse;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
};

export function OrdersPagination({
  state,
  response,
  onPageChange,
  onPageSizeChange,
}: OrdersPaginationProps) {
  const totalPages = response?.totalPages ?? 1;
  const total = response?.total ?? 0;

  const isPrevDisabled = state.page <= 1;
  const isNextDisabled = state.page >= totalPages;

  return (
    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-muted-foreground">
        Найдено: <span className="font-medium text-foreground">{total}</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(state.page - 1)}
          disabled={isPrevDisabled}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Назад
        </Button>
        <div className="px-2 text-sm">
          Страница <span className="font-medium">{state.page}</span> из <span className="font-medium">{totalPages}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(state.page + 1)}
          disabled={isNextDisabled}
        >
          Вперед
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>

        <div className="ml-2 flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Размер</span>
          <div className="w-24">
            <NativeSelect
              value={state.pageSize}
              options={pageSizeOptions.map((s) => ({ value: s, label: `${s}` }))}
              onValueChange={(next) => onPageSizeChange(next === "" ? state.pageSize : (next as number))}
              placeholder=""
            />
          </div>
        </div>
      </div>
    </div>
  );
}

