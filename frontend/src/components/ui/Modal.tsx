import type { ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
}

export function Modal({ open, onOpenChange, title, description, children }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-ink/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-card border-[0.5px] border-border bg-surface p-6 shadow-lg">
          <Dialog.Title className="text-base font-semibold text-ink">{title}</Dialog.Title>
          {description && (
            <Dialog.Description className="mt-1 text-sm text-steel-500">
              {description}
            </Dialog.Description>
          )}
          <div className="mt-4">{children}</div>
          <Dialog.Close
            aria-label="Close"
            className="absolute right-4 top-4 rounded-control p-1 text-steel-500 hover:bg-steel-100 hover:text-ink"
          >
            ×
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
