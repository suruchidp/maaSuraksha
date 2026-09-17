import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RecommendationsPage from "./Recommendations";
import type { RecommendationDTO } from "@/lib/types";

const mocks = vi.hoisted(() => ({
  useRecommendations: vi.fn(),
  useMarkRecommendationRead: vi.fn(),
}));

vi.mock("@/hooks/queries", () => ({
  useRecommendations: (...args: unknown[]) => mocks.useRecommendations(...args),
  useMarkRecommendationRead: (...args: unknown[]) => mocks.useMarkRecommendationRead(...args),
}));

const systemRec: RecommendationDTO = {
  id: "r1",
  user: "u1",
  category: "warning",
  title: "High maternal risk - seek medical review",
  content: "Your completed maternal risk assessment recorded high risk.",
  priority: "high",
  isPersonalized: true,
  source: "MaaSuraksha engine v1",
  isRead: false,
  sourceType: "SYSTEM",
  templateKey: "maternal-risk-high",
  titleLocalized: {
    en: "High maternal risk - seek medical review",
    hi: "उच्च मातृ जोखिम - चिकित्सकीय समीक्षा कराएं",
    kn: "ಹೆಚ್ಚಿನ ತಾಯಿಯ ಅಪಾಯ - ವೈದ್ಯಕೀಯ ಪರಿಶೀಲನೆ",
  },
  contentLocalized: {
    en: "Your completed maternal risk assessment recorded high risk.",
    hi: "आपके पूर्ण मातृ जोखिम मूल्यांकन में उच्च जोखिम दर्ज हुआ।",
    kn: "ನಿಮ್ಮ ಪೂರ್ಣಗೊಂಡ ತಾಯಿಯ ಅಪಾಯ ಮೌಲ್ಯಮಾಪನದಲ್ಲಿ ಹೆಚ್ಚಿನ ಅಪಾಯ.",
  },
  reasonLocalized: {
    en: "Generated from your completed maternal risk assessment, recorded as high risk.",
    hi: "आपके पूर्ण मातृ जोखिम मूल्यांकन से तैयार, जिसमें उच्च जोखिम दर्ज हुआ।",
    kn: "ನಿಮ್ಮ ಪೂರ್ಣಗೊಂಡ ತಾಯಿಯ ಅಪಾಯ ಮೌಲ್ಯಮಾಪನದಿಂದ ರಚಿಸಲಾಗಿದೆ.",
  },
  references: [
    { assessmentId: "a1", assessmentType: "maternal", modelVersion: "v1-test" },
  ],
  createdAt: "2026-09-01T10:00:00.000Z",
  updatedAt: "2026-09-01T10:00:00.000Z",
};

const careTeamRec: RecommendationDTO = {
  id: "r2",
  user: "u1",
  category: "nutrition",
  title: "Include iron-rich foods in meals",
  content: "Your care team suggests adding iron-rich foods to your diet.",
  priority: "medium",
  isPersonalized: true,
  isRead: true,
  sourceType: "CARE_TEAM",
  createdAt: "2026-08-30T10:00:00.000Z",
  updatedAt: "2026-08-30T10:00:00.000Z",
};

function listing(items: RecommendationDTO[]) {
  return {
    data: { items, total: items.length },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  };
}

describe("RecommendationsPage", () => {
  beforeEach(() => {
    mocks.useRecommendations.mockReset();
    mocks.useMarkRecommendationRead.mockReset();
    mocks.useMarkRecommendationRead.mockReturnValue({ mutate: vi.fn(), isPending: false });
  });

  it("shows a localized system recommendation with its source badge and reason", () => {
    mocks.useRecommendations.mockReturnValue(listing([systemRec, careTeamRec]));
    render(<RecommendationsPage />);

    expect(screen.getByText("High maternal risk - seek medical review")).toBeInTheDocument();
    expect(screen.getByText("Your completed maternal risk assessment recorded high risk.")).toBeInTheDocument();
    expect(
      screen.getByText(/Generated from your completed maternal risk assessment/)
    ).toBeInTheDocument();
    expect(screen.getByText("System")).toBeInTheDocument();
    expect(screen.getByText("Care team")).toBeInTheDocument();
    expect(screen.getByText(/MaaSuraksha engine v1/)).toBeInTheDocument();
  });

  it("uses the localized title when the current language is not English", () => {
    const hiRec = {
      ...systemRec,
      titleLocalized: {
        en: "High maternal risk - seek medical review",
        hi: "उच्च मातृ जोखिम - चिकित्सकीय समीक्षा कराएं",
      },
      reasonLocalized: {
        en: "reason-en",
        hi: "आपके पूर्ण मातृ जोखिम मूल्यांकन से तैयार",
      },
      contentLocalized: { en: "content-en", hi: "आपके पूर्ण मातृ जोखिम में उच्च जोखिम दर्ज हुआ।" },
    };
    mocks.useRecommendations.mockReturnValue(listing([hiRec]));
    render(<RecommendationsPage />);
    // useCurrentLanguage defaults to EN in the test environment.
    expect(screen.getByText("High maternal risk - seek medical review")).toBeInTheDocument();
  });

  it("falls back to the plain title and content when no localized variant exists", () => {
    mocks.useRecommendations.mockReturnValue(listing([careTeamRec]));
    render(<RecommendationsPage />);

    expect(screen.getByText("Include iron-rich foods in meals")).toBeInTheDocument();
    expect(screen.getByText("Your care team suggests adding iron-rich foods to your diet.")).toBeInTheDocument();
    expect(screen.queryByText(/Why this is shown/)).not.toBeInTheDocument();
  });

  it("shows the empty state when there are no recommendations", () => {
    mocks.useRecommendations.mockReturnValue(listing([]));
    render(<RecommendationsPage />);

    expect(screen.getByText("No recommendations yet")).toBeInTheDocument();
    expect(
      screen.getByText(/System guidance appears after a screening or reading is completed/)
    ).toBeInTheDocument();
  });

  it("marks an unread recommendation as read", async () => {
    const user = userEvent.setup();
    const mutate = vi.fn();
    mocks.useMarkRecommendationRead.mockReturnValue({ mutate, isPending: false });
    mocks.useRecommendations.mockReturnValue(listing([systemRec]));
    render(<RecommendationsPage />);

    await user.click(screen.getByRole("button", { name: "Mark as read" }));
    expect(mutate).toHaveBeenCalledWith({ id: "r1", read: true });
  });
});