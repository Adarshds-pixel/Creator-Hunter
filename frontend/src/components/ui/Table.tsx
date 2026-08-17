import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";

// Dense tables get row hierarchy from alternating backgrounds rather than a
// hairline on every row (see design plan) — striping lives here once,
// nowhere per-screen.

function Root({ className = "", ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto">
      <table className={`w-full border-collapse text-left text-sm ${className}`} {...props} />
    </div>
  );
}

function Head({ className = "", ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={`border-b-[0.5px] border-border font-data text-xs uppercase tracking-wide text-steel-500 ${className}`}
      {...props}
    />
  );
}

function Body({ className = "", ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={`[&>tr:nth-child(even)]:bg-steel-100/60 ${className}`} {...props} />;
}

function Row({ className = "", ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={className} {...props} />;
}

function HeaderCell({ className = "", ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return <th scope="col" className={`px-3 py-2 font-medium ${className}`} {...props} />;
}

function Cell({ className = "", ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={`px-3 py-2 text-ink ${className}`} {...props} />;
}

export const Table = { Root, Head, Body, Row, HeaderCell, Cell };
