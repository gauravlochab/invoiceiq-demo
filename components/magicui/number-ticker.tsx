"use client";

// [Spec: domains/dashboard/spec.md#Accessibility] — reduced-motion guard.
// The CSS prefers-reduced-motion block in globals.css does NOT cover JS spring
// animation; this component guards itself with Framer Motion's useReducedMotion().
import { useEffect, useRef } from "react";
import {
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";

interface NumberTickerProps {
  value: number;
  direction?: "up" | "down";
  delay?: number;
  className?: string;
  decimalPlaces?: number;
  prefix?: string;
  suffix?: string;
}

export function NumberTicker({
  value,
  direction = "up",
  delay = 0,
  className = "",
  decimalPlaces = 0,
  prefix = "",
  suffix = "",
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  // When reduced motion is requested, render the final value immediately and
  // skip the spring entirely. Otherwise the motion value starts from 0 (or the
  // value, for "down") and springs to the target.
  const prefersReducedMotion = useReducedMotion();
  const motionValue = useMotionValue(direction === "down" ? value : 0);
  const springValue = useSpring(motionValue, { damping: 50, stiffness: 400 });
  const isInView = useInView(ref, { once: true, margin: "0px" });

  const format = (n: number) =>
    `${prefix}${Intl.NumberFormat("en-US", {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    }).format(Number(n.toFixed(decimalPlaces)))}${suffix}`;

  // Reduced motion: paint the final value directly, no animation.
  useEffect(() => {
    if (!prefersReducedMotion) return;
    if (ref.current) ref.current.textContent = format(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefersReducedMotion, value, decimalPlaces, prefix, suffix]);

  useEffect(() => {
    if (prefersReducedMotion) return;
    if (!isInView) return;
    const timer = setTimeout(() => {
      motionValue.set(direction === "down" ? 0 : value);
    }, delay * 1000);
    return () => clearTimeout(timer);
  }, [motionValue, isInView, delay, value, direction, prefersReducedMotion]);

  useEffect(() => {
    if (prefersReducedMotion) return;
    return springValue.on("change", (latest) => {
      if (!ref.current) return;
      ref.current.textContent = format(latest);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [springValue, decimalPlaces, prefix, suffix, prefersReducedMotion]);

  return (
    <span
      ref={ref}
      className={className}
      style={{ fontVariantNumeric: "tabular-nums" }}
    >
      {/* SSR / first-paint fallback — replaced by the effects above on mount */}
      {prefersReducedMotion ? format(value) : null}
    </span>
  );
}
