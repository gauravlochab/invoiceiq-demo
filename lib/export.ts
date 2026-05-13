export function exportToCSV(
  headers: string[],
  rows: (string | number)[],
  filename: string
) {
  const escape = (v: string | number) => {
    const s = String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };

  const csv = [
    headers.map(escape).join(","),
    ...rows.map((row) =>
      (Array.isArray(row) ? row : [row]).map(escape).join(",")
    ),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportToPDF(
  title: string,
  headers: string[],
  rows: (string | number)[][],
  summary?: { label: string; value: string }[]
) {
  const now = new Date().toLocaleString("en-US", {
    year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
  });

  const summaryHtml = summary
    ? `<div style="display:flex;gap:24px;margin-bottom:24px">${summary
        .map(
          (s) =>
            `<div style="background:#f8f9fa;border:1px solid #e5e7eb;border-radius:6px;padding:12px 16px"><div style="font-size:10px;text-transform:uppercase;color:#6b7280;margin-bottom:4px">${s.label}</div><div style="font-size:16px;font-weight:600;color:#111827">${s.value}</div></div>`
        )
        .join("")}</div>`
    : "";

  const tableRows = rows
    .map(
      (row) =>
        `<tr>${row.map((cell) => `<td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#374151">${cell}</td>`).join("")}</tr>`
    )
    .join("");

  const html = `<!DOCTYPE html><html><head><title>${title}</title><style>
    @media print { body { margin: 0; } @page { margin: 1cm; } }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111827; }
    table { width: 100%; border-collapse: collapse; }
    th { padding: 8px 12px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; border-bottom: 2px solid #e5e7eb; }
  </style></head><body>
    <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:16px;border-bottom:2px solid #0065cb;margin-bottom:24px">
      <div><h1 style="font-size:18px;margin:0">${title}</h1><p style="font-size:12px;color:#6b7280;margin:4px 0 0">InvoiceIQ Detect — Parkland Health</p></div>
      <div style="text-align:right"><p style="font-size:11px;color:#6b7280;margin:0">Generated: ${now}</p><p style="font-size:11px;color:#6b7280;margin:2px 0 0">Confidential — Internal Use Only</p></div>
    </div>
    ${summaryHtml}
    <table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${tableRows}</tbody></table>
    <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:10px;color:#9ca3af;display:flex;justify-content:space-between">
      <span>SOC 2 Type II Compliant · HIPAA Compliant · AES-256 Encryption</span>
      <span>Page 1 of 1</span>
    </div>
  </body></html>`;

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.left = "-9999px";
  iframe.style.width = "0";
  iframe.style.height = "0";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  if (doc) {
    doc.open();
    doc.write(html);
    doc.close();
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
  }

  setTimeout(() => document.body.removeChild(iframe), 1000);
}
