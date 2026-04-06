"use client";

import {
  RefObject,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { motion } from "framer-motion";

interface AnimatedBeamProps {
  containerRef: RefObject<HTMLElement | null>;
  fromRef: RefObject<HTMLElement | null>;
  toRef: RefObject<HTMLElement | null>;
  curvature?: number;
  reverse?: boolean;
  duration?: number;
  delay?: number;
  colorFrom?: string;
  colorTo?: string;
  dotted?: boolean;
}

function useClientRect(ref: RefObject<HTMLElement | null>) {
  const [rect, setRect] = useState({ x: 0, y: 0, w: 0, h: 0 });
  useEffect(() => {
    function update() {
      if (!ref.current) return;
      const r = ref.current.getBoundingClientRect();
      setRect({ x: r.left, y: r.top, w: r.width, h: r.height });
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [ref]);
  return rect;
}

/**
 * AnimatedBeam — draws an animated SVG path between two DOM elements,
 * with a light particle that travels along the path.
 *
 * Both `fromRef` and `toRef` must be children of `containerRef`.
 *
 * ```tsx
 * const containerRef = useRef(null);
 * const fromRef = useRef(null);
 * const toRef = useRef(null);
 *
 * <div ref={containerRef} className="relative">
 *   <div ref={fromRef}>A</div>
 *   <div ref={toRef}>B</div>
 *   <AnimatedBeam containerRef={containerRef} fromRef={fromRef} toRef={toRef} />
 * </div>
 * ```
 */
export function AnimatedBeam({
  containerRef,
  fromRef,
  toRef,
  curvature = 0,
  reverse = false,
  duration = 2,
  delay = 0,
  colorFrom = "#DC2626",
  colorTo = "#F59E0B",
  dotted = false,
}: AnimatedBeamProps) {
  const id = useId();
  const gradientId = `beam-grad-${id}`;
  const [path, setPath] = useState("");
  const [svgDims, setSvgDims] = useState({ w: 0, h: 0, offX: 0, offY: 0 });

  useEffect(() => {
    function update() {
      if (!containerRef.current || !fromRef.current || !toRef.current) return;

      const container = containerRef.current.getBoundingClientRect();
      const from = fromRef.current.getBoundingClientRect();
      const to = toRef.current.getBoundingClientRect();

      const x1 = from.left + from.width / 2 - container.left;
      const y1 = from.top + from.height / 2 - container.top;
      const x2 = to.left + to.width / 2 - container.left;
      const y2 = to.top + to.height / 2 - container.top;

      const cx = (x1 + x2) / 2;
      const cy = (y1 + y2) / 2 - curvature;

      setPath(`M ${x1},${y1} Q ${cx},${cy} ${x2},${y2}`);
      setSvgDims({
        w: container.width,
        h: container.height,
        offX: 0,
        offY: 0,
      });
    }

    update();
    const observer = new ResizeObserver(update);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [containerRef, fromRef, toRef, curvature]);

  if (!path) return null;

  return (
    <svg
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        width: svgDims.w,
        height: svgDims.h,
        pointerEvents: "none",
        overflow: "visible",
      }}
    >
      <defs>
        <linearGradient id={gradientId} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={colorFrom} />
          <stop offset="100%" stopColor={colorTo} />
        </linearGradient>
      </defs>

      {/* Static track */}
      <path
        d={path}
        fill="none"
        stroke="#E7E5E4"
        strokeWidth={1.5}
        strokeDasharray={dotted ? "4 4" : undefined}
      />

      {/* Animated beam particle */}
      <motion.path
        d={path}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={2}
        strokeLinecap="round"
        initial={{ pathLength: 0, pathOffset: reverse ? 1 : 0, opacity: 0 }}
        animate={{
          pathLength: [0, 0.3, 0.3],
          pathOffset: reverse ? [1, 0.7, 0] : [0, 0.3, 1],
          opacity: [0, 1, 0],
        }}
        transition={{
          duration,
          delay,
          ease: "linear",
          repeat: Infinity,
          repeatDelay: 0,
        }}
      />
    </svg>
  );
}
