import type { ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
}

// Mobile bottom-sheet variant of Modal — same Radix Dialog primitive as
// Modal.tsx, just a full-width panel anchored to the bottom instead of a
// centered card, for the <640px "Advanced Filters" flow.
export function Sheet({ open, onOpenChange, title, children }: SheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-ink/40" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-card border-t border-border bg-surface p-5 shadow-lg">
          <div className="mx-auto mb-3 h-1 w-10 rounded-pill bg-steel-300" />
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-base font-semibold text-ink">{title}</Dialog.Title>
            <Dialog.Close
              aria-label="Close"
              className="rounded-control p-1 text-steel-500 hover:bg-steel-100 hover:text-ink"
            >
              ×
            </Dialog.Close>
          </div>
          <div className="mt-4">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
