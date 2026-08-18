interface AuthBrandMarkProps {
  size?: "sm" | "lg";
}

// Shared "CH" monogram + wordmark for the auth pages — was duplicated
// inline (hero + mobile variant) across Login.tsx and Register.tsx.
export function AuthBrandMark({ size = "lg" }: AuthBrandMarkProps) {
  if (size === "sm") {
    return (
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-soft text-teal font-bold text-sm border border-teal/20">
          CH
        </div>
        <span className="font-semibold text-ink text-base tracking-tight">Creator Hunter</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm text-white font-bold text-base border border-white/[0.12]">
        CH
      </div>
      <span className="text-white font-semibold text-lg tracking-tight">Creator Hunter</span>
    </div>
  );
}
