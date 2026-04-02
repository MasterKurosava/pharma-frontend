import type { ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

type OrderFormSectionProps = {
  children: ReactNode;
  className?: string;
};

export function OrderFormSection({children, className }: OrderFormSectionProps) {
  return (
    <section className={cn("border-b px-6 py-5 last:border-b-0", className)}>
      <div className="mt-4">{children}</div>
    </section>
  );
}
