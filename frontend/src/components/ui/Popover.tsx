import * as PopoverPrimitive from "@radix-ui/react-popover";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

const Root = PopoverPrimitive.Root;
const Trigger = PopoverPrimitive.Trigger;
const Anchor = PopoverPrimitive.Anchor;

function Content({ className, sideOffset = 8, align = "start", ...props }: ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        sideOffset={sideOffset}
        align={align}
        className={cn("z-50 rounded-card border border-border bg-surface p-3 shadow-lg", className)}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}

export const Popover = { Root, Trigger, Anchor, Content };
