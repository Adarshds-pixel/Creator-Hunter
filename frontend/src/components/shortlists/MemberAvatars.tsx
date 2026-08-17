import { Avatar } from "../ui/Avatar";

interface Member {
  name: string;
  photo?: string;
}

interface MemberAvatarsProps {
  members: Member[];
  max?: number;
}

// Overlapping member photos + a real numeric +N overflow badge — distinct
// from AvatarStack (Discover header decoration with a follower-style
// abbreviated total), this one reflects an exact remaining count.
export function MemberAvatars({ members, max = 4 }: MemberAvatarsProps) {
  const visible = members.slice(0, max);
  const overflow = members.length - visible.length;

  if (members.length === 0) {
    return <p className="text-xs text-ink-secondary">No creators yet</p>;
  }

  return (
    <div className="flex -space-x-2">
      {visible.map((m, i) => (
        <Avatar key={`${m.name}-${i}`} src={m.photo} name={m.name} size={28} className="ring-2 ring-surface" />
      ))}
      {overflow > 0 && (
        <div className="flex h-7 w-7 items-center justify-center rounded-pill bg-steel-100 text-[10px] font-medium text-steel-700 ring-2 ring-surface">
          +{overflow}
        </div>
      )}
    </div>
  );
}
