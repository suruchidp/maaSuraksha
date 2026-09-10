import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import i18n from "@/i18n";
import LanguageSwitcher from "@/components/LanguageSwitcher";

describe("LanguageSwitcher", () => {
  beforeEach(async () => {
    localStorage.clear();
    await i18n.changeLanguage("en");
  });

  it("shows the three supported languages", () => {
    render(<LanguageSwitcher />);
    expect(screen.getByRole("button", { name: "English" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "हिन्दी" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ಕನ್ನಡ" })).toBeInTheDocument();
  });

  it("switches to Hindi, persists the choice and updates document lang", async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher />);

    await user.click(screen.getByRole("button", { name: "हिन्दी" }));

    expect(i18n.resolvedLanguage).toBe("hi");
    expect(document.documentElement.lang).toBe("hi");
    expect(localStorage.getItem("i18nextLng")).toBe("hi");
    expect(screen.getByRole("button", { name: "हिन्दी" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "English" })).toHaveAttribute("aria-pressed", "false");
  });

  it("switches to Kannada and back to English", async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher />);

    await user.click(screen.getByRole("button", { name: "ಕನ್ನಡ" }));
    expect(i18n.resolvedLanguage).toBe("kn");
    expect(document.documentElement.lang).toBe("kn");

    await user.click(screen.getByRole("button", { name: "English" }));
    expect(i18n.resolvedLanguage).toBe("en");
    expect(document.documentElement.lang).toBe("en");
  });
});