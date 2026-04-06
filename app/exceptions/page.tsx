"use client";

import { useState } from "react";
import Link from "next/link";
import {
  exceptions,
  formatCurrency,
  severityConfig,
  statusConfig,
  typeConfig,
  type ExceptionType,
  type Severity,
  type Status,
} from "@/lib/data";

type FilterKey =
  | "all"
  | "open"
  | "critical"
  | "high"
  | "duplicate"
  | "match_exception";

const filterOptions: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All (10)" },
  { key: "open", label: "Open (7)" },
  { key: "critical", label: "Critical (3)" },
  { key: "high", label: "High (3)" },
  { key: "duplicate", label: "Duplicate" },
  { key: "match_exception", label: "Match Exception" },
];

function applyFilter(filter: FilterKey) {
  switch (filter) {
    case "open":
      return exceptions.filter(
        (e) =>
          e.status === "open" ||
          e.status === "under_review" ||
          e.status === "escalated"
      );
    case "critical":
      return exceptions.filter((e) => e.severity === "critical");
    case "high":
      return exceptions.filter((e) => e.severity === "high");
    case "duplicate":
      return exceptions.filter((e) => e.type === "duplicate");
    case "match_exception":
      return exceptions.filter((e) => e.type === "match_exception");
    default:
      return exceptions;
  }
}

function typeBadgeClass(type: ExceptionType): string {
  if (type === "suspicious_invoice" || type === "contract_overage")
    return "badge critical";
  if (type === "duplicate" || type === "tier_pricing") return "badge warning";
  return "badge neutral";
}

function statusBadgeClass(status: Status): string {
  if (status === "open") return "badge critical";
  if (status === "under_review") return "badge warning";
  if (status === "escalated") return "badge blue";
  if (status === "resolved") return "badge success";
  return "badge neutral";
}

function severityDotClass(severity: Severity): string {
  if (severity === "critical") return "status-dot critical";
  if (severity === "high") return "status-dot warning";
  if (severity === "medium") return "status-dot blue";
  return "status-dot neutral";
}

function flaggedColor(severity: Severity): string {
  if (severity === "critical" || severity === "high") return "#DC2626";
  if (severity === "medium") return "#B45309";
  return "#78716C";
}

export default function ExceptionsPage() {
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const filtered = applyFilter(activeFilter);

  return (
    <div style={{ background: "#FAFAF9", minHeight: "100vh" }}>
      {/* Page header */}
      <div style={{ padding: "32px 32px 0" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 20,
                fontWeight: 600,
                color: "#1C1917",
                margin: 0,
                lineHeight: 1.3,
              }}
            >
              Exceptions
            </h1>
            <p style={{ fontSize: 12, color: "#78716C", margin: "4px 0 0" }}>
              10 total · 7 open · Q1 2026
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              style={{
                border: "1px solid #D6D3D1",
                background: "#FFFFFF",
                fontSize: 12,
                fontWeight: 500,
                padding: "6px 12px",
                borderRadius: 6,
                cursor: "pointer",
                color: "#1C1917",
              }}
            >
              Assign
            </button>
            <button
              style={{
                border: "1px solid #D6D3D1",
                background: "#FFFFFF",
                fontSize: 12,
                fontWeight: 500,
                padding: "6px 12px",
                borderRadius: 6,
                cursor: "pointer",
                color: "#1C1917",
              }}
            >
              Export
            </button>
          </div>
        </div>
      </div>

      <hr className="divider" style={{ margin: "16px 0 0" }} />

      {/* Filter row */}
      <div
        style={{
          padding: "12px 32px",
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
        }}
      >
        {filterOptions.map((f) => {
          const isActive = activeFilter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              style={{
                fontSize: 12,
                color: isActive ? "#1C1917" : "#78716C",
                fontWeight: isActive ? 500 : 400,
                padding: "4px 10px",
                borderRadius: 6,
                background: isActive ? "#F5F5F4" : "transparent",
                border: isActive
                  ? "1px solid #E7E5E4"
                  : "1px solid transparent",
                cursor: "pointer",
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div style={{ padding: "0 32px 32px" }}>
        <div className="card" style={{ overflow: "hidden" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Exception</th>
                <th>Type</th>
                <th>Vendor</th>
                <th className="right">Flagged</th>
                <th>Severity</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((ex) => (
                <tr key={ex.id}>
                  {/* EXCEPTION */}
                  <td>
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontSize: 11,
                        color: "#A8A29E",
                        display: "block",
                        lineHeight: 1.4,
                      }}
                    >
                      {ex.id}
                    </span>
                    <span style={{ fontSize: 12, color: "#78716C" }}>
                      {ex.invoiceNumber}
                    </span>
                  </td>

                  {/* TYPE */}
                  <td>
                    <span className={typeBadgeClass(ex.type)}>
                      {typeConfig[ex.type].label}
                    </span>
                  </td>

                  {/* VENDOR */}
                  <td>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: "#1C1917",
                      }}
                    >
                      {ex.vendor}
                    </span>
                  </td>

                  {/* FLAGGED */}
                  <td className="right">
                    <span
                      style={{
                        fontVariantNumeric: "tabular-nums",
                        fontSize: 13,
                        fontWeight: 500,
                        color: flaggedColor(ex.severity),
                      }}
                    >
                      {formatCurrency(ex.flaggedAmount)}
                    </span>
                  </td>

                  {/* SEVERITY */}
                  <td>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <span
                        className={severityDotClass(ex.severity)}
                        style={{ background: severityConfig[ex.severity].color }}
                      />
                      <span style={{ fontSize: 12, color: "#1C1917" }}>
                        {severityConfig[ex.severity].label}
                      </span>
                    </span>
                  </td>

                  {/* STATUS */}
                  <td>
                    <span className={statusBadgeClass(ex.status)}>
                      {statusConfig[ex.status].label}
                    </span>
                  </td>

                  {/* ACTION */}
                  <td>
                    <Link
                      href={`/exceptions/${ex.id}`}
                      style={{
                        fontSize: 12,
                        color: "#A8A29E",
                        textDecoration: "none",
                        whiteSpace: "nowrap",
                        transition: "color 0.15s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color = "#1C1917")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = "#A8A29E")
                      }
                    >
                      Review →
                    </Link>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      textAlign: "center",
                      padding: "40px 16px",
                      color: "#A8A29E",
                      fontSize: 13,
                    }}
                  >
                    No exceptions match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
