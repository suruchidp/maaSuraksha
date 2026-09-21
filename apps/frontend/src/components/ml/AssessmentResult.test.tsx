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

  it("GDM screening positive: headline, dynamic score, threshold, explanation and disclaimer replace the numeric score as the primary result", () => {
    render(
      <AssessmentResult
        title="GDM Risk Assessment Result"
        status="completed"
        riskLevel="high"
        riskScore={0.75}
        screening={{ positive: true, score: 0.75, threshold: 0.05 }}
      />
    );

    expect(screen.getByText("High Risk / Screening Positive")).toBeInTheDocument();
    expect(screen.getByText(/Model screening score/)).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeInTheDocument();
    expect(screen.getByText(/Screening threshold/)).toBeInTheDocument();
    expect(screen.getByText("5%")).toBeInTheDocument();
    expect(screen.getByText(/above the screening threshold/)).toBeInTheDocument();
    expect(
      screen.getByText(/not a diagnosis and it is not a literal individualized medical probability/)
    ).toBeInTheDocument();
    expect(screen.queryByText("Risk level")).not.toBeInTheDocument();
    expect(screen.queryByText("high")).not.toBeInTheDocument();
  });

  it("GDM screening negative: headline and below-threshold explanation", () => {
    render(
      <AssessmentResult
        title="GDM Risk Assessment Result"
        status="completed"
        riskLevel="low"
        riskScore={0.02}
        screening={{ positive: false, score: 0.02, threshold: 0.05 }}
      />
    );

    expect(screen.getByText("Screening Negative")).toBeInTheDocument();
    expect(screen.getByText(/at or below the screening threshold/)).toBeInTheDocument();
    expect(screen.queryByText("Screening Positive")).not.toBeInTheDocument();
  });

  it("GDM screening without known model metadata: shows the score but not a threshold", () => {
    render(
      <AssessmentResult
        title="GDM Risk Assessment Result"
        status="completed"
        riskLevel="high"
        riskScore={0.87}
        screening={{ positive: true, score: 0.87 }}
      />
    );

    expect(screen.getByText("High Risk / Screening Positive")).toBeInTheDocument();
    expect(screen.getByText(/Model screening score/)).toBeInTheDocument();
    expect(screen.getByText("87%")).toBeInTheDocument();
    expect(screen.queryByText(/Screening threshold/)).not.toBeInTheDocument();
    expect(screen.queryByText(/above the screening threshold/)).not.toBeInTheDocument();
  });
});