import { useState, type ReactNode } from "react";
import { ArrowUpDown, MoreVertical } from "lucide-react";
import { Table } from "../ui/Table";
import { DropdownMenu } from "../ui/DropdownMenu";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  align?: "left" | "right";
  sortValue?: (row: T) => string | number;
  render: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  rowActions?: (row: T) => ReactNode;
}

export function DataTable<T>({ columns, rows, rowKey, rowActions }: DataTableProps<T>) {
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);

  const sortedRows = (() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return rows;
    return [...rows].sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      if (av < bv) return -1 * sort.dir;
      if (av > bv) return 1 * sort.dir;
      return 0;
    });
  })();

  function toggleSort(col: DataTableColumn<T>) {
    if (!col.sortValue) return;
    setSort((prev) =>
      prev?.key === col.key ? { key: col.key, dir: prev.dir === 1 ? -1 : 1 } : { key: col.key, dir: 1 }
    );
  }

  return (
    <Table.Root>
      <Table.Head>
        <Table.Row>
          {columns.map((col) => (
            <Table.HeaderCell key={col.key} className={col.align === "right" ? "text-right" : undefined}>
              {col.sortValue ? (
                <button
                  type="button"
                  onClick={() => toggleSort(col)}
                  className="inline-flex items-center gap-1 hover:text-ink"
                >
                  {col.header}
                  <ArrowUpDown size={12} className={sort?.key === col.key ? "text-teal" : "text-steel-500"} />
                </button>
              ) : (
                col.header
              )}
            </Table.HeaderCell>
          ))}
          {rowActions && <Table.HeaderCell className="w-8" />}
        </Table.Row>
      </Table.Head>
      <Table.Body>
        {sortedRows.map((row) => (
          <Table.Row key={rowKey(row)} className="hover:bg-surface-2">
            {columns.map((col) => (
              <Table.Cell key={col.key} className={col.align === "right" ? "text-right" : undefined}>
                {col.render(row)}
              </Table.Cell>
            ))}
            {rowActions && (
              <Table.Cell className="text-right">
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <button
                      type="button"
                      aria-label="Row actions"
                      className="rounded-control p-1 text-steel-500 hover:bg-steel-100 hover:text-ink"
                    >
                      <MoreVertical size={16} />
                    </button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Content>{rowActions(row)}</DropdownMenu.Content>
                </DropdownMenu.Root>
              </Table.Cell>
            )}
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
}
