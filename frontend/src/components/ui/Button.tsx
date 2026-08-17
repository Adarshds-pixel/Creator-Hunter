import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "outline";

const BASE =
  "inline-flex items-center justify-center px-4 py-2 rounded-control text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-teal text-white hover:bg-teal/90",
  secondary: "bg-steel-100 text-ink hover:bg-steel-300/60",
  outline: "border-[0.5px] border-border text-ink hover:bg-steel-100",
};

// Exported so link-as-button cases (React Router <Link>) can share the
// exact same visual treatment without nesting an <a> inside a <button>.
export function buttonClasses(variant: Variant = "primary", className = "") {
  return `${BASE} ${VARIANTS[variant]} ${className}`;
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: Variant;
}

export function Button({ children, variant = "primary", className = "", ...props }: ButtonProps) {
  return (
    <button className={buttonClasses(variant, className)} {...props}>
      {children}
    </button>
  );
}
