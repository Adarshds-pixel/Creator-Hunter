import { X } from "lucide-react";
import { motion } from "framer-motion";

interface FilterChipProps {
  label: string;
  onRemove: () => void;
}

export function FilterChip({ label, onRemove }: FilterChipProps) {
  return (
    <motion.span
      layout
      initial={{ opacity: 0, y: -4, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.15 }}
      className="inline-flex items-center gap-1.5 rounded-pill bg-teal-soft px-3 py-1 text-xs font-medium text-teal"
    >
      {label}
      <button type="button" onClick={onRemove} aria-label={`Remove ${label} filter`} className="hover:text-ink">
        <X size={12} />
      </button>
    </motion.span>
  );
}
