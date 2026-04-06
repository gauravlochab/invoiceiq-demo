const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

const docs = [
  "invoice-MS-2026-0847",
  "invoice-MS-2026-0923",
  "invoice-STC-2026-19847",
  "po-NMC-2026-PO-2847",
  "invoice-MTS-INV-00291",
  "packingslip-STC-PS-2026-0392",
];

const inputDir = path.join(__dirname, "../public/documents");
const outputDir = path.join(__dirname, "../public/documents/pdfs");

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

(async () => {
  const browser = await puppeteer.launch({ headless: true });

  for (const doc of docs) {
    const htmlPath = path.join(inputDir, `${doc}.html`);
    const pdfPath = path.join(outputDir, `${doc}.pdf`);

    if (!fs.existsSync(htmlPath)) {
      console.log(`SKIP (not found): ${doc}`);
      continue;
    }

    const page = await browser.newPage();
    await page.goto(`file://${htmlPath}`, { waitUntil: "networkidle0" });
    await page.pdf({
      path: pdfPath,
      format: "A4",
      printBackground: true,
      margin: { top: "10mm", bottom: "10mm", left: "10mm", right: "10mm" },
    });
    await page.close();
    console.log(`✓ ${doc}.pdf`);
  }

  await browser.close();
  console.log("\nAll PDFs generated in public/documents/pdfs/");
})();
