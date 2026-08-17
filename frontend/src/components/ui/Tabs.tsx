import type { ReactNode } from "react";
import * as RadixTabs from "@radix-ui/react-tabs";

interface TabItem {
  value: string;
  label: string;
  content: ReactNode;
}

interface TabsProps {
  items: TabItem[];
  defaultValue?: string;
}

export function Tabs({ items, defaultValue }: TabsProps) {
  return (
    <RadixTabs.Root defaultValue={defaultValue ?? items[0]?.value}>
      <RadixTabs.List className="flex gap-4 border-b-[0.5px] border-border" aria-label="Sections">
        {items.map((item) => (
          <RadixTabs.Trigger
            key={item.value}
            value={item.value}
            className="border-b-2 border-transparent px-1 py-2 text-sm font-medium text-steel-500 transition-colors data-[state=active]:border-teal data-[state=active]:text-ink"
          >
            {item.label}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>
      {items.map((item) => (
        <RadixTabs.Content key={item.value} value={item.value} className="pt-4">
          {item.content}
        </RadixTabs.Content>
      ))}
    </RadixTabs.Root>
  );
}
