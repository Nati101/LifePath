import { normalizeAvatar } from "@/lib/avatars";

interface ProfileAvatarProps {
  emoji: string | null | undefined;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizes = {
  sm: "h-8 w-8 text-lg",
  md: "h-12 w-12 text-2xl",
  lg: "h-16 w-16 text-[28px]",
  xl: "h-20 w-20 text-[34px]",
};

export default function ProfileAvatar({
  emoji,
  size = "md",
  className = "",
}: ProfileAvatarProps) {
  const display = normalizeAvatar(emoji);

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-transparent ${sizes[size]} ${className}`}
      aria-hidden
    >
      {display}
    </span>
  );
}
