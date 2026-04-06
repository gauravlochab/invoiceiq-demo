"use client";

import Link from "next/link";
import {
  duplicatePairs,
  DuplicatePair,
  formatCurrency,
  formatDate,
} from "@/lib/data";

// ─── AI ANALYSIS COPY PER PAIR ────────────────────────────────────────────────

const aiAnalysis: Record<string, string[]> = {
  "DUP-001": [
    "Same vendor ID confirmed (VND-0142)",
    "8/8 line items match exactly (SKUs and quantities identical)",
    "Amount delta of 0.42% — consistent with known duplicate evasion pattern",
  ],
  "DUP-002": [
    "Exact duplicate: 100% similarity across all fields including amounts and line items",
    "Same EDI sender ID (HS-EDI-4421) re-submitted via email 4 days later",
    "Zero amount delta — likely accidental resubmission; payment would have doubled",
  ],
  "DUP-003": [
    "Same vendor account confirmed (VND-0389) — matched in vendor master",
    "11/12 line items match; one SKU description variant detected",
    "Amount altered by $240 (1.94%) across 5-day gap — pattern flagged for review",
  ],
};

// ─── SIMILARITY BAR ───────────────────────────────────────────────────────────

function SimilarityBar({ score }: { score: number }) {
  const fillColor = score >= 99 ? "#DC2626" : "#B45309";
  const textColor = fillColor;

  return (
    <div className="flex items-center gap-3">
      <span className="section-label">Similarity</span>
      <div
        className="rounded-full overflow-hidden"
        style={{ width: 128, height: 6, background: "#E7E5E4" }}
      >
        <div
          style={{
            width: `${Math.min(score, 100)}%`,
            height: "100%",
            background: fillColor,
            borderRadius: "inherit",
          }}
        />
      </div>
      <span
        style={{ fontSize: 13, fontWeight: 500, color: textColor }}
      >
        {score}%
      </span>
      <span style={{ color: "#D6D3D1", fontSize: 13 }}>|</span>
    </div>
  );
}

// ─── ACTION BUTTONS ───────────────────────────────────────────────────────────

function ActionButtons({ pair }: { pair: DuplicatePair }) {
  if (pair.status === "resolved") {
    return (
      <span style={{ fontSize: 12, fontWeight: 500, color: "#15803D" }}>
        Resolved — {formatCurrency(pair.flaggedAmount)} saved ✓
      </span>
    );
  }

  if (pair.status === "open") {
    return (
      <div className="flex items-center gap-2">
        <button
          style={{
            background: "#DC2626",
            color: "#fff",
            fontSize: 12,
            fontWeight: 500,
            padding: "6px 12px",
            borderRadius: 6,
            border: "none",
            cursor: "pointer",
          }}
        >
          Block Duplicate
        </button>
        <button
          style={{
            background: "#fff",
            color: "#78716C",
            fontSize: 12,
            fontWeight: 500,
            padding: "6px 12px",
            borderRadius: 6,
            border: "1px solid #D6D3D1",
            cursor: "pointer",
          }}
        >
          Investigate
        </button>
        <button
          style={{
            background: "transparent",
            color: "#A8A29E",
            fontSize: 12,
            padding: "6px 12px",
            border: "none",
            cursor: "pointer",
          }}
        >
          Dismiss
        </button>
      </div>
    );
  }

  if (pair.status === "under_review") {
    return (
      <div className="flex items-center gap-2">
        <button
          style={{
            background: "#fff",
            color: "#92400E",
            fontSize: 12,
            fontWeight: 500,
            padding: "6px 12px",
            borderRadius: 6,
            border: "1px solid #FDE68A",
            cursor: "pointer",
          }}
        >
          Continue Investigation
        </button>
        <button
          style={{
            background: "#fff",
            color: "#78716C",
            fontSize: 12,
            fontWeight: 500,
            padding: "6px 12px",
            borderRadius: 6,
            border: "1px solid #D6D3D1",
            cursor: "pointer",
          }}
        >
          Escalate
        </button>
      </div>
    );
  }

  return null;
}

// ─── DUPLICATE PAIR CARD ──────────────────────────────────────────────────────

function DuplicatePairCard({ pair }: { pair: DuplicatePair }) {
  const analysis = aiAnalysis[pair.id] ?? [];

  let badgeClass = "badge neutral";
  let badgeLabel = "Open";
  if (pair.status === "open") {
    badgeClass = "badge critical";
    badgeLabel = "Open";
  } else if (pair.status === "under_review") {
    badgeClass = "badge warning";
    badgeLabel = "Under Review";
  } else if (pair.status === "resolved") {
    badgeClass = "badge success";
    badgeLabel = "Resolved";
  }

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      {/* Card header */}
      <div
        style={{
          padding: "16px 20px 12px",
          borderBottom: "1px solid #E7E5E4",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#1C1917" }}>
            {pair.vendor}
          </span>
          <span
            style={{
              fontSize: 11,
              color: "#A8A29E",
              marginLeft: 8,
            }}
          >
            {pair.id}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: "#1C1917" }}>
            {formatCurrency(pair.flaggedAmount)}
          </span>
          <span className={badgeClass}>{badgeLabel}</span>
        </div>
      </div>

      {/* Similarity score row */}
      <div
        style={{
          padding: "8px 20px",
          borderBottom: "1px solid #E7E5E4",
          background: "#FAFAF9",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <SimilarityBar score={pair.similarity} />
        <span style={{ fontSize: 12, color: "#78716C" }}>
          {pair.amountDelta > 0
            ? `\u0394 ${formatCurrency(pair.amountDelta)} \u00b7 ${pair.daysDelta} days apart`
            : `${pair.daysDelta} days apart \u00b7 no amount delta`}
        </span>
      </div>

      {/* Side-by-side comparison */}
      <div
        style={{
          padding: "16px 20px",
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "start",
          gap: 0,
        }}
      >
        {/* Invoice A */}
        <div>
          <div className="section-label" style={{ marginBottom: 8 }}>
            Invoice A
          </div>
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 12,
              fontWeight: 500,
              color: "#1C1917",
            }}
          >
            {pair.invoice1.number}
          </div>
          <div style={{ fontSize: 11, color: "#78716C", marginTop: 2 }}>
            {formatDate(pair.invoice1.date)}
          </div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "#1C1917",
              marginTop: 4,
            }}
          >
            {formatCurrency(pair.invoice1.amount)}
          </div>
          <div style={{ fontSize: 11, color: "#A8A29E", marginTop: 4 }}>
            {pair.invoice1.submittedVia}
          </div>
        </div>

        {/* Center divider — no VS pill */}
        <div
          style={{
            width: 1,
            background: "#E7E5E4",
            alignSelf: "stretch",
            margin: "0 32px",
          }}
        />

        {/* Invoice B */}
        <div>
          <div className="section-label" style={{ marginBottom: 8 }}>
            Invoice B
          </div>
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 12,
              fontWeight: 500,
              color: "#1C1917",
            }}
          >
            {pair.invoice2.number}
          </div>
          <div style={{ fontSize: 11, color: "#78716C", marginTop: 2 }}>
            {formatDate(pair.invoice2.date)}
          </div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "#1C1917",
              marginTop: 4,
            }}
          >
            {formatCurrency(pair.invoice2.amount)}
          </div>
          <div style={{ fontSize: 11, color: "#A8A29E", marginTop: 4 }}>
            {pair.invoice2.submittedVia}
          </div>
        </div>
      </div>

      {/* AI analysis */}
      {analysis.length > 0 && (
        <div style={{ padding: "0 20px 16px" }}>
          <div
            style={{
              background: "#FAFAF9",
              border: "1px solid #E7E5E4",
              borderRadius: 6,
              padding: "12px 16px",
            }}
          >
            <div className="section-label" style={{ marginBottom: 8 }}>
              Analysis
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {analysis.map((line, i) => (
                <div
                  key={i}
                  style={{ fontSize: 12, color: "#78716C", display: "flex", gap: 8 }}
                >
                  <span style={{ color: "#A8A29E", flexShrink: 0 }}>–</span>
                  <span>{line}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ padding: "0 20px 16px" }}>
        <ActionButtons pair={pair} />
      </div>
    </div>
  );
}

// ─── HOW IT WORKS ─────────────────────────────────────────────────────────────

const steps = [
  {
    step: "STEP 1",
    name: "Ingest",
    desc: "All invoices received via email, mail, EDI, and vendor portal",
  },
  {
    step: "STEP 2",
    name: "Vectorize",
    desc: "Line items, amounts, dates, and vendor IDs converted to similarity vectors",
  },
  {
    step: "STEP 3",
    name: "Flag",
    desc: "Pairs exceeding 97% similarity threshold surfaced for review",
  },
];

function HowItWorks() {
  return (
    <div
      style={{
        border: "1px solid #E7E5E4",
        borderRadius: 8,
        background: "#fff",
        padding: "16px 24px",
        display: "flex",
        alignItems: "center",
        gap: 0,
        marginBottom: 24,
      }}
    >
      {steps.map((s, i) => (
        <div
          key={s.step}
          style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0 }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="section-label">{s.step}</div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "#1C1917",
                marginTop: 2,
              }}
            >
              {s.name}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "#A8A29E",
                marginTop: 2,
                lineHeight: 1.4,
              }}
            >
              {s.desc}
            </div>
          </div>
          {i < steps.length - 1 && (
            <span
              style={{
                color: "#D6D3D1",
                fontSize: 18,
                margin: "0 24px",
                flexShrink: 0,
              }}
            >
              →
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function DuplicatesPage() {
  return (
    <div style={{ background: "#FAFAF9", minHeight: "100vh" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ padding: "32px 32px 24px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              marginBottom: 4,
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: 20,
                  fontWeight: 600,
                  color: "#1C1917",
                  letterSpacing: "-0.01em",
                  margin: 0,
                }}
              >
                Duplicate Detection
              </h1>
              <p
                style={{
                  fontSize: 12,
                  color: "#78716C",
                  marginTop: 4,
                  marginBottom: 0,
                }}
              >
                AI scanned 1,847 invoices · 3 pairs flagged · $56,070 at risk
              </p>
            </div>
            <button
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: "#78716C",
                background: "#fff",
                border: "1px solid #D6D3D1",
                borderRadius: 6,
                padding: "6px 14px",
                cursor: "pointer",
              }}
            >
              Export
            </button>
          </div>
          <hr className="divider" style={{ marginTop: 20 }} />
        </div>

        {/* How it works + cards */}
        <div style={{ padding: "0 32px 32px" }}>
          <HowItWorks />

          {duplicatePairs.map((pair) => (
            <DuplicatePairCard key={pair.id} pair={pair} />
          ))}
        </div>
      </div>
    </div>
  );
}
