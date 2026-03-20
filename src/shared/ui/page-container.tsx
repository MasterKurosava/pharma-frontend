import type { ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

type PageContainerProps = {
  children: ReactNode;
  className?: string;
};

export function PageContainer({ children, className }: PageContainerProps) {
  return <section className={cn("mx-auto w-full space-y-6", className)}>{children}</section>;
}
