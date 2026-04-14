import type { ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

type OrderFormSectionProps = {
  children: ReactNode;
  className?: string;
  title?: string;
  description?: string;
  titleClassName?: string;
};

export function OrderFormSection({
  children,
  className,
  title,
  description,
  titleClassName,
}: OrderFormSectionProps) {
  return (
    <section className={cn("border-b px-6 py-5 last:border-b-0", className)}>
      {title ? (
        <div className="space-y-1">
          <h3 className={cn("text-sm font-semibold text-foreground", titleClassName)}>{title}</h3>
          {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
        </div>
      ) : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}
