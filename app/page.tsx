"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  XAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
  exceptions,
  flaggedByType,
  spendTrend,
  formatCurrency,
  severityConfig,
  statusConfig,
  typeConfig,
} from "@/lib/data";

// ─── Derived data ─────────────────────────────────────────────────────────────

const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

const topExceptions = [...exceptions]
  .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
  .slice(0, 6);

const totalFlagged = flaggedByType.reduce((s, d) => s + d.value, 0);

// ─── Tooltip ─────────────────────────────────────────────────────────────────

function SpendTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { dataKey: string; value: number; name: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #E7E5E4",
        borderRadius: 6,
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        padding: "10px 12px",
        fontSize: 12,
        color: "#1C1917",
      }}
    >
      <p style={{ color: "#A8A29E", marginBottom: 6, fontSize: 11 }}>{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ marginBottom: 2 }}>
          <span style={{ color: p.dataKey === "spend" ? "#D6D3D1" : "#DC2626" }}>
            {p.dataKey === "spend" ? "Total spend" : "Flagged"}
          </span>
          {"  "}
          <span style={{ fontWeight: 500 }}>{formatCurrency(p.value)}</span>
        </p>
      ))}
    </div>
  );
}

// ─── Status badge style resolution ───────────────────────────────────────────

function statusBadgeClass(status: string): string {
  if (status === "open") return "badge critical";
  if (status === "under_review") return "badge warning";
  if (status === "escalated") return "badge blue";
  return "badge success";
}

function flaggedColor(severity: string): string {
  if (severity === "critical" || severity === "high") return "#DC2626";
  if (severity === "medium") return "#B45309";
  return "#78716C";
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  return (
    <div style={{ background: "var(--bg-base)", minHeight: "100vh" }}>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="px-8 pt-8 pb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1
              style={{
                fontSize: 20,
                fontWeight: 600,
                color: "#1C1917",
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
              }}
            >
              Invoice Intelligence
            </h1>
            <p style={{ fontSize: 12, color: "#78716C", marginTop: 4 }}>
              Northfield Medical Center · Q1 2026 · 1,847 invoices processed
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              style={{
                border: "1px solid #D6D3D1",
                background: "#fff",
                color: "#1C1917",
                fontSize: 12,
                fontWeight: 500,
                padding: "6px 12px",
                borderRadius: 6,
                cursor: "pointer",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#F5F5F4")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
            >
              Export
            </button>
            <button
              style={{
                background: "#1C1917",
                color: "#fff",
                fontSize: 12,
                fontWeight: 500,
                padding: "6px 12px",
                borderRadius: 6,
                cursor: "pointer",
                border: "none",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#292524")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#1C1917")}
            >
              Run Scan
            </button>
          </div>
        </div>
      </div>

      <hr style={{ borderColor: "#E7E5E4", borderTop: "1px solid #E7E5E4", margin: 0 }} />

      {/* ── Metrics Strip ─────────────────────────────────────────────────── */}
      <div className="px-8 py-6">
        <div
          style={{
            display: "flex",
            border: "1px solid #E7E5E4",
            borderRadius: 8,
            background: "#fff",
          }}
        >
          {/* 1 — Invoices Processed */}
          <div
            style={{
              flex: 1,
              padding: "20px 24px",
              borderRight: "1px solid #E7E5E4",
            }}
          >
            <p className="section-label">Invoices Processed</p>
            <p
              style={{
                fontSize: 26,
                fontWeight: 700,
                color: "#1C1917",
                letterSpacing: "-0.03em",
                marginTop: 4,
                lineHeight: 1,
              }}
            >
              1,847
            </p>
            <p style={{ fontSize: 11, color: "#A8A29E", marginTop: 6 }}>Q1 2026</p>
          </div>

          {/* 2 — Exceptions Found */}
          <div
            style={{
              flex: 1,
              padding: "20px 24px",
              borderRight: "1px solid #E7E5E4",
            }}
          >
            <p className="section-label">Exceptions Found</p>
            <p
              style={{
                fontSize: 26,
                fontWeight: 700,
                color: "#1C1917",
                letterSpacing: "-0.03em",
                marginTop: 4,
                lineHeight: 1,
              }}
            >
              10
            </p>
            <p style={{ fontSize: 11, color: "#A8A29E", marginTop: 6 }}>7 open</p>
          </div>

          {/* 3 — Amount at Risk */}
          <div
            style={{
              flex: 1,
              padding: "20px 24px",
              borderRight: "1px solid #E7E5E4",
            }}
          >
            <p className="section-label">Amount at Risk</p>
            <p
              style={{
                fontSize: 26,
                fontWeight: 700,
                color: "#DC2626",
                letterSpacing: "-0.03em",
                marginTop: 4,
                lineHeight: 1,
              }}
            >
              $392,720
            </p>
            <p style={{ fontSize: 11, color: "#A8A29E", marginTop: 6 }}>22% of period spend</p>
          </div>

          {/* 4 — Recovered */}
          <div
            style={{
              flex: 1,
              padding: "20px 24px",
              borderRight: "1px solid #E7E5E4",
            }}
          >
            <p className="section-label">Recovered</p>
            <p
              style={{
                fontSize: 26,
                fontWeight: 700,
                color: "#15803D",
                letterSpacing: "-0.03em",
                marginTop: 4,
                lineHeight: 1,
              }}
            >
              $56,670
            </p>
            <p style={{ fontSize: 11, color: "#A8A29E", marginTop: 6 }}>2 resolved</p>
          </div>

          {/* 5 — Contracts at Risk */}
          <div
            style={{
              flex: 1,
              padding: "20px 24px",
            }}
          >
            <p className="section-label">Contracts at Risk</p>
            <p
              style={{
                fontSize: 26,
                fontWeight: 700,
                color: "#B45309",
                letterSpacing: "-0.03em",
                marginTop: 4,
                lineHeight: 1,
              }}
            >
              2
            </p>
            <p style={{ fontSize: 11, color: "#A8A29E", marginTop: 6 }}>1 breached</p>
          </div>
        </div>
      </div>

      {/* ── Two-column layout ──────────────────────────────────────────────── */}
      <div
        className="px-8 pb-6"
        style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 24 }}
      >

        {/* LEFT — Spend & Exception Trend */}
        <div className="card" style={{ padding: "20px 20px 16px" }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: "#1C1917" }}>
              Spend &amp; Exception Trend
            </p>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5" style={{ fontSize: 11, color: "#78716C" }}>
                <span
                  style={{
                    display: "inline-block",
                    width: 24,
                    height: 2,
                    background: "#D6D3D1",
                    borderRadius: 1,
                  }}
                />
                Total spend
              </span>
              <span className="flex items-center gap-1.5" style={{ fontSize: 11, color: "#78716C" }}>
                <span
                  style={{
                    display: "inline-block",
                    width: 10,
                    height: 10,
                    background: "#DC2626",
                    borderRadius: 2,
                    opacity: 0.7,
                  }}
                />
                Flagged
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={spendTrend} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="0"
                horizontal={true}
                vertical={false}
                stroke="#F5F5F4"
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "#A8A29E" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<SpendTooltip />} cursor={{ stroke: "#E7E5E4", strokeWidth: 1 }} />
              <Area
                type="monotone"
                dataKey="spend"
                stroke="#D6D3D1"
                strokeWidth={1.5}
                fill="#F5F5F4"
                dot={false}
              />
              <Bar
                dataKey="exceptions"
                fill="#DC2626"
                opacity={0.7}
                barSize={16}
                radius={[2, 2, 0, 0]}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* RIGHT — Exception Breakdown */}
        <div className="card" style={{ padding: "20px 20px 16px", display: "flex", flexDirection: "column" }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: "#1C1917", marginBottom: 4 }}>
            By Category
          </p>

          {/* Donut */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={flaggedByType}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {flaggedByType.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => [formatCurrency(Number(v)), "Flagged"]}
                  contentStyle={{
                    border: "1px solid #E7E5E4",
                    borderRadius: 6,
                    fontSize: 12,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                    color: "#1C1917",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                textAlign: "center",
                pointerEvents: "none",
              }}
            >
              <p
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#1C1917",
                  lineHeight: 1,
                  letterSpacing: "-0.02em",
                }}
              >
                $392K
              </p>
              <p style={{ fontSize: 10, color: "#A8A29E", marginTop: 3 }}>at risk</p>
            </div>
          </div>

          {/* Legend list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
            {flaggedByType.map((item) => (
              <div key={item.name} style={{ display: "flex", alignItems: "center" }}>
                <span
                  className="status-dot"
                  style={{ background: item.color, marginRight: 8, flexShrink: 0 }}
                />
                <span style={{ fontSize: 12, color: "#78716C", flex: 1, minWidth: 0 }}>
                  {item.name}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: "#1C1917",
                    fontVariantNumeric: "tabular-nums",
                    marginLeft: "auto",
                    flexShrink: 0,
                  }}
                >
                  {formatCurrency(item.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Exceptions Table ───────────────────────────────────────────────── */}
      <div className="px-8 pb-8">
        <div className="card" style={{ overflow: "hidden" }}>
          {/* Table header */}
          <div
            style={{
              padding: "14px 16px",
              borderBottom: "1px solid #E7E5E4",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <p style={{ fontSize: 13, fontWeight: 500, color: "#1C1917" }}>Recent Exceptions</p>
            <Link
              href="/exceptions"
              style={{
                fontSize: 12,
                color: "#78716C",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#1C1917")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#78716C")}
            >
              View all 10 <ArrowUpRight size={12} />
            </Link>
          </div>

          {/* Table */}
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Type</th>
                  <th>Vendor</th>
                  <th className="right">Flagged</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {topExceptions.map((ex) => {
                  const sev = severityConfig[ex.severity];
                  const sta = statusConfig[ex.status];
                  const typ = typeConfig[ex.type];
                  const isCriticalType =
                    ex.type === "contract_overage" || ex.type === "suspicious_invoice";

                  return (
                    <tr key={ex.id}>
                      {/* ID */}
                      <td className="mono">{ex.id}</td>

                      {/* Type badge */}
                      <td>
                        <span className={isCriticalType ? "badge critical" : "badge neutral"}>
                          {typ.label}
                        </span>
                      </td>

                      {/* Vendor */}
                      <td>
                        <p style={{ fontWeight: 500, color: "#1C1917", fontSize: 13 }}>
                          {ex.vendor}
                        </p>
                        <p style={{ fontSize: 11, color: "#A8A29E", marginTop: 1 }}>
                          {ex.invoiceNumber}
                        </p>
                      </td>

                      {/* Flagged amount */}
                      <td className="amount right">
                        <span
                          style={{
                            color: flaggedColor(ex.severity),
                            fontWeight: 500,
                          }}
                        >
                          {formatCurrency(ex.flaggedAmount)}
                        </span>
                      </td>

                      {/* Severity */}
                      <td>
                        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span
                            className="status-dot"
                            style={{ background: sev.color }}
                          />
                          <span style={{ fontSize: 12, color: sev.color }}>{sev.label}</span>
                        </span>
                      </td>

                      {/* Status badge */}
                      <td>
                        <span className={statusBadgeClass(ex.status)}>{sta.label}</span>
                      </td>

                      {/* Review link */}
                      <td>
                        <Link
                          href="/exceptions"
                          style={{
                            fontSize: 12,
                            color: "#A8A29E",
                            textDecoration: "none",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = "#1C1917";
                            e.currentTarget.style.textDecoration = "underline";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = "#A8A29E";
                            e.currentTarget.style.textDecoration = "none";
                          }}
                        >
                          Review
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
