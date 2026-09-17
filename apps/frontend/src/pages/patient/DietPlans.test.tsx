import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DietPlansPage from "./DietPlans";
import type { DietGuidanceDTO, DietPlanDTO } from "@/lib/types";

const mocks = vi.hoisted(() => ({
  useDietGuidance: vi.fn(),
  useDietPlans: vi.fn(),
  useUpdateDietGuidancePreferences: vi.fn(),
}));

vi.mock("@/hooks/queries", () => ({
  useDietGuidance: (...args: unknown[]) => mocks.useDietGuidance(...args),
  useDietPlans: (...args: unknown[]) => mocks.useDietPlans(...args),
  useUpdateDietGuidancePreferences: (...args: unknown[]) =>
    mocks.useUpdateDietGuidancePreferences(...args),
}));

const stageGuidance: DietGuidanceDTO = {
  id: "dg1",
  user: "u1",
  sourceType: "SYSTEM",
  templateKey: "stage-trimester-1",
  dedupeKey: "stage-trimester-1:base",
  intent: "stage",
  contentVersion: "diet-v1",
  priority: "low",
  title: "First-trimester nutrition",
  titleLocalized: {
    en: "First-trimester nutrition",
    hi: "पहली तिमाही के लिए आहार",
    kn: "ಮೊದಲ ತ್ರೈಮಾಸಿಕ ಆಹಾರ",
  },
  sections: [
    {
      key: "guidance",
      heading: { en: "Guidance", hi: "मार्गदर्शन", kn: "ಮಾರ್ಗದರ್ಶನ" },
      body: {
        en: "In the first trimester your body is adjusting to pregnancy.",
        hi: "पहली तिमाही में शरीर ढल रहा है।",
        kn: "ಮೊದಲ ತ್ರೈಮಾಸಿಕದಲ್ಲಿ ದೇಹ ಹೊಂದಿಕೊಳ್ಳುತ್ತಿದೆ.",
      },
      bullets: [
        {
          en: "Try small, frequent meals.",
          hi: "छोटे, बार-बार भोजन लें।",
          kn: "ಸಣ್ಣ, ಆಗಾಗ್ಗೆ ಊಟ ಮಾಡಿ.",
        },
      ],
    },
  ],
  rationale: "Based on your pregnancy profile (trimester 1).",
  rationaleLocalized: {
    en: "Based on your pregnancy profile (trimester 1).",
    hi: "आपके गर्भावस्था प्रोफ़ाइल पर आधारित।",
    kn: "ನಿಮ್ಮ ಗರ್ಭಧಾರಣೆ ಪ್ರೊಫೈಲ್ ಆಧರಿಸಿ.",
  },
  disclaimer:
    "This diet guidance is educational decision support only - it is not a prescription.",
  disclaimerLocalized: {
    en: "This diet guidance is educational decision support only - it is not a prescription.",
    hi: "यह आहार मार्गदर्शन केवल शैक्षिक सहायता है।",
    kn: "ಈ ಆಹಾರ ಮಾರ್ಗದರ್ಶನವು ಕೇವಲ ಶೈಕ್ಷಣಿಕ ಬೆಂಬಲ.",
  },
  attribution: [
    {
      id: "icmr-dgi-2024",
      title: "ICMR-NIN Dietary Guidelines for Indians 2024",
      url: "https://nin.res.in/dietaryguidelines/",
    },
  ],
  references: [],
  createdAt: "2026-09-01T10:00:00.000Z",
  updatedAt: "2026-09-01T10:00:00.000Z",
};

const mealsGuidance: DietGuidanceDTO = {
  ...stageGuidance,
  id: "dg2",
  templateKey: "meals-vegetarian-other",
  intent: "meals",
  title: "Vegetarian meal ideas",
  titleLocalized: {
    en: "Vegetarian meal ideas",
    hi: "शाकाहारी भोजन के विचार",
    kn: "ಸಸ್ಯಾಹಾರಿ ಊಟದ ಆಲೋಚನೆಗಳು",
  },
  sections: [
    {
      key: "meals.breakfast",
      heading: { en: "Breakfast", hi: "नाश्ता", kn: "ಉಪಹಾರ" },
      bullets: [
        {
          en: "Whole-grain porridge or upma with a glass of milk",
          hi: "साबुत अनाज दलिया या उपमा दूध के साथ",
          kn: "ಧಾನ್ಯ ಗಂಜಿ ಅಥವಾ ಉಪ್ಪಿಟ್ಟು ಹಾಲಿನೊಂದಿಗೆ",
        },
      ],
    },
  ],
  rationale: "Based on your diet preferences are not set yet.",
  rationaleLocalized: {
    en: "Based on your diet preferences are not set yet.",
    hi: "आपकी आहार प्राथमिकताएँ अभी निर्धारित नहीं हैं।",
    kn: "ನಿಮ್ಮ ಆಹಾರ ಆದ್ಯತೆಗಳನ್ನು ಇನ್ನೂ ಹೊಂದಿಸಿಲ್ಲ.",
  },
};

const carePlan: DietPlanDTO = {
  id: "p1",
  user: "u1",
  title: "Extra protein plan",
  description: "Add dal and paneer daily.",
  meals: [{ name: "Lunch", items: ["protein"], notes: "" }],
  nutritionalNotes: "",
  disclaimer: "",
  createdBy: "u1",
  createdAt: "2026-08-30T10:00:00.000Z",
  updatedAt: "2026-08-30T10:00:00.000Z",
};

function guidanceData(guidance: DietGuidanceDTO[], preferences: unknown = null) {
  return {
    data: { guidance, preferences },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  };
}

function plansData(plans: DietPlanDTO[]) {
  return {
    data: { items: plans, total: plans.length },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  };
}

describe("DietPlansPage", () => {
  beforeEach(() => {
    mocks.useDietGuidance.mockReset();
    mocks.useDietPlans.mockReset();
    mocks.useUpdateDietGuidancePreferences.mockReset();
    mocks.useDietGuidance.mockReturnValue(guidanceData([stageGuidance, mealsGuidance]));
    mocks.useDietPlans.mockReturnValue(plansData([carePlan]));
    mocks.useUpdateDietGuidancePreferences.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
  });

  it("renders generated guidance cards with localized content, reason, sources and disclaimer", () => {
    render(<DietPlansPage />);

    expect(screen.getByText("First-trimester nutrition")).toBeInTheDocument();
    expect(
      screen.getByText("In the first trimester your body is adjusting to pregnancy.")
    ).toBeInTheDocument();
    expect(screen.getByText(/Try small, frequent meals/)).toBeInTheDocument();
    expect(screen.getAllByText(/Why am I seeing this/)).toHaveLength(2);
    expect(
      screen.getByText(/Based on your pregnancy profile/)
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Sources:/)).toHaveLength(2);
    expect(screen.getAllByText("ICMR-NIN Dietary Guidelines for Indians 2024").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/educational decision support only/)).toHaveLength(2);
    expect(screen.getAllByText("Auto-generated")).toHaveLength(2);
    expect(screen.getByText("Vegetarian meal ideas")).toBeInTheDocument();
    expect(screen.getByText("Breakfast")).toBeInTheDocument();
    expect(
      screen.getByText(/Whole-grain porridge or upma/)
    ).toBeInTheDocument();
  });

  it("renders the care-team diet plans section alongside the generated cards", () => {
    render(<DietPlansPage />);

    expect(screen.getByText("Plans from your care team")).toBeInTheDocument();
    expect(screen.getByText("Extra protein plan")).toBeInTheDocument();
    expect(screen.getByText("Add dal and paneer daily.")).toBeInTheDocument();
    expect(screen.getByText(/Protein rich/)).toBeInTheDocument();
  });

  it("saves food preferences through the form", async () => {
    const user = userEvent.setup();
    const mutate = vi.fn();
    mocks.useUpdateDietGuidancePreferences.mockReturnValue({
      mutate,
      isPending: false,
    });
    render(<DietPlansPage />);

    await user.selectOptions(screen.getByLabelText("Region (optional)"), "north");
    await user.click(screen.getByRole("button", { name: "Save preferences" }));

    expect(mutate.mock.calls[0][0]).toEqual({
      mealPreference: "vegetarian",
      region: "north",
    });
  });

  it("shows the empty state when no guidance exists yet", () => {
    mocks.useDietGuidance.mockReturnValue(guidanceData([]));
    mocks.useDietPlans.mockReturnValue(plansData([]));
    render(<DietPlansPage />);

    expect(screen.getAllByText("No diet plans yet")).toHaveLength(2);
    expect(screen.queryByText("First-trimester nutrition")).not.toBeInTheDocument();
  });
});