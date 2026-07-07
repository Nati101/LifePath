"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import ProfileAvatar from "@/components/ProfileAvatar";
import type { AvatarEmoji } from "@/lib/avatars";

interface ProfileMenuProps {
  avatarEmoji: AvatarEmoji;
  displayName: string;
  settingsHref: string;
  signOutHref: string;
}

function SettingsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 15a3 3 0 100-6 3 3 0 000 6z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9c.26.6.77 1.05 1.4 1.16H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LogOutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ProfileMenu({
  avatarEmoji,
  displayName,
  settingsHref,
  signOutHref,
}: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const [canHover, setCanHover] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const firstName = displayName.split(" ")[0];

  useEffect(() => {
    setCanHover(window.matchMedia("(hover: hover) and (pointer: fine)").matches);
  }, []);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div
      ref={menuRef}
      className="profile-menu"
      onMouseEnter={() => canHover && setOpen(true)}
      onMouseLeave={() => canHover && setOpen(false)}
    >
      <button
        type="button"
        className={`profile-menu-trigger ${open ? "profile-menu-trigger-open" : ""}`}
        aria-label={`${displayName} account menu`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <ProfileAvatar emoji={avatarEmoji} size="sm" />
        <span className="profile-menu-trigger-name">{firstName}</span>
        <svg
          className={`profile-menu-chevron ${open ? "profile-menu-chevron-open" : ""}`}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
        >
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <div
        className={`profile-menu-panel ${open ? "profile-menu-panel-open" : ""}`}
      >
        <div className="profile-menu-dropdown" role="menu">
          <div className="profile-menu-header">
            <ProfileAvatar emoji={avatarEmoji} size="md" />
            <div>
              <p className="profile-menu-name">{displayName}</p>
              <p className="profile-menu-subtitle">Your account</p>
            </div>
          </div>

          <div className="profile-menu-divider" />

          <Link
            href={settingsHref}
            role="menuitem"
            className="profile-menu-item"
            onClick={() => setOpen(false)}
          >
            <SettingsIcon />
            <span>Settings</span>
          </Link>

          <div className="profile-menu-divider" />

          <Link
            href={signOutHref}
            role="menuitem"
            className="profile-menu-item profile-menu-item-danger"
            onClick={() => setOpen(false)}
          >
            <LogOutIcon />
            <span>Log out</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
