"use client";

import { CSSProperties } from "react";

interface BorderBeamProps {
  /** Size of the spinning gradient element. Larger = wider beam. */
  size?: number;
  /** Duration in seconds for one full rotation. */
  duration?: number;
  /** Starting color of the beam. */
  colorFrom?: string;
  /** Ending color of the beam. */
  colorTo?: string;
  /** Border thickness in px. */
  borderWidth?: number;
  /** Animation delay in seconds. */
  delay?: number;
  className?: string;
}

/**
 * BorderBeam — an animated conic-gradient beam that travels around a card border.
 *
 * Usage: place as a direct child of a `position: relative; overflow: hidden` parent.
 * The parent should have `border-radius` set — the beam inherits it.
 *
 * ```tsx
 * <div className="relative overflow-hidden rounded-lg">
 *   <BorderBeam />
 *   <p>Your content</p>
 * </div>
 * ```
 */
export function BorderBeam({
  size = 400,
  duration = 6,
  colorFrom = "#DC2626",
  colorTo = "#F59E0B",
  borderWidth = 1.5,
  delay = 0,
  className = "",
}: BorderBeamProps) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 rounded-[inherit] ${className}`}
      style={
        {
          "--beam-size": `${size}px`,
          "--beam-duration": `${duration}s`,
          "--beam-delay": `${delay}s`,
          "--beam-color-from": colorFrom,
          "--beam-color-to": colorTo,
          "--beam-border": `${borderWidth}px`,
        } as CSSProperties
      }
    >
      {/* Outer mask — shows only the border strip */}
      <div
        className="absolute inset-0 rounded-[inherit]"
        style={{
          padding: borderWidth,
          background: "transparent",
          WebkitMask:
            "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          overflow: "hidden",
        }}
      >
        {/* The spinning conic gradient — the actual beam */}
        <div
          style={{
            position: "absolute",
            inset: `calc((var(--beam-size) / -2) + 50%)`,
            width: "var(--beam-size)",
            height: "var(--beam-size)",
            background: `conic-gradient(from 0deg, transparent 0%, transparent 55%, var(--beam-color-from) 72%, var(--beam-color-to) 85%, transparent 100%)`,
            animation: `borderBeamSpin var(--beam-duration) linear var(--beam-delay) infinite`,
          }}
        />
      </div>
    </div>
  );
}
