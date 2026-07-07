"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { avatarOptions, type AvatarEmoji } from "@/lib/avatars";

interface AvatarPickerModalProps {
  open: boolean;
  value: AvatarEmoji;
  onClose: () => void;
  onSelect: (emoji: AvatarEmoji) => void;
}

export default function AvatarPickerModal({
  open,
  value,
  onClose,
  onSelect,
}: AvatarPickerModalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const startIndex = avatarOptions.findIndex((option) => option.emoji === value);
  const [index, setIndex] = useState(startIndex >= 0 ? startIndex : 0);

  const scrollToIndex = useCallback((nextIndex: number, smooth = true) => {
    const container = scrollRef.current;
    if (!container) return;
    const slide = container.children[nextIndex] as HTMLElement | undefined;
    slide?.scrollIntoView({
      behavior: smooth ? "smooth" : "instant",
      inline: "center",
      block: "nearest",
    });
    setIndex(nextIndex);
  }, []);

  useEffect(() => {
    if (!open) return;
    const initial = startIndex >= 0 ? startIndex : 0;
    setIndex(initial);
    requestAnimationFrame(() => scrollToIndex(initial, false));
  }, [open, startIndex, scrollToIndex]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") {
        scrollToIndex(Math.max(0, index - 1));
      }
      if (event.key === "ArrowRight") {
        scrollToIndex(Math.min(avatarOptions.length - 1, index + 1));
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, index, onClose, scrollToIndex]);

  const handleScroll = () => {
    const container = scrollRef.current;
    if (!container) return;
    const slideWidth = container.offsetWidth;
    if (!slideWidth) return;
    const nextIndex = Math.round(container.scrollLeft / slideWidth);
    if (nextIndex !== index) setIndex(nextIndex);
  };

  const current = avatarOptions[index];

  if (!open) return null;

  return (
    <div className="avatar-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="avatar-modal-panel animate-fade-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="avatar-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2
            id="avatar-modal-title"
            className="text-[18px] font-semibold tracking-tight text-foreground"
          >
            Choose your picture
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="avatar-modal-close"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="relative mb-6">
          <button
            type="button"
            onClick={() => scrollToIndex(Math.max(0, index - 1))}
            disabled={index === 0}
            className="avatar-modal-nav avatar-modal-nav-left"
            aria-label="Previous"
          >
            ‹
          </button>

          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="avatar-modal-carousel"
          >
            {avatarOptions.map((option) => (
              <div key={option.emoji} className="avatar-modal-slide">
                <div className="avatar-modal-emoji">{option.emoji}</div>
                <p className="text-[16px] font-medium text-foreground">
                  {option.label}
                </p>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() =>
              scrollToIndex(Math.min(avatarOptions.length - 1, index + 1))
            }
            disabled={index === avatarOptions.length - 1}
            className="avatar-modal-nav avatar-modal-nav-right"
            aria-label="Next"
          >
            ›
          </button>
        </div>

        <div className="mb-6 flex justify-center gap-2">
          {avatarOptions.map((option, dotIndex) => (
            <button
              key={option.emoji}
              type="button"
              onClick={() => scrollToIndex(dotIndex)}
              aria-label={`Go to ${option.label}`}
              className={`avatar-modal-dot ${dotIndex === index ? "avatar-modal-dot-active" : ""}`}
            />
          ))}
        </div>

        <p className="mb-4 text-center text-[13px] text-muted">
          Swipe left or right to browse
        </p>

        <button
          type="button"
          onClick={() => {
            onSelect(current.emoji);
            onClose();
          }}
          className="btn-primary"
        >
          Choose {current.emoji}
        </button>
      </div>
    </div>
  );
}
