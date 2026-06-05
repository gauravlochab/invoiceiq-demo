// [Spec: rules/ui-standard.md#Agent Color Extension]
// Maps vivid agent CSS variable strings to their pre-defined subtle (tinted bg) counterparts.
// The --agent-*-subtle tokens use OKLCH with built-in alpha (12% light, 20% dark)
// and are defined in globals.css alongside the vivid --agent-* tokens.

const SUBTLE_MAP: Record<string, string> = {
  "var(--agent-invoice)": "var(--agent-invoice-subtle)",
  "var(--agent-validation)": "var(--agent-validation-subtle)",
  "var(--agent-compliance)": "var(--agent-compliance-subtle)",
  "var(--agent-recovery)": "var(--agent-recovery-subtle)",
  "var(--agent-insight)": "var(--agent-insight-subtle)",
};

/**
 * Given a vivid agent color CSS variable string (e.g. "var(--agent-invoice)"),
 * returns the matching subtle/tinted variant for backgrounds.
 * Falls back to the input if no mapping exists.
 */
export function getAgentSubtleColor(color: string): string {
  return SUBTLE_MAP[color] ?? color;
}
