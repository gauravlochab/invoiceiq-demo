"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Document {
  id: string;
  label: string;
  sub: string;
  type: "invoice" | "po" | "packing_slip";
  badge: "match_exception" | "duplicate" | "suspicious" | null;
}

interface LineItem {
  code: string;
  description: string;
  qty: number | string;
  unit_price: string;
  total: string;
}

interface ExtractedFlag {
  code: string;
  severity?: string;
}

interface ExtractedData {
  vendor?: {
    name?: string;
    address?: string;
    email?: string;
  };
  invoice?: {
    number?: string;
    date?: string;
    po_reference?: string;
    payment_terms?: string;
    total_amount?: string;
  };
  line_items?: LineItem[];
  flags?: ExtractedFlag[] | string[];
  [key: string]: unknown;
}

// ─── Static data ─────────────────────────────────────────────────────────────

const documents: Document[] = [
  { id: "invoice-STC-2026-19847",      label: "Steris Corporation",  sub: "Invoice · Feb 28, 2026",       type: "invoice",      badge: "match_exception" },
  { id: "invoice-MS-2026-0847",         label: "MedSupply Corp",      sub: "Invoice · Jan 15, 2026",       type: "invoice",      badge: null },
  { id: "invoice-MS-2026-0923",         label: "MedSupply Corp",      sub: "Invoice · Jan 21, 2026",       type: "invoice",      badge: "duplicate" },
  { id: "invoice-MTS-INV-00291",        label: "MedTech Solutions",   sub: "Invoice · Feb 14, 2026",       type: "invoice",      badge: "suspicious" },
  { id: "po-NMC-2026-PO-2847",          label: "Northfield Medical",  sub: "Purchase Order",               type: "po",           badge: null },
  { id: "packingslip-STC-PS-2026-0392", label: "Steris Corporation",  sub: "Packing Slip · Feb 25, 2026", type: "packing_slip", badge: null },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function flattenFields(obj: unknown): unknown[] {
  if (obj === null || obj === undefined) return [];
  if (typeof obj !== "object") return [obj];
  if (Array.isArray(obj)) {
    return obj.flatMap((item) => flattenFields(item));
  }
  return Object.values(obj as Record<string, unknown>).flatMap((v) =>
    flattenFields(v)
  );
}

function flagLabel(flag: string): { label: string; severity: "critical" | "warning" } {
  const map: Record<string, { label: string; severity: "critical" | "warning" }> = {
    no_po_reference:             { label: "No PO Reference",          severity: "critical" },
    non_standard_payment_terms:  { label: "Net 15 (non-standard)",    severity: "warning"  },
    vendor_not_standard:         { label: "Vendor not in master",     severity: "critical" },
    mixed_product_and_services:  { label: "Mixed product + services", severity: "warning"  },
    duplicate_invoice:           { label: "Duplicate Invoice",        severity: "critical" },
    price_mismatch:              { label: "Price Mismatch",           severity: "critical" },
    quantity_mismatch:           { label: "Quantity Mismatch",        severity: "warning"  },
  };
  return map[flag] ?? { label: flag.replace(/_/g, " "), severity: "warning" };
}

function getFlagCodes(flags: ExtractedData["flags"]): string[] {
  if (!flags) return [];
  return flags.map((f) => (typeof f === "string" ? f : f.code ?? ""));
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KVRow({ label, value, revealed }: { label: string; value?: string; revealed: boolean }) {
  if (!revealed) return null;
  return (
    <div className="flex justify-between py-1.5 border-b border-[#F5F5F4]">
      <span style={{ fontSize: 11, color: "#A8A29E" }}>{label}</span>
      <span
        style={{ fontSize: 12, color: "#1C1917", fontWeight: 500, maxWidth: 200 }}
        className="truncate text-right"
      >
        {value ?? "—"}
      </span>
    </div>
  );
}

function FieldGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="section-label mb-2">{title}</div>
      {children}
    </div>
  );
}

function SkeletonLoading() {
  const widths = ["w-full", "w-3/4", "w-1/2", "w-full", "w-2/3", "w-4/5", "w-1/2", "w-3/4"];
  return (
    <div className="px-4 py-4">
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-3 h-3 rounded-full animate-spin"
          style={{ border: "1px solid #D6D3D1", borderTopColor: "#1C1917" }}
        />
        <span className="section-label">EXTRACTING WITH CLAUDE</span>
      </div>
      <div className="space-y-3">
        {widths.map((w, i) => (
          <div key={i} className={`${w} h-3 rounded animate-pulse bg-[#F5F5F4]`} />
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ExtractPage() {
  const [selectedDoc, setSelectedDoc] = useState<string>("invoice-STC-2026-19847");
  const [loading, setLoading] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedData | null>(null);
  const [revealIndex, setRevealIndex] = useState(0);
  const [allRevealed, setAllRevealed] = useState(false);

  const selectedDocMeta = documents.find((d) => d.id === selectedDoc) ?? null;

  // Sequential reveal animation
  useEffect(() => {
    if (!extracted) return;
    const total = flattenFields(extracted).length;
    if (revealIndex >= total) {
      setAllRevealed(true);
      return;
    }
    const timer = setTimeout(() => setRevealIndex((i) => i + 1), 120);
    return () => clearTimeout(timer);
  }, [extracted, revealIndex]);

  const handleExtract = useCallback(async () => {
    if (!selectedDoc) return;
    setLoading(true);
    setExtracted(null);
    setRevealIndex(0);
    setAllRevealed(false);

    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document: selectedDoc }),
      });
      const json = await res.json();
      setExtracted(json.data ?? null);
    } catch {
      setExtracted(null);
    } finally {
      setLoading(false);
    }
  }, [selectedDoc]);

  const handleDocSelect = (id: string) => {
    setSelectedDoc(id);
    setExtracted(null);
    setRevealIndex(0);
    setAllRevealed(false);
    setLoading(false);
  };

  // Field reveal counter
  let fieldCounter = 0;
  function isRevealed() {
    fieldCounter += 1;
    return fieldCounter <= revealIndex;
  }

  const flagCodes = extracted ? getFlagCodes(extracted.flags) : [];
  const hasNoPO = flagCodes.includes("no_po_reference");

  return (
    <div className="flex h-[calc(100vh-0px)] overflow-hidden" style={{ background: "#FAFAF9" }}>

      {/* ── LEFT PANEL: Document Picker ─────────────────────────────────── */}
      <div
        className="flex flex-col overflow-hidden"
        style={{ width: 220, borderRight: "1px solid #E7E5E4", background: "#FFFFFF", flexShrink: 0 }}
      >
        {/* Header */}
        <div
          className="px-4 pt-5 pb-3"
          style={{ borderBottom: "1px solid #E7E5E4" }}
        >
          <div style={{ fontSize: 13, fontWeight: 600, color: "#1C1917" }}>Documents</div>
          <div style={{ fontSize: 11, color: "#A8A29E", marginTop: 2 }}>6 available</div>
        </div>

        {/* Document list */}
        <div className="flex-1 overflow-auto">
          {documents.map((doc) => {
            const isActive = selectedDoc === doc.id;
            return (
              <div
                key={doc.id}
                onClick={() => handleDocSelect(doc.id)}
                className="px-3 py-2.5 cursor-pointer flex items-start justify-between gap-2"
                style={{
                  background: isActive ? "#F5F5F4" : undefined,
                  borderLeft: isActive ? "2px solid #DC2626" : "2px solid transparent",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) (e.currentTarget as HTMLDivElement).style.background = "#FAFAF9";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) (e.currentTarget as HTMLDivElement).style.background = "";
                }}
              >
                <div className="min-w-0 flex-1">
                  <div
                    className="truncate"
                    style={{ fontSize: 12, fontWeight: 500, color: "#1C1917" }}
                  >
                    {doc.label}
                  </div>
                  <div style={{ fontSize: 11, color: "#A8A29E", marginTop: 1 }}>{doc.sub}</div>
                </div>
                {doc.badge === "match_exception" && (
                  <span className="badge warning" style={{ flexShrink: 0 }}>Mismatch</span>
                )}
                {doc.badge === "duplicate" && (
                  <span className="badge critical" style={{ flexShrink: 0 }}>Duplicate</span>
                )}
                {doc.badge === "suspicious" && (
                  <span className="badge critical" style={{ flexShrink: 0 }}>Suspicious</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Upload area */}
        <div style={{ borderTop: "1px solid #E7E5E4", padding: "12px 16px" }}>
          <div
            className="cursor-pointer text-center rounded-md"
            style={{
              border: "1px dashed #D6D3D1",
              padding: "16px 12px",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = "#FAFAF9")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = "")}
          >
            <div style={{ fontSize: 11, color: "#A8A29E" }}>Drop invoice PDF</div>
            <div style={{ fontSize: 10, color: "#A8A29E", marginTop: 2 }}>or click to upload</div>
          </div>
        </div>
      </div>

      {/* ── CENTER PANEL: PDF Viewer ────────────────────────────────────── */}
      <div className="flex flex-col flex-1 overflow-hidden" style={{ background: "#F5F5F4" }}>
        {/* Header bar */}
        <div
          className="flex items-center justify-between px-4 py-2.5"
          style={{ background: "#FFFFFF", borderBottom: "1px solid #E7E5E4", flexShrink: 0 }}
        >
          <span style={{ fontSize: 12, fontWeight: 500, color: "#1C1917" }}>
            {selectedDocMeta ? selectedDocMeta.label : "No document selected"}
          </span>
          <button
            onClick={handleExtract}
            disabled={!selectedDoc || loading}
            style={{
              background: "#1C1917",
              color: "#FFFFFF",
              fontSize: 12,
              fontWeight: 500,
              padding: "6px 16px",
              borderRadius: 6,
              border: "none",
              cursor: selectedDoc && !loading ? "pointer" : "not-allowed",
              opacity: loading ? 0.7 : 1,
              transition: "opacity 0.15s",
            }}
          >
            {loading ? "Extracting…" : "Extract with Claude →"}
          </button>
        </div>

        {/* PDF embed area */}
        <div className="flex-1 p-4 overflow-hidden" style={{ minHeight: 0 }}>
          {selectedDoc ? (
            <iframe
              src={`/documents/pdfs/${selectedDoc}.pdf`}
              className="w-full h-full rounded-lg"
              style={{
                border: "1px solid #E7E5E4",
                minHeight: 500,
                background: "#FFFFFF",
              }}
            />
          ) : (
            <div
              className="w-full h-full rounded-lg flex items-center justify-center"
              style={{ background: "#FFFFFF", border: "1px solid #E7E5E4", minHeight: 500 }}
            >
              <span style={{ fontSize: 13, color: "#A8A29E" }}>Select a document to preview</span>
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL: Extracted Data ─────────────────────────────────── */}
      <div
        className="flex flex-col overflow-hidden"
        style={{ width: 340, borderLeft: "1px solid #E7E5E4", background: "#FFFFFF", flexShrink: 0 }}
      >
        <div className="flex-1 overflow-auto">
          {/* State 1: Empty */}
          {!loading && !extracted && (
            <div className="flex items-center justify-center h-full px-6">
              <span style={{ fontSize: 12, color: "#A8A29E", textAlign: "center" }}>
                Extract a document to see structured data
              </span>
            </div>
          )}

          {/* State 2: Loading */}
          {loading && <SkeletonLoading />}

          {/* State 3: Extracted data */}
          {!loading && extracted && (
            <div className="px-4 py-4">
              <div className="section-label mb-4">EXTRACTED FIELDS</div>

              {/* VENDOR */}
              {extracted.vendor && (
                <FieldGroup title="VENDOR">
                  {(() => { fieldCounter = 0; return null; })()}
                  <KVRow label="Name"    value={extracted.vendor.name}    revealed={isRevealed()} />
                  <KVRow label="Address" value={extracted.vendor.address} revealed={isRevealed()} />
                  <KVRow label="Email"   value={extracted.vendor.email}   revealed={isRevealed()} />
                </FieldGroup>
              )}

              {/* INVOICE */}
              {extracted.invoice && (
                <FieldGroup title="INVOICE">
                  <KVRow label="Invoice #"       value={extracted.invoice.number}        revealed={isRevealed()} />
                  <KVRow label="Date"            value={extracted.invoice.date}           revealed={isRevealed()} />
                  <KVRow label="PO Reference"    value={extracted.invoice.po_reference}  revealed={isRevealed()} />
                  <KVRow label="Payment Terms"   value={extracted.invoice.payment_terms} revealed={isRevealed()} />
                  <KVRow label="Total Amount"    value={extracted.invoice.total_amount}  revealed={isRevealed()} />
                </FieldGroup>
              )}

              {/* LINE ITEMS */}
              {Array.isArray(extracted.line_items) && extracted.line_items.length > 0 && (
                <FieldGroup title="LINE ITEMS">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse" style={{ fontSize: 11 }}>
                      <thead>
                        <tr style={{ background: "#F5F5F4", borderBottom: "1px solid #E7E5E4" }}>
                          {["ITEM", "QTY", "UNIT PRICE", "TOTAL"].map((h) => (
                            <th
                              key={h}
                              style={{
                                padding: "6px 6px",
                                fontSize: 10,
                                fontWeight: 500,
                                letterSpacing: "0.06em",
                                textTransform: "uppercase",
                                color: "#A8A29E",
                                textAlign: "left",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {extracted.line_items.map((item, idx) => {
                          const rowRevealed = isRevealed();
                          if (!rowRevealed) return null;
                          return (
                            <tr key={idx} style={{ borderBottom: "1px solid #F5F5F4" }}>
                              <td style={{ padding: "6px 6px" }}>
                                <div
                                  style={{
                                    fontFamily: "monospace",
                                    fontSize: 10,
                                    color: "#78716C",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {item.code}
                                </div>
                                <div
                                  className="truncate"
                                  style={{ fontSize: 11, color: "#1C1917", maxWidth: 100 }}
                                >
                                  {item.description}
                                </div>
                              </td>
                              <td style={{ padding: "6px 6px", color: "#1C1917" }}>{item.qty}</td>
                              <td style={{ padding: "6px 6px", color: "#1C1917", whiteSpace: "nowrap" }}>
                                {item.unit_price}
                              </td>
                              <td style={{ padding: "6px 6px", color: "#1C1917", whiteSpace: "nowrap" }}>
                                {item.total}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </FieldGroup>
              )}

              {/* FLAGS */}
              {flagCodes.length > 0 && (
                <FieldGroup title="FLAGS DETECTED">
                  <div className="space-y-1.5">
                    {flagCodes.map((code, idx) => {
                      const flagRevealed = isRevealed();
                      if (!flagRevealed) return null;
                      const { label, severity } = flagLabel(code);
                      return (
                        <div key={idx} className="flex items-center gap-2">
                          <span className={`badge ${severity}`}>{label}</span>
                        </div>
                      );
                    })}
                  </div>
                </FieldGroup>
              )}
            </div>
          )}
        </div>

        {/* Bottom action bar — sticky, shown after all fields revealed */}
        {!loading && extracted && allRevealed && (
          <div
            className="px-4 py-3 flex flex-col gap-2"
            style={{ borderTop: "1px solid #E7E5E4", background: "#FFFFFF", flexShrink: 0 }}
          >
            {hasNoPO ? (
              <button
                style={{
                  width: "100%",
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
                Search for PO Match →
              </button>
            ) : (
              <button
                style={{
                  width: "100%",
                  background: "#1C1917",
                  color: "#FFFFFF",
                  fontSize: 12,
                  fontWeight: 500,
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Match Against PO →
              </button>
            )}
            <Link
              href="/exceptions"
              style={{ fontSize: 12, color: "#78716C", textAlign: "center", textDecoration: "none" }}
            >
              View in Exception Queue →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
