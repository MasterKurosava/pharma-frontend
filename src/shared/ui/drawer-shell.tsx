import * as Dialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

type DrawerShellProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  side?: "left" | "right";
  hideHeader?: boolean;
};

export function DrawerShell({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  side = "right",
  hideHeader = false,
}: DrawerShellProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 transition-opacity data-[state=closed]:opacity-0 data-[state=open]:opacity-100" />
        <Dialog.Content
          className={cn(
            "fixed inset-y-0 z-50 w-[85vw] max-w-sm bg-background shadow-lg",
            "flex flex-col overflow-hidden transition-transform duration-300 ease-out",
            side === "right" ? "right-0 border-l" : "left-0 border-r",
            side === "right"
              ? "data-[state=open]:translate-x-0 data-[state=closed]:translate-x-full"
              : "data-[state=open]:translate-x-0 data-[state=closed]:-translate-x-full",
            className,
          )}
        >
          {!hideHeader ? (
            <div className="p-4">
              <Dialog.Title className="text-base font-semibold">{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                  {description}
                </Dialog.Description>
              ) : null}
            </div>
          ) : (
            <Dialog.Title className="sr-only">{title}</Dialog.Title>
          )}

          <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
