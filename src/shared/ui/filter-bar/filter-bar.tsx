import type { ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

export type FilterBarProps = {
  className?: string;
  search?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
};

export function FilterBar({ className, search, actions, children }: FilterBarProps) {
  return (
    <section className={cn("rounded-xl border bg-card p-4 shadow-sm", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid w-full gap-3 sm:flex-1 sm:grid-cols-[1fr_auto]">
          {search ? <div className="sm:col-span-1">{search}</div> : null}
          <div className={cn(search ? "sm:col-span-1" : "sm:col-span-2")}>{children}</div>
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
    </section>
  );
}

