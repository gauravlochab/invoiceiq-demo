"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface DataTablePaginationProps {
  pageIndex: number;
  pageCount: number;
  pageSize: number;
  totalRows: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  selectedCount?: number;
}

export function DataTablePagination({
  pageIndex,
  pageCount,
  pageSize,
  totalRows,
  onPageChange,
  onPageSizeChange,
  selectedCount,
}: DataTablePaginationProps) {
  const start = pageIndex * pageSize + 1;
  const end = Math.min((pageIndex + 1) * pageSize, totalRows);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)]">
      <div className="flex items-center gap-4">
        {selectedCount !== undefined && selectedCount > 0 && (
          <span className="text-xs font-medium text-[var(--acl-primary)]">
            {selectedCount} selected
          </span>
        )}
        <span className="text-xs text-[var(--text-tertiary)]">
          Showing {start} to {end} of {totalRows} results
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-[var(--text-tertiary)]">Rows per page</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="text-xs border border-[var(--border)] rounded-md px-2 py-1 bg-white text-[var(--text-primary)] cursor-pointer focus:outline-none focus:border-[var(--text-muted)]"
          >
            {[10, 25, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-xs text-[var(--text-tertiary)] mr-1">
            Page {pageIndex + 1} of {pageCount}
          </span>
          <button
            onClick={() => onPageChange(0)}
            disabled={pageIndex === 0}
            className="w-7 h-7 rounded-md flex items-center justify-center border border-[var(--border)] bg-white text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            aria-label="First page"
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onPageChange(pageIndex - 1)}
            disabled={pageIndex === 0}
            className="w-7 h-7 rounded-md flex items-center justify-center border border-[var(--border)] bg-white text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onPageChange(pageIndex + 1)}
            disabled={pageIndex >= pageCount - 1}
            className="w-7 h-7 rounded-md flex items-center justify-center border border-[var(--border)] bg-white text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            aria-label="Next page"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onPageChange(pageCount - 1)}
            disabled={pageIndex >= pageCount - 1}
            className="w-7 h-7 rounded-md flex items-center justify-center border border-[var(--border)] bg-white text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            aria-label="Last page"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
