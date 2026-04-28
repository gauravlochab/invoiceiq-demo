// ─── Action: Query NPI Registry (LIVE network call) ──────────────────────────
//
// The one genuine live API hit in the SOM demo (per plan §4.3). NPI Registry
// is public, no auth, no key, but its responses do NOT include CORS headers
// — direct browser fetch fails. We proxy through our own Next.js route
// handler at /api/som/npi which does the server-side fetch.
//
//   browser → /api/som/npi?number=<NPI>   (same origin, no CORS)
//   server  → npiregistry.cms.hhs.gov     (server-to-server, no CORS)
//
// Strict timeout + graceful fallback to mock so the demo never breaks if
// offline.

export interface NpiRegistryResponse {
  source: "NPI Registry (cms.hhs.gov)";
  /** True iff we actually reached the live endpoint. */
  isLive: boolean;
  found: boolean;
  npi?: string;
  organizationName?: string;
  taxonomy?: string;
  status?: "Active" | "Deactivated" | "Unknown";
  rawError?: string;
  latencyMs: number;
}

// Same-origin proxy that forwards to npiregistry.cms.hhs.gov server-side.
const NPI_PROXY = "/api/som/npi";
const TIMEOUT_MS = 10_000;   // proxy itself caps upstream at 8s; give us 2s slack

export async function queryNpi(npi: string | undefined): Promise<NpiRegistryResponse> {
  const startedAt = Date.now();
  if (!npi) {
    return {
      source: "NPI Registry (cms.hhs.gov)",
      isLive: false,
      found: false,
      status: "Unknown",
      rawError: "no NPI on file",
      latencyMs: 0,
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const url = `${NPI_PROXY}?number=${encodeURIComponent(npi)}`;
    const res = await fetch(url, { signal: controller.signal, cache: "no-store" });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return {
        source: "NPI Registry (cms.hhs.gov)",
        isLive: true,
        found: false,
        status: "Unknown",
        rawError: `HTTP ${res.status}`,
        latencyMs: Date.now() - startedAt,
      };
    }

    const json = (await res.json()) as {
      result_count?: number;
      results?: Array<{
        number: string;
        basic?: { organization_name?: string; status?: string };
        taxonomies?: Array<{ desc?: string }>;
      }>;
    };

    if (!json.result_count || !json.results?.length) {
      return {
        source: "NPI Registry (cms.hhs.gov)",
        isLive: true,
        found: false,
        latencyMs: Date.now() - startedAt,
      };
    }

    const r = json.results[0];
    const statusRaw = r.basic?.status?.toUpperCase() ?? "";
    const status: NpiRegistryResponse["status"] =
      statusRaw === "A" || statusRaw === "ACTIVE"
        ? "Active"
        : statusRaw === "D"
        ? "Deactivated"
        : "Unknown";

    return {
      source: "NPI Registry (cms.hhs.gov)",
      isLive: true,
      found: true,
      npi: r.number,
      organizationName: r.basic?.organization_name,
      taxonomy: r.taxonomies?.[0]?.desc,
      status,
      latencyMs: Date.now() - startedAt,
    };
  } catch (err) {
    clearTimeout(timeoutId);
    return {
      source: "NPI Registry (cms.hhs.gov)",
      isLive: false,
      found: false,
      status: "Unknown",
      rawError: err instanceof Error ? err.message : "network error",
      latencyMs: Date.now() - startedAt,
    };
  }
}
