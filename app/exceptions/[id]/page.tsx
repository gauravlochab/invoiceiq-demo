"use client";

import Link from "next/link";
import { sterisLineItems, formatCurrency } from "@/lib/data";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rowBg(status: (typeof sterisLineItems)[number]["status"]): string {
  if (status === "price_mismatch" || status === "both_mismatch")
    return "#FEF2F2";
  if (status === "qty_mismatch") return "#FEF3C7";
  return "transparent";
}

function rowStatusBadge(
  status: (typeof sterisLineItems)[number]["status"]
): { cls: string; label: string } {
  if (status === "match") return { cls: "badge success", label: "Match" };
  if (status === "price_mismatch")
    return { cls: "badge critical", label: "Price" };
  if (status === "qty_mismatch")
    return { cls: "badge warning", label: "Qty" };
  return { cls: "badge critical", label: "Price + Qty" };
}

// ─── FileIcon (inline SVG, no external dep) ───────────────────────────────────

function FileIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 16 16"
      fill="none"
      style={{ flexShrink: 0 }}
    >
      <path
        d="M4 2h5.5L12 4.5V14H4V2z"
        stroke="#A8A29E"
        strokeWidth="1.25"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M9.5 2v2.5H12"
        stroke="#A8A29E"
        strokeWidth="1.25"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ExceptionDetailPage() {
  // Totals for the Steris invoice
  const poTotal = sterisLineItems.reduce(
    (sum, item) => sum + item.poQty * item.poUnitPrice,
    0
  );
  const invTotal = sterisLineItems.reduce(
    (sum, item) => sum + item.invoiceQty * item.invoiceUnitPrice,
    0
  );
  const variance = invTotal - poTotal;
  const variancePct = ((variance / poTotal) * 100).toFixed(1);

  const documents = [
    {
      label: "invoice-STC-2026-19847.html",
      href: "/documents/invoice-STC-2026-19847.html",
    },
    {
      label: "po-NMC-2026-PO-2847.html",
      href: "/documents/po-NMC-2026-PO-2847.html",
    },
    {
      label: "packingslip-STC-PS-2026-0392.html",
      href: "/documents/packingslip-STC-PS-2026-0392.html",
    },
  ];

  return (
    <div style={{ background: "#FAFAF9", minHeight: "100vh" }}>
      {/* Breadcrumb */}
      <div style={{ padding: "24px 32px 0" }}>
        <Link
          href="/exceptions"
          style={{
            fontSize: 12,
            color: "#78716C",
            textDecoration: "none",
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#1C1917")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#78716C")}
        >
          ← Exceptions
        </Link>
      </div>

      {/* Header */}
      <div style={{ padding: "12px 32px 24px" }}>
        {/* Row 1 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 6,
          }}
        >
          <span
            style={{
              fontFamily: "monospace",
              fontSize: 11,
              color: "#A8A29E",
            }}
          >
            EX-006
          </span>
          <span className="badge warning">Match Exception</span>
          <span className="badge warning">Under Review</span>
        </div>

        {/* Row 2 */}
        <h1
          style={{
            fontSize: 22,
            fontWeight: 600,
            color: "#1C1917",
            letterSpacing: "-0.02em",
            margin: "0 0 6px",
            lineHeight: 1.25,
          }}
        >
          Steris Corporation
        </h1>

        {/* Row 3 */}
        <p style={{ fontSize: 12, color: "#78716C", margin: 0 }}>
          Invoice #STC-2026-19847 · February 28, 2026 · PO #NMC-PO-2026-2847
        </p>
      </div>

      {/* Alert bar */}
      <div style={{ margin: "0 32px 24px" }}>
        <div
          style={{
            borderLeft: "2px solid #DC2626",
            background: "#FEF2F2",
            padding: "12px 16px",
            borderRadius: 6,
          }}
        >
          <span style={{ fontSize: 12, color: "#991B1B" }}>
            4 discrepancies detected — $4,600 flagged this invoice · recurrence
            · AI confidence 98.7%
          </span>
        </div>
      </div>

      {/* Two-column layout */}
      <div
        style={{
          padding: "0 32px 32px",
          display: "grid",
          gridTemplateColumns: "1fr 280px",
          gap: 24,
          alignItems: "start",
        }}
      >
        {/* LEFT: Three-way match */}
        <div>
          <p className="section-label" style={{ marginBottom: 8 }}>
            Three-Way Match Analysis
          </p>

          <div className="card" style={{ overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Item Code</th>
                    <th>Description</th>
                    <th className="right">PO Qty</th>
                    <th className="right">PS Qty</th>
                    <th className="right">Inv Qty</th>
                    <th className="right">PO Price</th>
                    <th className="right">Inv Price</th>
                    <th className="right">Variance</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sterisLineItems.map((item) => {
                    const isPriceMismatch =
                      item.status === "price_mismatch" ||
                      item.status === "both_mismatch";
                    const isQtyMismatch =
                      item.status === "qty_mismatch" ||
                      item.status === "both_mismatch";
                    const badge = rowStatusBadge(item.status);

                    // Variance display
                    let varianceNode: React.ReactNode = (
                      <span style={{ color: "#A8A29E" }}>—</span>
                    );
                    if (isPriceMismatch) {
                      const delta = item.invoiceUnitPrice - item.poUnitPrice;
                      varianceNode = (
                        <span
                          style={{
                            color: "#DC2626",
                            fontWeight: 500,
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {delta > 0 ? "+" : ""}${delta.toFixed(2)}/unit
                        </span>
                      );
                    } else if (isQtyMismatch) {
                      const delta = item.packingSlipQty - item.invoiceQty;
                      varianceNode = (
                        <span
                          style={{
                            color: "#B45309",
                            fontWeight: 500,
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {delta > 0 ? "+" : ""}
                          {delta} units
                        </span>
                      );
                    }

                    return (
                      <tr
                        key={item.itemCode}
                        style={{ background: rowBg(item.status) }}
                      >
                        {/* Item code */}
                        <td>
                          <span
                            style={{
                              fontFamily: "monospace",
                              fontSize: 11,
                              color: "#A8A29E",
                            }}
                          >
                            {item.itemCode}
                          </span>
                        </td>

                        {/* Description */}
                        <td style={{ maxWidth: 200 }}>
                          <span
                            style={{ fontSize: 12, color: "#1C1917", display: "block" }}
                          >
                            {item.description}
                          </span>
                          {item.itemCode === "STE-4821-A" && (
                            <span
                              style={{
                                fontSize: 10,
                                color: "#A8A29E",
                                fontStyle: "italic",
                                display: "block",
                                marginTop: 2,
                              }}
                            >
                              Product name updated Q4 2025
                            </span>
                          )}
                        </td>

                        {/* PO Qty */}
                        <td
                          className="right"
                          style={{
                            fontSize: 12,
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {item.poQty}
                        </td>

                        {/* PS Qty */}
                        <td
                          className="right"
                          style={{
                            fontSize: 12,
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {item.packingSlipQty}
                        </td>

                        {/* Inv Qty */}
                        <td
                          className="right"
                          style={{
                            fontSize: 12,
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {item.invoiceQty}
                        </td>

                        {/* PO Price */}
                        <td
                          className="right"
                          style={{
                            fontSize: 12,
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          ${item.poUnitPrice.toFixed(2)}
                        </td>

                        {/* Inv Price */}
                        <td className="right">
                          <span
                            style={{
                              fontSize: 12,
                              fontVariantNumeric: "tabular-nums",
                              fontWeight: isPriceMismatch ? 500 : 400,
                              color: isPriceMismatch ? "#DC2626" : "#1C1917",
                            }}
                          >
                            ${item.invoiceUnitPrice.toFixed(2)}
                          </span>
                        </td>

                        {/* Variance */}
                        <td className="right">{varianceNode}</td>

                        {/* Status */}
                        <td>
                          <span className={badge.cls}>{badge.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Totals summary */}
            <div
              style={{
                borderTop: "1px solid #E7E5E4",
                padding: "16px 24px",
                display: "flex",
                gap: 40,
              }}
            >
              <div>
                <p className="section-label" style={{ marginBottom: 4 }}>
                  PO Total
                </p>
                <p
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: "#1C1917",
                    margin: 0,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {formatCurrency(poTotal)}
                </p>
              </div>

              <div>
                <p className="section-label" style={{ marginBottom: 4 }}>
                  Invoice Total
                </p>
                <p
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: "#DC2626",
                    margin: 0,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {formatCurrency(invTotal)}
                </p>
              </div>

              <div>
                <p className="section-label" style={{ marginBottom: 4 }}>
                  Variance
                </p>
                <p
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: "#DC2626",
                    margin: 0,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  +{formatCurrency(variance)}{" "}
                  <span style={{ fontSize: 13, fontWeight: 400 }}>
                    (+{variancePct}%)
                  </span>
                </p>
              </div>
            </div>

            {/* AI recommendation */}
            <div style={{ padding: "0 24px 20px" }}>
              <div
                style={{
                  background: "#FAFAF9",
                  border: "1px solid #E7E5E4",
                  borderRadius: 6,
                  padding: "12px 16px",
                }}
              >
                <p className="section-label" style={{ marginBottom: 6 }}>
                  AI Recommendation
                </p>
                <p style={{ fontSize: 12, color: "#78716C", margin: 0, lineHeight: 1.6 }}>
                  Hold invoice. Request revised invoice from Steris at contracted
                  rate of $2.10/unit (PO #NMC-PO-2026-2847). Price variance of
                  $0.40/unit has recurred 23× this quarter = $4,600 total
                  overcharge.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Info panel */}
        <div className="card" style={{ padding: "20px" }}>
          {/* Exception details */}
          <p className="section-label" style={{ marginBottom: 0 }}>
            Exception Details
          </p>

          {[
            { label: "Assigned to", value: "Sarah Chen" },
            { label: "Detected", value: "Mar 1, 2026" },
            { label: "Recurrences", value: "23 invoices this quarter" },
            { label: "Cumulative impact", value: "$4,600" },
          ].map((row, i, arr) => (
            <div
              key={row.label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                padding: "10px 0",
                borderBottom:
                  i < arr.length - 1 ? "1px solid #F5F5F4" : "none",
              }}
            >
              <span style={{ fontSize: 12, color: "#78716C" }}>{row.label}</span>
              <span style={{ fontSize: 12, color: "#1C1917", fontWeight: 500 }}>
                {row.value}
              </span>
            </div>
          ))}

          {/* Documents */}
          <p className="section-label" style={{ marginTop: 20, marginBottom: 8 }}>
            Documents
          </p>

          {documents.map((doc) => (
            <div
              key={doc.label}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
                padding: "8px 0",
                borderBottom: "1px solid #F5F5F4",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}
              >
                <FileIcon />
                <span
                  style={{
                    fontSize: 11,
                    color: "#78716C",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {doc.label}
                </span>
              </div>
              <a
                href={doc.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: 11,
                  color: "#A8A29E",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#1C1917")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#A8A29E")}
              >
                Open →
              </a>
            </div>
          ))}

          {/* Actions */}
          <p className="section-label" style={{ marginTop: 20, marginBottom: 10 }}>
            Actions
          </p>

          <button
            style={{
              display: "block",
              width: "100%",
              background: "#DC2626",
              color: "#FFFFFF",
              fontSize: 12,
              fontWeight: 500,
              padding: "8px 12px",
              borderRadius: 6,
              border: "none",
              cursor: "pointer",
              marginBottom: 8,
              textAlign: "center",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "#B91C1C")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "#DC2626")
            }
          >
            Hold Invoice
          </button>

          <button
            style={{
              display: "block",
              width: "100%",
              background: "#FFFFFF",
              color: "#B45309",
              fontSize: 12,
              fontWeight: 500,
              padding: "8px 12px",
              borderRadius: 6,
              border: "1px solid #B45309",
              cursor: "pointer",
              marginBottom: 8,
              textAlign: "center",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "#FEF3C7")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "#FFFFFF")
            }
          >
            Request Correction
          </button>

          <button
            style={{
              display: "block",
              width: "100%",
              background: "#FFFFFF",
              color: "#78716C",
              fontSize: 12,
              fontWeight: 500,
              padding: "8px 12px",
              borderRadius: 6,
              border: "1px solid #D6D3D1",
              cursor: "pointer",
              marginBottom: 8,
              textAlign: "center",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "#F5F5F4")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "#FFFFFF")
            }
          >
            Approve with Override
          </button>

          <button
            style={{
              display: "block",
              width: "100%",
              background: "#FFFFFF",
              color: "#78716C",
              fontSize: 12,
              fontWeight: 500,
              padding: "8px 12px",
              borderRadius: 6,
              border: "1px solid #D6D3D1",
              cursor: "pointer",
              marginBottom: 0,
              textAlign: "center",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "#F5F5F4")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "#FFFFFF")
            }
          >
            Escalate to Manager
          </button>
        </div>
      </div>
    </div>
  );
}
