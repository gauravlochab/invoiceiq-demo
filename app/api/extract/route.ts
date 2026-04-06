import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function getPromptForDocument(document: string): string {
  if (document.startsWith("invoice-")) {
    return `Extract this invoice document into the following JSON structure exactly:
{
  "documentType": "invoice",
  "vendor": { "name": "", "address": "", "email": "", "phone": "" },
  "billTo": { "name": "", "address": "" },
  "invoiceNumber": "",
  "invoiceDate": "",
  "poReference": "",
  "paymentTerms": "",
  "dueDate": "",
  "submittedVia": "",
  "lineItems": [
    { "itemCode": "", "description": "", "quantity": 0, "unit": "", "unitPrice": 0, "total": 0 }
  ],
  "subtotal": 0,
  "tax": 0,
  "handlingFee": 0,
  "totalAmount": 0,
  "flags": []
}

For the flags array, include any of these that apply:
- "no_po_reference" if no PO number is found
- "non_standard_payment_terms" if payment terms are not Net 30
- "vendor_not_standard" if the vendor address looks like a suite/virtual office
- "mixed_product_and_services" if line items mix physical products and consulting/services`;
  }

  if (document.startsWith("packingslip-")) {
    return `Extract this packing slip into:
{
  "documentType": "packing_slip",
  "vendor": { "name": "", "address": "" },
  "deliverTo": { "name": "", "address": "" },
  "slipNumber": "",
  "shipDate": "",
  "deliveredDate": "",
  "carrier": "",
  "trackingNumber": "",
  "poReference": "",
  "salesOrder": "",
  "receivedBy": "",
  "lineItems": [
    { "itemCode": "", "description": "", "orderedQty": 0, "shippedQty": 0, "status": "complete|short|backordered" }
  ],
  "deliveryStatus": "complete|partial",
  "flags": []
}`;
  }

  if (document.startsWith("po-")) {
    return `Extract this purchase order into:
{
  "documentType": "purchase_order",
  "hospital": { "name": "", "address": "" },
  "vendor": { "name": "", "address": "", "vendorId": "" },
  "poNumber": "",
  "poDate": "",
  "buyer": "",
  "department": "",
  "contractReference": "",
  "lineItems": [
    { "itemCode": "", "description": "", "quantity": 0, "unit": "", "unitPrice": 0, "total": 0 }
  ],
  "subtotal": 0,
  "estimatedFreight": 0,
  "poTotal": 0,
  "paymentTerms": "",
  "flags": []
}`;
  }

  // Fallback: generic extraction
  return `Extract all structured data from this document and return it as valid JSON.`;
}

export async function POST(req: NextRequest) {
  let document: string;

  try {
    const body = await req.json();
    document = body.document;
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON request body" },
      { status: 400 }
    );
  }

  if (!document || typeof document !== "string") {
    return NextResponse.json(
      { success: false, error: "Missing or invalid 'document' field in request body" },
      { status: 400 }
    );
  }

  // Sanitize: strip any path traversal characters
  const safeDocument = path.basename(document);
  const filename = `${safeDocument}.pdf`;
  const pdfPath = path.join(process.cwd(), "public", "documents", "pdfs", filename);

  if (!fs.existsSync(pdfPath)) {
    return NextResponse.json(
      { success: false, error: `PDF not found: ${filename}` },
      { status: 404 }
    );
  }

  let pdfBase64: string;
  try {
    const pdfBuffer = fs.readFileSync(pdfPath);
    pdfBase64 = pdfBuffer.toString("base64");
  } catch (err) {
    return NextResponse.json(
      { success: false, error: `Failed to read PDF: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }

  const userPrompt = getPromptForDocument(safeDocument);

  let claudeText: string;
  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system:
        "You are a document extraction AI for a hospital accounts payable system. " +
        "Extract all structured data from the provided document and return ONLY valid JSON with no markdown, no explanation.",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: pdfBase64,
              },
            },
            {
              type: "text",
              text: userPrompt,
            },
          ],
        },
      ],
    });

    const firstBlock = response.content[0];
    if (firstBlock.type !== "text") {
      return NextResponse.json(
        { success: false, error: "Unexpected response type from Claude" },
        { status: 500 }
      );
    }
    claudeText = firstBlock.text;
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: `Claude API error: ${err instanceof Error ? err.message : String(err)}`,
      },
      { status: 500 }
    );
  }

  // Strip markdown code fences if Claude wrapped the JSON despite instructions
  const stripped = claudeText.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

  let parsedData: unknown;
  try {
    parsedData = JSON.parse(stripped);
  } catch {
    // Return raw text so the caller can still inspect what Claude produced
    return NextResponse.json({
      success: true,
      document: safeDocument,
      data: null,
      rawText: claudeText,
      extractedAt: new Date().toISOString(),
    });
  }

  return NextResponse.json({
    success: true,
    document: safeDocument,
    data: parsedData,
    extractedAt: new Date().toISOString(),
  });
}
