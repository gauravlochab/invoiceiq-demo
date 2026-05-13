import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PostDisagreeSteps } from "@/components/WorkflowSteps";

describe("PostDisagreeSteps (WorkflowSteps)", () => {
  it("renders 3 step items", () => {
    render(<PostDisagreeSteps />);
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it('steps numbered "1", "2", "3"', () => {
    render(<PostDisagreeSteps />);
    const numbers = ["1", "2", "3"];
    numbers.forEach((n) => {
      expect(screen.getByText(n)).toBeInTheDocument();
    });
  });

  it('step 1 text: "Compliance Review"', () => {
    render(<PostDisagreeSteps />);
    expect(screen.getByText("Compliance Review")).toBeInTheDocument();
  });

  it('shows "Compliance Team" assignee', () => {
    render(<PostDisagreeSteps />);
    expect(screen.getByText(/Compliance Team/)).toBeInTheDocument();
  });

  it('shows "2 business days" SLA', () => {
    render(<PostDisagreeSteps />);
    expect(screen.getByText(/2 business days/)).toBeInTheDocument();
  });

  it('step 2: "Incident Report Generation"', () => {
    render(<PostDisagreeSteps />);
    expect(screen.getByText("Incident Report Generation")).toBeInTheDocument();
  });

  it('contains header "Post-Override Workflow"', () => {
    render(<PostDisagreeSteps />);
    expect(screen.getByText("Post-Override Workflow")).toBeInTheDocument();
  });
});
