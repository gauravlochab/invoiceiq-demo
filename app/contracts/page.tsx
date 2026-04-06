"use client";

import { contracts, formatCurrency, formatDate, Contract } from "@/lib/data";

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function pct(spend: number, cap: number): number {
  return (spend / cap) * 100;
}

function fmtPeriod(start: string, end: string): string {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  return `${fmt(start)} – ${fmt(end)}`;
}

const STATUS_ORDER: Record<Contract["status"], number> = {
  breached: 0,
  expired: 0,
  warning: 1,
  compliant: 2,
};

const sortedContracts = [...contracts].sort(
  (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
);

// ─── SPEND BAR ────────────────────────────────────────────────────────────────

function SpendBar({
  spend,
  cap,
  label,
}: {
  spend: number;
  cap: number;
  label?: string;
}) {
  const p = pct(spend, cap);
  const fillColor =
    p >= 100 ? "#DC2626" : p >= 70 ? "#B45309" : "#1C1917";

  return (
    <div>
      {label && (
        <div
          className="section-label mb-1"
          style={{ color: "#A8A29E" }}
        >
          {label}
        </div>
      )}
      <div className="flex items-center justify-between mb-1">
        <span className="section-label">SPEND VS CAP</span>
        <span
          style={{
            fontSize: 12,
            fontVariantNumeric: "tabular-nums",
            color: "#78716C",
          }}
        >
          {formatCurrency(spend)}{" "}
          <span style={{ color: "#A8A29E" }}>/</span>{" "}
          {formatCurrency(cap)}
        </span>
      </div>
      <div className="progress-track mt-2">
        <div
          className="progress-fill"
          style={{
            width: `${Math.min(p, 100)}%`,
            background: fillColor,
          }}
        />
      </div>
      <div
        style={{
          fontSize: 11,
          marginTop: 4,
          color: p >= 100 ? "#DC2626" : "#78716C",
        }}
      >
        {p >= 100
          ? `${p.toFixed(1)}% of cap — ${formatCurrency(spend - cap)} over limit`
          : `${p.toFixed(1)}% of cap`}
      </div>
    </div>
  );
}

// ─── CONTRACT CARD ────────────────────────────────────────────────────────────

function ContractCard({ contract }: { contract: Contract }) {
  const isBreached = contract.status === "breached";
  const isCardinalWarning =
    contract.vendor === "Cardinal Health" && contract.status === "warning";

  const leftBorderColor =
    isBreached
      ? "#DC2626"
      : contract.status === "warning"
      ? "#B45309"
      : "#E7E5E4";

  const statusBadgeClass =
    isBreached
      ? "badge critical"
      : contract.status === "warning"
      ? "badge warning"
      : "badge success";

  const statusLabel =
    isBreached ? "Breached" : contract.status === "warning" ? "At Risk" : "Compliant";

  const valuePct = pct(contract.currentSpend, contract.capValue);
  const hasQuantityCap =
    contract.capType === "both" &&
    contract.capQuantity !== undefined &&
    contract.currentQuantity !== undefined;

  return (
    <div
      className="card mb-3"
      style={{ borderLeft: `2px solid ${leftBorderColor}` }}
    >
      {/* Card header */}
      <div
        className="flex items-start justify-between"
        style={{ padding: "16px 20px 12px" }}
      >
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#1C1917" }}>
            {contract.vendor}
          </div>
          <div
            style={{
              fontSize: 11,
              fontFamily: "monospace",
              color: "#A8A29E",
              marginTop: 2,
            }}
          >
            {contract.contractNumber}
          </div>
          <div style={{ marginTop: 6 }}>
            <span className="badge neutral">{contract.category}</span>
          </div>
        </div>
        <div className="text-right">
          <span className={statusBadgeClass}>{statusLabel}</span>
          <div style={{ fontSize: 11, color: "#A8A29E", marginTop: 4 }}>
            {fmtPeriod(contract.startDate, contract.endDate)}
          </div>
        </div>
      </div>

      {/* Spend section */}
      <div
        style={{
          padding: "0 20px 12px",
          borderBottom: "1px solid #F5F5F4",
        }}
      >
        {hasQuantityCap ? (
          <div className="flex flex-col gap-4">
            {/* Value bar */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="section-label">VALUE SPEND VS CAP</span>
                <span
                  style={{
                    fontSize: 12,
                    fontVariantNumeric: "tabular-nums",
                    color: "#78716C",
                  }}
                >
                  {formatCurrency(contract.currentSpend)}{" "}
                  <span style={{ color: "#A8A29E" }}>/</span>{" "}
                  {formatCurrency(contract.capValue)}
                </span>
              </div>
              <div className="progress-track mt-2">
                <div
                  className="progress-fill"
                  style={{
                    width: `${Math.min(valuePct, 100)}%`,
                    background:
                      valuePct >= 100
                        ? "#DC2626"
                        : valuePct >= 70
                        ? "#B45309"
                        : "#1C1917",
                  }}
                />
              </div>
              <div style={{ fontSize: 11, marginTop: 4, color: "#78716C" }}>
                {valuePct.toFixed(1)}% of cap
              </div>
            </div>
            {/* Quantity bar */}
            {contract.capQuantity !== undefined &&
              contract.currentQuantity !== undefined && (() => {
                const qp = pct(contract.currentQuantity, contract.capQuantity);
                return (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="section-label">QUANTITY VS CAP</span>
                      <span
                        style={{
                          fontSize: 12,
                          fontVariantNumeric: "tabular-nums",
                          color: "#78716C",
                        }}
                      >
                        {contract.currentQuantity.toLocaleString()}{" "}
                        <span style={{ color: "#A8A29E" }}>/</span>{" "}
                        {contract.capQuantity.toLocaleString()} units
                      </span>
                    </div>
                    <div className="progress-track mt-2">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${Math.min(qp, 100)}%`,
                          background:
                            qp >= 100
                              ? "#DC2626"
                              : qp >= 70
                              ? "#B45309"
                              : "#1C1917",
                        }}
                      />
                    </div>
                    <div style={{ fontSize: 11, marginTop: 4, color: "#78716C" }}>
                      {qp.toFixed(1)}% of cap
                    </div>
                  </div>
                );
              })()}
          </div>
        ) : (
          <SpendBar spend={contract.currentSpend} cap={contract.capValue} />
        )}
      </div>

      {/* Rebate alert */}
      {contract.rebateMissed !== undefined && contract.rebateMissed > 0 && (
        <div
          style={{
            padding: "10px 20px",
            borderBottom: "1px solid #F5F5F4",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span className="section-label">UNCLAIMED REBATE</span>
          <span style={{ fontSize: 12, color: "#B45309" }}>
            {formatCurrency(contract.rebateMissed)} not received — No credit
            memo for Q1 2026
          </span>
        </div>
      )}

      {/* Tier pricing */}
      {contract.tieredPricing && (
        <div
          style={{
            padding: "10px 20px",
            borderBottom: "1px solid #F5F5F4",
          }}
        >
          <div className="section-label" style={{ marginBottom: 6 }}>
            TIERED PRICING
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <div style={{ fontSize: 12, color: "#78716C" }}>
              Tier 1: ≤ 1,000 units/month → $85.00/unit
            </div>
            <div style={{ fontSize: 12, color: "#78716C" }}>
              Tier 2: &gt; 1,000 units/month → $72.00/unit{" "}
              <span style={{ color: "#B45309" }}>
                ← should apply (2,340 units in Mar)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* BioMed breach block */}
      {isBreached && (
        <div
          style={{
            margin: "0 20px 12px",
            background: "#FEF2F2",
            border: "1px solid #FECACA",
            borderRadius: 6,
            padding: "12px 16px",
          }}
        >
          <div
            className="section-label"
            style={{ color: "#DC2626", marginBottom: 4 }}
          >
            CONTRACT BREACHED
          </div>
          <div style={{ fontSize: 12, color: "#991B1B" }}>
            23 invoices processed after cap exceeded ·{" "}
            {formatCurrency(contract.currentSpend - contract.capValue)} overspend
            · Contract expired{" "}
            {new Date(contract.endDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button
              style={{
                background: "#DC2626",
                color: "#FFFFFF",
                fontSize: 12,
                fontWeight: 500,
                padding: "6px 12px",
                borderRadius: 6,
                border: "none",
                cursor: "pointer",
              }}
            >
              Pause Vendor Payments
            </button>
            <button
              style={{
                background: "#FFFFFF",
                color: "#DC2626",
                fontSize: 12,
                fontWeight: 500,
                padding: "6px 12px",
                borderRadius: 6,
                border: "1px solid #FECACA",
                cursor: "pointer",
              }}
            >
              Contact Vendor
            </button>
            <button
              style={{
                background: "#FFFFFF",
                color: "#78716C",
                fontSize: 12,
                padding: "6px 12px",
                borderRadius: 6,
                border: "1px solid #D6D3D1",
                cursor: "pointer",
              }}
            >
              Notify CFO
            </button>
          </div>
        </div>
      )}

      {/* Cardinal Health warning actions */}
      {isCardinalWarning && (
        <div style={{ padding: "0 20px 16px", display: "flex", gap: 8 }}>
          <button
            style={{
              background: "#FFFFFF",
              color: "#1C1917",
              fontSize: 12,
              fontWeight: 500,
              padding: "6px 12px",
              borderRadius: 6,
              border: "1px solid #D6D3D1",
              cursor: "pointer",
            }}
          >
            Request Rebate Credit Memo
          </button>
          <button
            style={{
              background: "#FFFFFF",
              color: "#1C1917",
              fontSize: 12,
              fontWeight: 500,
              padding: "6px 12px",
              borderRadius: 6,
              border: "1px solid #D6D3D1",
              cursor: "pointer",
            }}
          >
            Submit Pricing Correction
          </button>
        </div>
      )}
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function ContractCompliancePage() {
  const totalValue = contracts.reduce((s, c) => s + c.capValue, 0);
  const totalSpend = contracts.reduce((s, c) => s + c.currentSpend, 0);
  const totalUnclaimed = contracts.reduce(
    (s, c) => s + (c.rebateMissed ?? 0),
    0
  );
  const breachedCount = contracts.filter((c) => c.status === "breached").length;
  const atRiskCount = contracts.filter((c) => c.status === "warning").length;
  const vendorsWithRebates = contracts.filter(
    (c) => (c.rebateMissed ?? 0) > 0
  ).length;

  return (
    <div style={{ background: "#FAFAF9", minHeight: "100%" }}>
      {/* ── Header ── */}
      <div style={{ padding: "32px 32px 24px" }}>
        <div className="flex items-start justify-between">
          <div>
            <div style={{ fontSize: 20, fontWeight: 600, color: "#1C1917" }}>
              Contract Compliance
            </div>
            <div style={{ fontSize: 12, color: "#78716C", marginTop: 4 }}>
              {contracts.length} active contracts · {atRiskCount} at risk ·{" "}
              {breachedCount} breached
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              style={{
                fontSize: 13,
                color: "#1C1917",
                background: "#FFFFFF",
                border: "1px solid #E7E5E4",
                borderRadius: 6,
                padding: "7px 14px",
                cursor: "pointer",
              }}
            >
              Download Report
            </button>
            <button
              style={{
                fontSize: 13,
                color: "#FFFFFF",
                background: "#1C1917",
                border: "none",
                borderRadius: 6,
                padding: "7px 14px",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              Add Contract
            </button>
          </div>
        </div>
        <hr
          style={{
            border: "none",
            borderTop: "1px solid #E7E5E4",
            marginTop: 20,
          }}
        />
      </div>

      {/* ── Summary strip ── */}
      <div style={{ padding: "0 32px 24px" }}>
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #E7E5E4",
            borderRadius: 8,
            display: "flex",
          }}
        >
          {/* Cell 1 */}
          <div
            style={{
              flex: 1,
              padding: "16px 20px",
              borderRight: "1px solid #E7E5E4",
            }}
          >
            <div className="section-label" style={{ marginBottom: 6 }}>
              TOTAL CONTRACT VALUE
            </div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 600,
                color: "#1C1917",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {formatCurrency(totalValue)}
            </div>
            <div style={{ fontSize: 12, color: "#78716C", marginTop: 2 }}>
              {contracts.length} contracts
            </div>
          </div>

          {/* Cell 2 */}
          <div
            style={{
              flex: 1,
              padding: "16px 20px",
              borderRight: "1px solid #E7E5E4",
            }}
          >
            <div className="section-label" style={{ marginBottom: 6 }}>
              CURRENT SPEND
            </div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 600,
                color: "#1C1917",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {formatCurrency(totalSpend)}
            </div>
            <div style={{ fontSize: 12, color: "#78716C", marginTop: 2 }}>
              Q1 2026
            </div>
          </div>

          {/* Cell 3 */}
          <div
            style={{
              flex: 1,
              padding: "16px 20px",
              borderRight: "1px solid #E7E5E4",
            }}
          >
            <div className="section-label" style={{ marginBottom: 6 }}>
              UNCLAIMED REBATES
            </div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 600,
                color: "#B45309",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {formatCurrency(totalUnclaimed)}
            </div>
            <div style={{ fontSize: 12, color: "#78716C", marginTop: 2 }}>
              {vendorsWithRebates} vendors
            </div>
          </div>

          {/* Cell 4 */}
          <div style={{ flex: 1, padding: "16px 20px" }}>
            <div className="section-label" style={{ marginBottom: 6 }}>
              CONTRACTS BREACHED
            </div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 600,
                color: "#DC2626",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {breachedCount}
            </div>
            <div style={{ fontSize: 12, color: "#78716C", marginTop: 2 }}>
              Immediate action
            </div>
          </div>
        </div>
      </div>

      {/* ── Contract cards ── */}
      <div style={{ padding: "0 32px" }}>
        {sortedContracts.map((contract) => (
          <ContractCard key={contract.id} contract={contract} />
        ))}
      </div>

      {/* ── Renewal timeline ── */}
      <div style={{ padding: "8px 32px 32px" }}>
        <div className="section-label" style={{ marginBottom: 8 }}>
          UPCOMING RENEWALS
        </div>
        <div className="card">
          <table className="data-table">
            <thead>
              <tr>
                <th>VENDOR</th>
                <th>CONTRACT #</th>
                <th>EXPIRES</th>
                <th>STATUS</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontSize: 13, color: "#1C1917" }}>
                  BioMed Equipment Inc.
                </td>
                <td className="mono">CTR-2024-BIO-009</td>
                <td style={{ fontSize: 13, color: "#1C1917" }}>Dec 31, 2025</td>
                <td>
                  <span className="badge critical">Expired</span>
                </td>
                <td>
                  <a
                    href="#"
                    style={{
                      fontSize: 12,
                      color: "#1C1917",
                      textDecoration: "none",
                      fontWeight: 500,
                    }}
                  >
                    Renew →
                  </a>
                </td>
              </tr>
              <tr>
                <td style={{ fontSize: 13, color: "#1C1917" }}>
                  Cardinal Health
                </td>
                <td className="mono">CTR-2025-CAR-003</td>
                <td style={{ fontSize: 13, color: "#1C1917" }}>Mar 31, 2026</td>
                <td>
                  <span className="badge warning">Expiring</span>
                </td>
                <td>
                  <a
                    href="#"
                    style={{
                      fontSize: 12,
                      color: "#1C1917",
                      textDecoration: "none",
                      fontWeight: 500,
                    }}
                  >
                    Renew →
                  </a>
                </td>
              </tr>
              <tr>
                <td style={{ fontSize: 13, color: "#1C1917" }}>
                  Steris Corporation
                </td>
                <td className="mono">CTR-2025-STE-007</td>
                <td style={{ fontSize: 13, color: "#1C1917" }}>May 31, 2026</td>
                <td>
                  <span className="badge neutral">Active</span>
                </td>
                <td>
                  <a
                    href="#"
                    style={{
                      fontSize: 12,
                      color: "#1C1917",
                      textDecoration: "none",
                      fontWeight: 500,
                    }}
                  >
                    Renew →
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
