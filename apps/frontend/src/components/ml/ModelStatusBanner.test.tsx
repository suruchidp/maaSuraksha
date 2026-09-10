import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ModelStatusBanner } from "@/components/ml/ModelStatusBanner";

describe("ModelStatusBanner", () => {
  it("shows an honest unavailable banner and never claims a result", () => {
    render(<ModelStatusBanner status="unavailable" message="ml-service offline" />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("Risk model temporarily unavailable")).toBeInTheDocument();
    expect(screen.getByText(/No result was generated/)).toBeInTheDocument();
    expect(screen.getByText("ml-service offline")).toBeInTheDocument();
  });

  it("shows a pending banner without availability claims", () => {
    render(<ModelStatusBanner status="pending" />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("Risk model temporarily unavailable")).toBeInTheDocument();
  });

  it("renders nothing for a completed result without a message", () => {
    const { container } = render(<ModelStatusBanner status="completed" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the completed message with the model version", () => {
    render(<ModelStatusBanner status="completed" message="Analysis complete" modelVersion="2.1.0" />);
    expect(screen.getByText("Analysis complete")).toBeInTheDocument();
    expect(screen.getByText(/Model: 2\.1\.0/)).toBeInTheDocument();
  });
});