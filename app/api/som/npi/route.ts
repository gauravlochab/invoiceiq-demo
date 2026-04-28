// ─── NPI Registry Proxy ──────────────────────────────────────────────────────
//
// The public NPI Registry endpoint (npiregistry.cms.hhs.gov) does NOT send
// Access-Control-Allow-Origin headers, so direct browser fetch from a "use
// client" component fails CORS. This route proxies the request server-side
// (no CORS in server-to-server fetches) and returns the JSON to the browser.
//
// Plan §8 ("NPI Registry CORS — confirm browser-side call works; if not,
// proxy via Next route handler") flagged this risk; this is the realisation.

import { NextRequest, NextResponse } from "next/server";

const NPI_BASE = "https://npiregistry.cms.hhs.gov/api/?version=2.1";
const TIMEOUT_MS = 8000;   // upstream is sometimes 2-4 s; give it room before failing

export async function GET(request: NextRequest) {
  const number = request.nextUrl.searchParams.get("number")?.trim();
  if (!number) {
    return NextResponse.json(
      { error: "Missing required query parameter: number" },
      { status: 400 },
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const url = `${NPI_BASE}&number=${encodeURIComponent(number)}`;
    const res = await fetch(url, { signal: controller.signal, cache: "no-store" });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream returned HTTP ${res.status}` },
        { status: 502 },
      );
    }

    const json = await res.json();
    return NextResponse.json(json);
  } catch (err) {
    clearTimeout(timeoutId);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "network error",
      },
      { status: 504 },
    );
  }
}
