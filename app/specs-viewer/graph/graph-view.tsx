"use client";

import { useCallback, useState } from "react";
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

export default function GraphView() {
  const router = useRouter();
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);

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
    return {
      ...edge,
      label: isHovered ? edgeLabel : undefined,
      style: {
        stroke: isHovered ? "#0065cb" : "#d1d5db",
        strokeWidth: isHovered ? 2.5 : 1.5,
        transition: "stroke 0.15s, stroke-width 0.15s",
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 12,
        height: 12,
        color: isHovered ? "#0065cb" : "#d1d5db",
      },
      labelStyle: { fill: "#111827", fontSize: 10, fontWeight: 600 },
      labelBgStyle: { fill: "#ffffff", stroke: "#d1d5db", strokeWidth: 1, fillOpacity: 0.95 },
      labelBgPadding: [8, 4] as [number, number],
      labelBgBorderRadius: 6,
      animated: isHovered,
    };
  });

  return (
    <div className="w-full h-[calc(100vh-140px)] rounded-xl border border-[var(--border)] overflow-hidden" style={{ background: "#f0f2f5" }}>
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
        <Background gap={24} size={1} color="#e5e7eb" />
        <Controls
          showInteractive={false}
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          }}
        />
      </ReactFlow>
    </div>
  );
}
