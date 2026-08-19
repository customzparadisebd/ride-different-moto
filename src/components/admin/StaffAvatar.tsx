import { User } from "lucide-react";

import { useAvatarSrc } from "@/lib/avatar";

type StaffAvatarProps = {
  avatarUrl: string | null | undefined;
  alt?: string;
  /** Optional dicebear seed used when no avatar is stored. */
  fallbackSeed?: string | null;
  className?: string;
};

/** Renders a staff avatar, signing private storage objects on demand. */
export function StaffAvatar({
  avatarUrl,
  alt = "Profile",
  fallbackSeed,
  className = "h-full w-full object-cover",
}: StaffAvatarProps) {
  const resolved = useAvatarSrc(avatarUrl);

  const src =
    resolved ||
    (fallbackSeed !== undefined && fallbackSeed !== null
      ? `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(fallbackSeed)}`
      : null);

  if (!src) {
    return (
      <div className="flex size-full items-center justify-center bg-primary/10 text-primary">
        <User className="size-5" />
      </div>
    );
  }

  return <img src={src} alt={alt} className={className} />;
}
