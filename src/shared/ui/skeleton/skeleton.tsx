import type { HTMLAttributes } from "react";

import { cn } from "@/shared/lib/utils";

type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
  className?: string;
};

export function Skeleton({ className, ...props }: SkeletonProps) {
  return <div className={cn("animate-pulse rounded-md bg-muted/60", className)} {...props} />;
}

export function PageHeaderSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-6 w-52 rounded bg-muted/60" />
      <div className="h-4 w-80 rounded bg-muted/60" />
    </div>
  );
}

export function TableSkeleton({ columnsCount, rowsCount = 6 }: { columnsCount: number; rowsCount?: number }) {
  return (
    <>
      {Array.from({ length: rowsCount }).map((_, rowIndex) => (
        <tr key={rowIndex} className="border-b last:border-b-0">
          {Array.from({ length: columnsCount }).map((__, cellIndex) => (
            <td key={`${rowIndex}-${cellIndex}`} className="px-4 py-3">
              <Skeleton className="h-4 w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function DrawerFormSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <div className="h-6 w-40 rounded bg-muted/60" />
      <div className="h-4 w-64 rounded bg-muted/60" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-1">
            <div className="h-4 w-28 rounded bg-muted/60" />
            <div className="h-10 w-full rounded bg-muted/60" />
          </div>
        ))}
      </div>
      <div className="pt-4">
        <div className="h-10 w-36 rounded bg-muted/60" />
      </div>
    </div>
  );
}

