"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
  type NodeMouseHandler,
  type EdgeMouseHandler,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { getLayoutedElements, type SpecNodeData } from "../graph-data";
import { nodeTypes } from "../graph-components";

const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements();

const baseEdges: Edge[] = layoutedEdges.map((edge) => ({
  ...edge,
  type: "smoothstep" as const,
}));

// React Flow renders edges/labels/controls as inline SVG + DOM styles, so it
// needs concrete color strings rather than Tailwind classes. Resolve the
// shadcn theme tokens from the live CSS custom properties so the graph tracks
// light/dark mode instead of hard-coding hex values.
interface GraphTheme {
  edge: string;
  edgeActive: string;
  labelText: string;
  labelBg: string;
  surface: string;
  border: string;
  canvas: string;
  grid: string;
}

function readTheme(): GraphTheme {
  if (typeof window === "undefined") {
    return {
      edge: "transparent",
      edgeActive: "transparent",
      labelText: "transparent",
      labelBg: "transparent",
      surface: "transparent",
      border: "transparent",
      canvas: "transparent",
      grid: "transparent",
    };
  }
  const cs = getComputedStyle(document.documentElement);
  const v = (token: string) => cs.getPropertyValue(token).trim();
  return {
    edge: v("--border"),
    edgeActive: v("--primary"),
    labelText: v("--foreground"),
    labelBg: v("--popover"),
    surface: v("--card"),
    border: v("--border"),
    canvas: v("--muted"),
    grid: v("--border"),
  };
}

export default function GraphView() {
  const router = useRouter();
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);
  const [theme, setTheme] = useState<GraphTheme>(() => readTheme());

  // Subscribe to theme changes: re-resolve the shadcn tokens whenever the
  // `.dark` class toggles on <html>. A deferred initial read also covers the
  // hand-off from the SSR placeholder to the live computed values.
  useEffect(() => {
    const sync = () => setTheme(readTheme());
    const initial = requestAnimationFrame(sync);
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => {
      cancelAnimationFrame(initial);
      observer.disconnect();
    };
  }, []);

  const onNodeClick: NodeMouseHandler = useCallback(
    (_event, node: Node) => {
      const data = node.data as unknown as SpecNodeData;
      if (data?.slug) {
        router.push(`/specs-viewer/${data.slug}`);
      }
    },
    [router]
  );

  const onEdgeMouseEnter: EdgeMouseHandler = useCallback((_event, edge: Edge) => {
    setHoveredEdge(edge.id);
  }, []);

  const onEdgeMouseLeave: EdgeMouseHandler = useCallback(() => {
    setHoveredEdge(null);
  }, []);

  const styledEdges = baseEdges.map((edge) => {
    const isHovered = edge.id === hoveredEdge;
    const edgeLabel = (edge.data as Record<string, unknown>)?.label as string | undefined;
    const strokeColor = isHovered ? theme.edgeActive : theme.edge;
    return {
      ...edge,
      label: isHovered ? edgeLabel : undefined,
      style: {
        stroke: strokeColor,
        strokeWidth: isHovered ? 2.5 : 1.5,
        transition: "stroke 0.15s, stroke-width 0.15s",
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 12,
        height: 12,
        color: strokeColor,
      },
      labelStyle: { fill: theme.labelText, fontSize: 10, fontWeight: 600 },
      labelBgStyle: {
        fill: theme.labelBg,
        stroke: theme.border,
        strokeWidth: 1,
        fillOpacity: 0.95,
      },
      labelBgPadding: [8, 4] as [number, number],
      labelBgBorderRadius: 6,
      animated: isHovered,
    };
  });

  return (
    <div
      className="w-full h-[calc(100vh-140px)] rounded-xl border border-border overflow-hidden bg-muted"
    >
      <ReactFlow
        nodes={layoutedNodes}
        edges={styledEdges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        onEdgeMouseEnter={onEdgeMouseEnter}
        onEdgeMouseLeave={onEdgeMouseLeave}
        fitView
        fitViewOptions={{ padding: 0.35 }}
        proOptions={{ hideAttribution: true }}
        minZoom={0.3}
        maxZoom={2}
        defaultEdgeOptions={{ type: "smoothstep" }}
      >
        <Background gap={24} size={1} color={theme.grid} />
        <Controls
          showInteractive={false}
          style={{
            background: theme.surface,
            border: `1px solid ${theme.border}`,
            borderRadius: 8,
          }}
        />
      </ReactFlow>
    </div>
  );
}
