export const DEFAULT_AVATAR = "😊";

export const avatarOptions = [
  { emoji: "😊", label: "Smile" },
  { emoji: "😄", label: "Happy" },
  { emoji: "😎", label: "Cool" },
  { emoji: "🤓", label: "Smart" },
  { emoji: "🥳", label: "Party" },
  { emoji: "🙂", label: "Calm" },
  { emoji: "🦊", label: "Fox" },
  { emoji: "🐼", label: "Panda" },
  { emoji: "🦁", label: "Lion" },
  { emoji: "🦋", label: "Butterfly" },
  { emoji: "🌟", label: "Star" },
  { emoji: "🚀", label: "Rocket" },
] as const;

export type AvatarEmoji = (typeof avatarOptions)[number]["emoji"];

const validEmojis = new Set<string>(avatarOptions.map((a) => a.emoji));

export function normalizeAvatar(value: string | null | undefined): AvatarEmoji {
  if (value && validEmojis.has(value)) {
    return value as AvatarEmoji;
  }
  return DEFAULT_AVATAR;
}
