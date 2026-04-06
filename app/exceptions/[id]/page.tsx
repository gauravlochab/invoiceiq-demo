"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { sterisLineItems, formatCurrency } from "@/lib/data";

// ─── Shared helpers ───────────────────────────────────────────────────────────

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

function ActionButton({
  children,
  variant,
  style: extraStyle,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant: "primary-red" | "outline-red" | "outline-gray" | "ghost";
}) {
  const base: React.CSSProperties = {
    display: "block",
    width: "100%",
    fontSize: 12,
    fontWeight: 500,
    padding: "8px 12px",
    borderRadius: 6,
    cursor: "pointer",
    textAlign: "center",
    marginBottom: 8,
    transition: "background 0.15s, color 0.15s",
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    "primary-red": { background: "#DC2626", color: "#FFFFFF", border: "none" },
    "outline-red": { background: "#FFFFFF", color: "#DC2626", border: "1px solid #DC2626" },
    "outline-gray": { background: "#FFFFFF", color: "#78716C", border: "1px solid #D6D3D1" },
    ghost: { background: "transparent", color: "#A8A29E", border: "none" },
  };

  return (
    <button
      style={{ ...base, ...variantStyles[variant], ...extraStyle }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        if (variant === "primary-red") el.style.background = "#B91C1C";
        if (variant === "outline-red") el.style.background = "#FEF2F2";
        if (variant === "outline-gray") el.style.background = "#F5F5F4";
        if (variant === "ghost") el.style.color = "#78716C";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        if (variant === "primary-red") el.style.background = "#DC2626";
        if (variant === "outline-red") el.style.background = "#FFFFFF";
        if (variant === "outline-gray") el.style.background = "#FFFFFF";
        if (variant === "ghost") el.style.color = "#A8A29E";
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

// ─── EX-003: MedTech Solutions — Suspicious Invoice ──────────────────────────

function Ex003Page() {
  const poCandidates = [
    { po: "NMC-PO-2026-0891", vendor: "Medline Industries", product: "IV Catheter Kits 18G", amount: "$44,800", pct: "34%", pctColor: "#B45309" },
    { po: "NMC-PO-2026-0744", vendor: "Cardinal Health", product: "Peripheral IV Kit", amount: "$38,500", pct: "28%", pctColor: "#A8A29E" },
    { po: "NMC-PO-2026-1102", vendor: "Henry Schein", product: "IV Access Kit", amount: "$41,200", pct: "21%", pctColor: "#A8A29E" },
  ];

  const steps = [
    {
      ok: true,
      title: "Vendor name lookup",
      sub: "Searched: 'MedTech Solutions LLC' · No exact match in vendor master (847 vendors)",
    },
    {
      ok: true,
      title: "Fuzzy vendor matching",
      sub: "Closest: 'MedTech Corp Inc.' (62% similarity) · Different EIN, different address",
    },
    {
      ok: true,
      title: "Open PO search by product",
      sub: "Searched: IV Catheter Kits (HCPCS A4221) · 3 open POs found for this product",
    },
    {
      ok: false,
      title: "PO cross-match",
      sub: "None of the 3 POs match this vendor · Highest confidence: 34% (insufficient)",
    },
  ];

  const detailRows = [
    { label: "Detected", value: "Feb 14, 2026" },
    { label: "Assigned to", value: "Compliance Team" },
    { label: "Invoice amount", value: "$45,200" },
    { label: "PO match", value: "None found" },
    { label: "Vendor in master", value: "No" },
  ];

  return (
    <div style={{ background: "#FAFAF9", minHeight: "100vh" }}>
      {/* Breadcrumb */}
      <div style={{ padding: "24px 32px 0" }}>
        <Link
          href="/exceptions"
          style={{ fontSize: 12, color: "#78716C", textDecoration: "none" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#1C1917")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#78716C")}
        >
          ← Exceptions
        </Link>
      </div>

      {/* Header */}
      <div style={{ padding: "12px 32px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span style={{ fontFamily: "monospace", fontSize: 11, color: "#A8A29E" }}>EX-003</span>
          <span className="badge critical">Suspicious Invoice</span>
          <span className="badge blue">Escalated</span>
        </div>
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
          MedTech Solutions LLC
        </h1>
        <p style={{ fontSize: 12, color: "#78716C", margin: 0 }}>
          Invoice #MTS-INV-00291 · February 14, 2026 · $45,200.00
        </p>
      </div>

      {/* Alert bar */}
      <div style={{ margin: "0 32px 24px" }}>
        <div
          style={{
            borderLeft: "2px solid #DC2626",
            background: "#FEF2F2",
            padding: "12px 16px",
            borderRadius: 8,
          }}
        >
          <span style={{ fontSize: 12, color: "#991B1B" }}>
            Vendor not in approved master · No PO found · Mixed product and services billing · Routed to Compliance
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
        {/* LEFT */}
        <div>
          <p className="section-label" style={{ marginBottom: 8 }}>
            PO Match Search
          </p>

          <div className="card" style={{ overflow: "hidden" }}>
            {/* Card header */}
            <div
              style={{
                padding: "16px 20px 12px",
                borderBottom: "1px solid #E7E5E4",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <span style={{ fontSize: 12, color: "#78716C" }}>
                Searching vendor master and open POs for invoice #MTS-INV-00291
              </span>
              <span className="badge critical" style={{ flexShrink: 0 }}>
                No Match Found
              </span>
            </div>

            {/* Search steps */}
            <div style={{ padding: "16px 20px" }}>
              {steps.map((step, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    padding: "8px 0",
                  }}
                >
                  {/* Step indicator */}
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      background: step.ok ? "#F5F5F4" : "#FEF2F2",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: step.ok ? "#15803D" : "#DC2626",
                        lineHeight: 1,
                      }}
                    >
                      {step.ok ? "✓" : "✗"}
                    </span>
                  </div>

                  {/* Step text */}
                  <div>
                    <p style={{ fontSize: 12, color: "#1C1917", margin: 0, fontWeight: 500 }}>
                      {step.title}
                    </p>
                    <p style={{ fontSize: 11, color: "#A8A29E", margin: "2px 0 0" }}>
                      {step.sub}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* PO Candidates */}
            <div style={{ borderTop: "1px solid #E7E5E4", padding: "16px 20px" }}>
              <p className="section-label" style={{ marginBottom: 10 }}>
                Closest PO Candidates (Insufficient Confidence)
              </p>

              <div style={{ overflowX: "auto" }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>PO Number</th>
                      <th>Vendor on PO</th>
                      <th>Product</th>
                      <th className="right">Amount</th>
                      <th className="right">Match %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {poCandidates.map((row) => (
                      <tr key={row.po}>
                        <td>
                          <span style={{ fontFamily: "monospace", fontSize: 11, color: "#A8A29E" }}>
                            {row.po}
                          </span>
                        </td>
                        <td style={{ fontSize: 12, color: "#1C1917" }}>{row.vendor}</td>
                        <td style={{ fontSize: 12, color: "#78716C" }}>{row.product}</td>
                        <td
                          className="right"
                          style={{ fontSize: 12, fontVariantNumeric: "tabular-nums", color: "#1C1917" }}
                        >
                          {row.amount}
                        </td>
                        <td className="right">
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 500,
                              color: row.pctColor,
                              fontVariantNumeric: "tabular-nums",
                            }}
                          >
                            {row.pct}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Vendor not in master note */}
              <div
                style={{
                  background: "#FEF2F2",
                  border: "1px solid #FECACA",
                  borderRadius: 8,
                  padding: "12px 16px",
                  marginTop: 16,
                }}
              >
                <p
                  className="section-label"
                  style={{ color: "#DC2626", marginBottom: 6 }}
                >
                  Vendor Not in Approved Master
                </p>
                <p style={{ fontSize: 12, color: "#991B1B", margin: 0, lineHeight: 1.6 }}>
                  MedTech Solutions LLC (EIN: 84-2917441) does not appear in Northfield Medical&apos;s
                  approved vendor registry. The invoice references IV Catheter Kits but this
                  vendor&apos;s registered business category is &apos;Management Consulting&apos;. Bank account
                  provided (routing 071923828) does not match any known vendor on record.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT panel */}
        <div className="card" style={{ padding: "20px" }}>
          {/* Exception details */}
          <p className="section-label" style={{ marginBottom: 0 }}>
            Exception Details
          </p>

          {detailRows.map((row, i) => (
            <div
              key={row.label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                padding: "10px 0",
                borderBottom: i < detailRows.length - 1 ? "1px solid #F5F5F4" : "none",
              }}
            >
              <span style={{ fontSize: 12, color: "#78716C" }}>{row.label}</span>
              <span style={{ fontSize: 12, color: "#1C1917", fontWeight: 500 }}>{row.value}</span>
            </div>
          ))}

          {/* Risk level row — special badge */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px 0",
              borderTop: "1px solid #F5F5F4",
            }}
          >
            <span style={{ fontSize: 12, color: "#78716C" }}>Risk level</span>
            <span className="badge critical">High</span>
          </div>

          {/* Documents */}
          <p className="section-label" style={{ marginTop: 16, marginBottom: 8 }}>
            Documents
          </p>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
              padding: "8px 0",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
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
                invoice-MTS-INV-00291.html
              </span>
            </div>
            <a
              href="/documents/invoice-MTS-INV-00291.html"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 11,
                color: "#A8A29E",
                textDecoration: "none",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#1C1917")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#A8A29E")}
            >
              Open →
            </a>
          </div>

          {/* Actions */}
          <p className="section-label" style={{ marginTop: 20, marginBottom: 10 }}>
            Actions
          </p>

          <ActionButton variant="primary-red">Block Payment</ActionButton>
          <ActionButton variant="outline-red">Report to Compliance</ActionButton>
          <ActionButton variant="outline-gray">Request Vendor Verification</ActionButton>
          <ActionButton variant="ghost" style={{ marginBottom: 0 }}>
            Dismiss (False Positive)
          </ActionButton>
        </div>
      </div>
    </div>
  );
}

// ─── EX-006: Steris Corporation — Match Exception ────────────────────────────

function rowBg(status: (typeof sterisLineItems)[number]["status"]): string {
  if (status === "price_mismatch" || status === "both_mismatch") return "#FEF2F2";
  if (status === "qty_mismatch") return "#FEF3C7";
  return "transparent";
}

function rowStatusBadge(
  status: (typeof sterisLineItems)[number]["status"]
): { cls: string; label: string } {
  if (status === "match") return { cls: "badge success", label: "Match" };
  if (status === "price_mismatch") return { cls: "badge critical", label: "Price" };
  if (status === "qty_mismatch") return { cls: "badge warning", label: "Qty" };
  return { cls: "badge critical", label: "Price + Qty" };
}

function Ex006Page() {
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
    { label: "invoice-STC-2026-19847.html", href: "/documents/invoice-STC-2026-19847.html" },
    { label: "po-NMC-2026-PO-2847.html", href: "/documents/po-NMC-2026-PO-2847.html" },
    { label: "packingslip-STC-PS-2026-0392.html", href: "/documents/packingslip-STC-PS-2026-0392.html" },
  ];

  return (
    <div style={{ background: "#FAFAF9", minHeight: "100vh" }}>
      {/* Breadcrumb */}
      <div style={{ padding: "24px 32px 0" }}>
        <Link
          href="/exceptions"
          style={{ fontSize: 12, color: "#78716C", textDecoration: "none" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#1C1917")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#78716C")}
        >
          ← Exceptions
        </Link>
      </div>

      {/* Header */}
      <div style={{ padding: "12px 32px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span style={{ fontFamily: "monospace", fontSize: 11, color: "#A8A29E" }}>EX-006</span>
          <span className="badge warning">Match Exception</span>
          <span className="badge warning">Under Review</span>
        </div>
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
            4 discrepancies detected — $4,600 flagged this invoice · recurrence · AI confidence 98.7%
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
                      item.status === "price_mismatch" || item.status === "both_mismatch";
                    const isQtyMismatch =
                      item.status === "qty_mismatch" || item.status === "both_mismatch";
                    const badge = rowStatusBadge(item.status);

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
                      <tr key={item.itemCode} style={{ background: rowBg(item.status) }}>
                        <td>
                          <span style={{ fontFamily: "monospace", fontSize: 11, color: "#A8A29E" }}>
                            {item.itemCode}
                          </span>
                        </td>
                        <td style={{ maxWidth: 200 }}>
                          <span style={{ fontSize: 12, color: "#1C1917", display: "block" }}>
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
                        <td className="right" style={{ fontSize: 12, fontVariantNumeric: "tabular-nums" }}>
                          {item.poQty}
                        </td>
                        <td className="right" style={{ fontSize: 12, fontVariantNumeric: "tabular-nums" }}>
                          {item.packingSlipQty}
                        </td>
                        <td className="right" style={{ fontSize: 12, fontVariantNumeric: "tabular-nums" }}>
                          {item.invoiceQty}
                        </td>
                        <td className="right" style={{ fontSize: 12, fontVariantNumeric: "tabular-nums" }}>
                          ${item.poUnitPrice.toFixed(2)}
                        </td>
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
                        <td className="right">{varianceNode}</td>
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
                <p className="section-label" style={{ marginBottom: 4 }}>PO Total</p>
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
                <p className="section-label" style={{ marginBottom: 4 }}>Invoice Total</p>
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
                <p className="section-label" style={{ marginBottom: 4 }}>Variance</p>
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
                <p className="section-label" style={{ marginBottom: 6 }}>AI Recommendation</p>
                <p style={{ fontSize: 12, color: "#78716C", margin: 0, lineHeight: 1.6 }}>
                  Hold invoice. Request revised invoice from Steris at contracted rate of
                  $2.10/unit (PO #NMC-PO-2026-2847). Price variance of $0.40/unit has
                  recurred 23× this quarter = $4,600 total overcharge.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Info panel */}
        <div className="card" style={{ padding: "20px" }}>
          <p className="section-label" style={{ marginBottom: 0 }}>Exception Details</p>

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
                borderBottom: i < arr.length - 1 ? "1px solid #F5F5F4" : "none",
              }}
            >
              <span style={{ fontSize: 12, color: "#78716C" }}>{row.label}</span>
              <span style={{ fontSize: 12, color: "#1C1917", fontWeight: 500 }}>{row.value}</span>
            </div>
          ))}

          {/* Documents */}
          <p className="section-label" style={{ marginTop: 20, marginBottom: 8 }}>Documents</p>

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
              <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
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
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#1C1917")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#A8A29E")}
              >
                Open →
              </a>
            </div>
          ))}

          {/* Actions */}
          <p className="section-label" style={{ marginTop: 20, marginBottom: 10 }}>Actions</p>

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
            onMouseEnter={(e) => (e.currentTarget.style.background = "#B91C1C")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#DC2626")}
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
            onMouseEnter={(e) => (e.currentTarget.style.background = "#FEF3C7")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#FFFFFF")}
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
            onMouseEnter={(e) => (e.currentTarget.style.background = "#F5F5F4")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#FFFFFF")}
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
            onMouseEnter={(e) => (e.currentTarget.style.background = "#F5F5F4")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#FFFFFF")}
          >
            Escalate to Manager
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Router: dispatch by id ───────────────────────────────────────────────────

export default function ExceptionDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  if (id === "EX-003") return <Ex003Page />;
  return <Ex006Page />;
}
