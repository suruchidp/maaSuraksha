import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AssessmentResult } from "@/components/ml/AssessmentResult";

describe("AssessmentResult", () => {
  it("shows the real risk level, score and recommendations when the model completed", () => {
    render(
      <AssessmentResult
        title="Maternal Risk Assessment"
        status="completed"
        riskLevel="high"
        riskScore={0.75}
        recommendations={["Increase protein intake", "Schedule a follow-up visit"]}
        modelVersion="1.0.0"
      />
    );

    expect(screen.getByText("high")).toBeInTheDocument();
    expect(screen.getByText(/75%/)).toBeInTheDocument();
    expect(screen.getByText("Increase protein intake")).toBeInTheDocument();
    expect(screen.getByText("Schedule a follow-up visit")).toBeInTheDocument();
    expect(screen.getByText(/Model: 1\.0\.0/)).toBeInTheDocument();
  });

  it("does not fabricate a risk level when the model is unavailable", () => {
    render(<AssessmentResult title="Maternal Risk Assessment" status="unavailable" />);

    expect(
      screen.getByText("The assessment service is not reachable. No risk result is shown.")
    ).toBeInTheDocument();
    expect(screen.queryByText(/Risk level/)).not.toBeInTheDocument();
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  it("shows the model-provided message when unavailable", () => {
    render(
      <AssessmentResult title="GDM Risk" status="unavailable" message="Model service is down for maintenance" />
    );
    expect(screen.getByText("Model service is down for maintenance")).toBeInTheDocument();
  });

  it("shows a pending message without any risk result while processing", () => {
    render(<AssessmentResult title="GDM Risk" status="pending" message="Assessment in progress" />);
    expect(screen.getByText("Assessment in progress")).toBeInTheDocument();
    expect(screen.queryByText(/Risk level/)).not.toBeInTheDocument();
  });

  it("always shows the non-diagnosis disclaimer", () => {
    render(<AssessmentResult title="PPD Screening" status="completed" riskLevel="low" riskScore={0.1} />);
    expect(screen.getByText(/not a medical diagnosis/i)).toBeInTheDocument();
  });
});