import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { LegalDisclaimerDialog } from "@/components/LegalDisclaimerDialog";

const defaultProps = {
  open: true,
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
  action: "agree" as string,
};

describe("LegalDisclaimerDialog", () => {
  it("open={false}: dialog role not in document", () => {
    render(<LegalDisclaimerDialog {...defaultProps} open={false} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("open={true}: dialog role in document", () => {
    render(<LegalDisclaimerDialog {...defaultProps} open={true} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it('action="agree": contains title about accepting/confirming', () => {
    render(<LegalDisclaimerDialog {...defaultProps} action="agree" />);
    expect(screen.getByText(/Confirm Determination/)).toBeInTheDocument();
  });

  it('action="disagree": contains "Override Automated Determination"', () => {
    render(<LegalDisclaimerDialog {...defaultProps} action="disagree" />);
    expect(screen.getByText("Override Automated Determination")).toBeInTheDocument();
  });

  it('action="block": contains "Payment Authorization Hold"', () => {
    render(<LegalDisclaimerDialog {...defaultProps} action="block" />);
    expect(screen.getByText(/Payment Authorization Hold/)).toBeInTheDocument();
  });

  it('unknown action (e.g. "unknown"): falls back to agree config', () => {
    render(<LegalDisclaimerDialog {...defaultProps} action="unknown" />);
    expect(screen.getByText(/Confirm Determination/)).toBeInTheDocument();
  });

  it("confirm button is disabled when checkbox unchecked", () => {
    render(<LegalDisclaimerDialog {...defaultProps} />);
    const confirmBtn = screen.getByRole("button", { name: /Confirm/i });
    expect(confirmBtn).toBeDisabled();
  });

  it("after clicking checkbox, confirm button is enabled", async () => {
    const user = userEvent.setup();
    render(<LegalDisclaimerDialog {...defaultProps} />);
    const checkbox = screen.getByRole("checkbox");
    await user.click(checkbox);
    const confirmBtn = screen.getByRole("button", { name: /Confirm/i });
    expect(confirmBtn).toBeEnabled();
  });

  it('itemCode="STE-4821-A" appears in dialog text', () => {
    render(<LegalDisclaimerDialog {...defaultProps} itemCode="STE-4821-A" />);
    expect(screen.getByText(/STE-4821-A/)).toBeInTheDocument();
  });

  it('invoiceNumber="STC-2026" appears in dialog text', () => {
    render(<LegalDisclaimerDialog {...defaultProps} invoiceNumber="STC-2026" />);
    expect(screen.getByText(/STC-2026/)).toBeInTheDocument();
  });

  it("clicking cancel calls onCancel", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<LegalDisclaimerDialog {...defaultProps} onCancel={onCancel} />);
    const cancelBtn = screen.getByRole("button", { name: /Cancel/i });
    await user.click(cancelBtn);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("clicking confirm (after checkbox) calls onConfirm", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<LegalDisclaimerDialog {...defaultProps} onConfirm={onConfirm} />);
    const checkbox = screen.getByRole("checkbox");
    await user.click(checkbox);
    const confirmBtn = screen.getByRole("button", { name: /Confirm/i });
    await user.click(confirmBtn);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('"View Policy Document" link has href="/documents/policies/exception-review-policy.html"', () => {
    render(<LegalDisclaimerDialog {...defaultProps} />);
    const link = screen.getByRole("link", { name: /View Policy Document/i });
    expect(link).toHaveAttribute("href", "/documents/policies/exception-review-policy.html");
  });

  it.each([
    ["agree", "Confirm Determination"],
    ["disagree", "Override Automated Determination"],
    ["block", "Confirm Payment Authorization Hold"],
    ["recover", "Initiate Recovery Process"],
    ["escalate", "Escalation Confirmation"],
    ["dismiss", "Dismiss Exception"],
    ["approve", "Approve Order for Fulfillment"],
    ["hold", "Place Order on Hold"],
    ["report", "Report to Compliance"],
    ["verify", "Request Vendor Verification"],
  ] as const)("action=%s has distinct title: %s", (action, expectedTitle) => {
    render(
      <LegalDisclaimerDialog {...defaultProps} action={action} />
    );
    expect(screen.getByText(expectedTitle, { exact: false })).toBeInTheDocument();
  });
});
