import type { ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

type OrderFormSectionProps = {
  title: string;
  children: ReactNode;
  className?: string;
};

export function OrderFormSection({ title, children, className }: OrderFormSectionProps) {
  return (
    <section className={cn("border-b px-6 py-5 last:border-b-0", className)}>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}
