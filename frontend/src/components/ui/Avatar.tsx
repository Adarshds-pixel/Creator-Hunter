import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "../../lib/cn";

interface AvatarProps {
  src?: string;
  name: string;
  size?: number;
  /** Token ring color class, e.g. "ring-magenta" — platform-colored ring on CreatorCard. */
  ringClassName?: string;
  className?: string;
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// Radix's Fallback shows automatically while the image loads and on error —
// this is what guarantees "never a broken image icon", not manual onError wiring.
export function Avatar({ src, name, size = 40, ringClassName, className = "" }: AvatarProps) {
  return (
    <AvatarPrimitive.Root
      className={cn(
        "relative inline-flex shrink-0 overflow-hidden rounded-pill",
        ringClassName && `ring-2 ${ringClassName}`,
        className
      )}
      style={{ width: size, height: size }}
    >
      {src && <AvatarPrimitive.Image src={src} alt={name} className="h-full w-full object-cover" />}
      <AvatarPrimitive.Fallback
        delayMs={src ? 300 : 0}
        className="flex h-full w-full items-center justify-center bg-teal-soft font-data font-semibold text-teal"
        style={{ fontSize: Math.round(size * 0.35) }}
      >
        {initials(name)}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}
