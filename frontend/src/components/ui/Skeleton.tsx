interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      role="presentation"
      aria-hidden="true"
      className={`animate-pulse rounded-control bg-steel-100 ${className}`}
    />
  );
}
