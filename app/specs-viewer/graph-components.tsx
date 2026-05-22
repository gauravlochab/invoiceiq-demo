"use client";

import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import { FileText, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { SpecNodeData } from "./graph-data";

export const DomainNode = memo(function DomainNode({ data }: NodeProps) {
  const d = data as unknown as SpecNodeData;
  return (
    <div className="rounded-xl border border-border bg-card shadow-md px-4 py-3 min-w-[180px] max-w-[210px] cursor-pointer transition-all duration-150 hover:shadow-lg hover:border-primary">
      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-muted-foreground !border-card" />
      <Handle type="target" position={Position.Top} id="top" className="!w-2 !h-2 !bg-muted-foreground !border-card" />
      <div className="flex items-center gap-2 mb-1.5">
        <FileText size={14} className="text-primary flex-shrink-0" />
        <span className="text-[13px] font-semibold text-foreground truncate">
          {d.title}
        </span>
      </div>
      <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2">
        {d.description}
      </p>
      <div className="mt-2">
        <Badge variant="outline" className="text-[9px]">domain</Badge>
      </div>
      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-muted-foreground !border-card" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!w-2 !h-2 !bg-muted-foreground !border-card" />
    </div>
  );
});

export const RuleNode = memo(function RuleNode({ data }: NodeProps) {
  const d = data as unknown as SpecNodeData;
  return (
    <div className="rounded-lg border border-border bg-muted px-3 py-2 min-w-[140px] max-w-[170px] cursor-pointer transition-all duration-150 hover:shadow-md hover:border-warning">
      <Handle type="target" position={Position.Left} className="!w-1.5 !h-1.5 !bg-muted-foreground !border-muted" />
      <div className="flex items-center gap-1.5">
        <Shield size={12} className="text-warning-text flex-shrink-0" />
        <span className="text-[11px] font-semibold text-foreground truncate">
          {d.title}
        </span>
      </div>
      <p className="text-[9px] text-muted-foreground mt-1 leading-relaxed line-clamp-1">
        {d.description}
      </p>
      <Handle type="source" position={Position.Right} className="!w-1.5 !h-1.5 !bg-muted-foreground !border-muted" />
    </div>
  );
});

export const nodeTypes = {
  domainNode: DomainNode,
  ruleNode: RuleNode,
};
