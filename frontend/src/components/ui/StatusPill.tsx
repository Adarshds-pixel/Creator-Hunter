const STATUS_TONE: Record<string, string> = {
  DRAFT: "bg-steel-100 text-steel-700",
  ACTIVE: "bg-teal-soft text-teal",
  DISCOVERED: "bg-steel-100 text-steel-700",
  SHORTLISTED: "bg-amber-soft text-amber",
  CONTACTED: "bg-blue-soft text-blue",
  REPLIED: "bg-success-soft text-success",
  INTERESTED: "bg-success-soft text-success",
  NEGOTIATING: "bg-amber-soft text-amber",
  APPROVED: "bg-success-soft text-success",
  CONTENT_SUBMITTED: "bg-blue-soft text-blue",
  COMPLETED: "bg-success-soft text-success",
  REJECTED: "bg-danger-soft text-danger",
  NO_RESPONSE: "bg-steel-100 text-steel-700",
};

interface StatusPillProps {
  status: string;
  className?: string;
}

export function StatusPill({ status, className = "" }: StatusPillProps) {
  const tone = STATUS_TONE[status] ?? "bg-steel-100 text-steel-700";
  return (
    <span
      className={`inline-flex items-center rounded-md px-2.5 py-1 font-data text-[11px] font-semibold uppercase tracking-wide ${tone} ${className}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
