import type { OrderHistoryItem } from "@/entities/order/api/order-types";
import { Skeleton } from "@/shared/ui/skeleton/skeleton";
import { useMemo } from "react";

type OrderHistoryPanelProps = {
  history: OrderHistoryItem[];
  loading: boolean;
};

function formatDate(date?: string) {
  if (!date) return "—";
  const dt = new Date(date);
  if (Number.isNaN(dt.getTime())) return date;
  return new Intl.DateTimeFormat("ru-RU", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(dt);
}

export function OrderHistoryPanel({ history, loading }: OrderHistoryPanelProps) {
  const count = history.length;

  const items = useMemo(() => history.slice().reverse(), [history]);

  return (
    <details className="group">
      <summary className="flex cursor-pointer list-none items-center justify-between rounded-md px-1 py-1 text-sm font-semibold">
        <span>История</span>
        <span className="text-xs text-muted-foreground">{count}</span>
      </summary>

      <div className="mt-3 space-y-2">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="space-y-1 rounded-md border bg-muted/15 p-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-full" />
              </div>
            ))}
          </div>
        ) : count === 0 ? (
          <p className="text-sm text-muted-foreground">История пока пуста.</p>
        ) : (
          items.map((it) => (
            <div key={it.id} className="rounded-md border bg-muted/10 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{it.event}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatDate(it.createdAt)}</p>
                  {it.actorUserId ? <p className="text-xs text-muted-foreground">Пользователь: #{it.actorUserId}</p> : null}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </details>
  );
}

