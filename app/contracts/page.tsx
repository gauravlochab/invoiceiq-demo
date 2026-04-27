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
    p >= 100 ? "#DC2626" : p >= 70 ? "#B45309" : "#0065cb";

  return (
    <div>
      {label && (
        <div className="section-label mb-1 text-[#9ca3af]">
          {label}
        </div>
      )}
      <div className="flex items-center justify-between mb-1">
        <span className="section-label">SPEND VS CAP</span>
        <span className="text-xs tabular-nums text-[#4b5563]">
          {formatCurrency(spend)}{" "}
          <span className="text-[#9ca3af]">/</span>{" "}
          {formatCurrency(cap)}
        </span>
      </div>
      <div className="progress-track mt-2">
        <div
          className="progress-fill"
          style={{ width: `${Math.min(p, 100)}%`, background: fillColor }}
        />
      </div>
      <div className={`text-xs mt-1 ${p >= 100 ? "text-red-600" : "text-[#4b5563]"}`}>
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
      : "#e5e7eb";

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
      <div className="flex items-start justify-between px-5 pt-4 pb-3">
        <div>
          <div className="text-sm font-semibold text-[#111827]">
            {contract.vendor}
          </div>
          <div className="text-xs font-mono text-[#9ca3af] mt-0.5">
            {contract.contractNumber}
          </div>
          <div className="mt-1.5">
            <span className="badge neutral">{contract.category}</span>
          </div>
        </div>
        <div className="text-right">
          <span className={statusBadgeClass}>{statusLabel}</span>
          <div className="text-xs text-[#9ca3af] mt-1">
            {fmtPeriod(contract.startDate, contract.endDate)}
          </div>
        </div>
      </div>

      {/* Spend section */}
      <div className="px-5 pb-3 border-b border-[#f0f2f5]">
        {hasQuantityCap ? (
          <div className="flex flex-col gap-4">
            {/* Value bar */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="section-label">VALUE SPEND VS CAP</span>
                <span className="text-xs tabular-nums text-[#4b5563]">
                  {formatCurrency(contract.currentSpend)}{" "}
                  <span className="text-[#9ca3af]">/</span>{" "}
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
                        : "#0065cb",
                  }}
                />
              </div>
              <div className="text-xs mt-1 text-[#4b5563]">
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
                      <span className="text-xs tabular-nums text-[#4b5563]">
                        {contract.currentQuantity.toLocaleString()}{" "}
                        <span className="text-[#9ca3af]">/</span>{" "}
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
                              : "#0065cb",
                        }}
                      />
                    </div>
                    <div className="text-xs mt-1 text-[#4b5563]">
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
        <div className="px-5 py-2.5 border-b border-[#f0f2f5] flex items-center gap-2">
          <span className="section-label">UNCLAIMED REBATE</span>
          <span className="text-xs text-amber-700">
            {formatCurrency(contract.rebateMissed)} not received — No credit
            memo for Q1 2026
          </span>
        </div>
      )}

      {/* Tier pricing */}
      {contract.tieredPricing && (
        <div className="px-5 py-2.5 border-b border-[#f0f2f5]">
          <div className="section-label mb-1.5">TIERED PRICING</div>
          <div className="flex flex-col gap-1">
            <div className="text-xs text-[#4b5563]">
              Tier 1: ≤ 1,000 units/month &rarr; $85.00/unit
            </div>
            <div className="text-xs text-[#4b5563]">
              Tier 2: &gt; 1,000 units/month &rarr; $72.00/unit{" "}
              <span className="text-amber-700">
                &larr; should apply (2,340 units in Mar)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* BioMed breach block */}
      {isBreached && (
        <div className="mx-5 mb-3 bg-red-50 border border-red-200 rounded-md px-4 py-3">
          <div className="section-label text-red-600 mb-1">
            CONTRACT BREACHED
          </div>
          <div className="text-xs text-red-900">
            23 invoices processed after cap exceeded &middot;{" "}
            {formatCurrency(contract.currentSpend - contract.capValue)} overspend
            &middot; Contract expired{" "}
            {new Date(contract.endDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
          <div className="flex gap-2 mt-2">
            <button className="bg-red-600 text-white text-xs font-medium px-3 py-1.5 rounded-md border-none cursor-pointer hover:bg-red-700 transition-colors">
              Pause Vendor Payments
            </button>
            <button className="bg-white text-red-600 text-xs font-medium px-3 py-1.5 rounded-md border border-red-200 cursor-pointer hover:bg-red-50 transition-colors">
              Contact Vendor
            </button>
            <button className="bg-white text-[#4b5563] text-xs px-3 py-1.5 rounded-md border border-[#d1d5db] cursor-pointer hover:bg-[#f7f8fa] transition-colors">
              Notify CFO
            </button>
          </div>
        </div>
      )}

      {/* Cardinal Health warning actions */}
      {isCardinalWarning && (
        <div className="px-5 pb-4 flex gap-2">
          <button className="bg-white text-[#111827] text-xs font-medium px-3 py-1.5 rounded-md border border-[#d1d5db] cursor-pointer hover:bg-[#f7f8fa] transition-colors">
            Request Rebate Credit Memo
          </button>
          <button className="bg-white text-[#111827] text-xs font-medium px-3 py-1.5 rounded-md border border-[#d1d5db] cursor-pointer hover:bg-[#f7f8fa] transition-colors">
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
    <div className="bg-[#f7f8fa] min-h-full">
      {/* ── Header ── */}
      <div className="px-8 pt-8 pb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xl font-semibold text-[#111827]">
              Contract Compliance
            </div>
            <div className="text-xs text-[#4b5563] mt-1">
              {contracts.length} active contracts &middot; {atRiskCount} at risk &middot;{" "}
              {breachedCount} breached
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <button className="text-sm text-[#111827] bg-white border border-[#e5e7eb] rounded-md px-3.5 py-[7px] cursor-pointer hover:bg-[#f7f8fa] transition-colors">
              Download Report
            </button>
            <button className="text-sm text-white bg-[#0065cb] border-none rounded-md px-3.5 py-[7px] cursor-pointer font-medium hover:bg-[#0057ad] transition-colors">
              Add Contract
            </button>
          </div>
        </div>
        <hr className="border-none border-t border-[#e5e7eb] mt-5" />
      </div>

      {/* ── Summary strip ── */}
      <div className="px-8 pb-6">
        <div className="bg-white border border-[#e5e7eb] rounded-lg flex">
          {/* Cell 1 */}
          <div className="flex-1 px-5 py-4 border-r border-[#e5e7eb]">
            <div className="section-label mb-1.5">TOTAL CONTRACT VALUE</div>
            <div className="text-xl font-semibold text-[#111827] tabular-nums">
              {formatCurrency(totalValue)}
            </div>
            <div className="text-xs text-[#4b5563] mt-0.5">
              {contracts.length} contracts
            </div>
          </div>

          {/* Cell 2 */}
          <div className="flex-1 px-5 py-4 border-r border-[#e5e7eb]">
            <div className="section-label mb-1.5">CURRENT SPEND</div>
            <div className="text-xl font-semibold text-[#111827] tabular-nums">
              {formatCurrency(totalSpend)}
            </div>
            <div className="text-xs text-[#4b5563] mt-0.5">Q1 2026</div>
          </div>

          {/* Cell 3 */}
          <div className="flex-1 px-5 py-4 border-r border-[#e5e7eb]">
            <div className="section-label mb-1.5">UNCLAIMED REBATES</div>
            <div className="text-xl font-semibold text-amber-700 tabular-nums">
              {formatCurrency(totalUnclaimed)}
            </div>
            <div className="text-xs text-[#4b5563] mt-0.5">
              {vendorsWithRebates} vendors
            </div>
          </div>

          {/* Cell 4 */}
          <div className="flex-1 px-5 py-4">
            <div className="section-label mb-1.5">CONTRACTS BREACHED</div>
            <div className="text-xl font-semibold text-red-600 tabular-nums">
              {breachedCount}
            </div>
            <div className="text-xs text-[#4b5563] mt-0.5">Immediate action</div>
          </div>
        </div>
      </div>

      {/* ── Contract cards ── */}
      <div className="px-8">
        {sortedContracts.map((contract) => (
          <ContractCard key={contract.id} contract={contract} />
        ))}
      </div>

      {/* ── Renewal timeline ── */}
      <div className="px-8 pt-2 pb-8">
        <div className="section-label mb-2">UPCOMING RENEWALS</div>
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
                <td className="text-sm text-[#111827]">BioMed Equipment Inc.</td>
                <td className="mono">CTR-2024-BIO-009</td>
                <td className="text-sm text-[#111827]">Dec 31, 2025</td>
                <td><span className="badge critical">Expired</span></td>
                <td>
                  <a href="#" className="text-xs text-[#0065cb] no-underline font-medium hover:underline">
                    Renew &rarr;
                  </a>
                </td>
              </tr>
              <tr>
                <td className="text-sm text-[#111827]">Cardinal Health</td>
                <td className="mono">CTR-2025-CAR-003</td>
                <td className="text-sm text-[#111827]">Mar 31, 2026</td>
                <td><span className="badge warning">Expiring</span></td>
                <td>
                  <a href="#" className="text-xs text-[#0065cb] no-underline font-medium hover:underline">
                    Renew &rarr;
                  </a>
                </td>
              </tr>
              <tr>
                <td className="text-sm text-[#111827]">Steris Corporation</td>
                <td className="mono">CTR-2025-STE-007</td>
                <td className="text-sm text-[#111827]">May 31, 2026</td>
                <td><span className="badge neutral">Active</span></td>
                <td>
                  <a href="#" className="text-xs text-[#0065cb] no-underline font-medium hover:underline">
                    Renew &rarr;
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
