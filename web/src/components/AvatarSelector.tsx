"use client";

import { useState } from "react";
import AvatarPickerModal from "@/components/AvatarPickerModal";
import ProfileAvatar from "@/components/ProfileAvatar";
import type { AvatarEmoji } from "@/lib/avatars";

interface AvatarSelectorProps {
  value: AvatarEmoji;
  onChange: (emoji: AvatarEmoji) => void;
}

export default function AvatarSelector({ value, onChange }: AvatarSelectorProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col items-center">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Change profile picture"
          className="group relative flex h-20 w-20 items-center justify-center rounded-full bg-primary-light transition-all cursor-pointer hover:ring-4 hover:ring-primary/15"
        >
          <ProfileAvatar emoji={value} size="xl" />
          <span
            className="
              absolute -bottom-0.5 -right-0.5 flex h-7 w-7 items-center justify-center
              rounded-full border-2 border-card bg-primary text-[11px] font-semibold text-white
              shadow-sm transition-transform group-hover:scale-105
            "
          >
            ✎
          </span>
        </button>
        <p className="mt-3 text-[13px] text-muted">Tap your picture to change it</p>
      </div>

      <AvatarPickerModal
        open={open}
        value={value}
        onClose={() => setOpen(false)}
        onSelect={onChange}
      />
    </>
  );
}
