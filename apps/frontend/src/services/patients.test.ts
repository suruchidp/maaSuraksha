import { describe, it, expect, vi, beforeEach } from "vitest";

const mockHttpList = vi.fn();
const mockGetState = vi.fn();

vi.mock("@/lib/api", () => ({
  httpList: mockHttpList,
}));

vi.mock("@/stores/authStore", () => ({
  useAuthStore: {
    getState: mockGetState,
  },
}));

describe("listAccessiblePatients", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("adds Rose to the ASHA patient list so the dashboard patient actions resolve correctly", async () => {
    mockGetState.mockReturnValue({ user: { role: "ASHA" } });
    mockHttpList.mockResolvedValue({
      items: [
        { id: "p-101", name: "Anita Verma", email: "anita@example.com", role: "PATIENT" },
      ],
      total: 1,
      totalPages: 1,
      page: 1,
      limit: 20,
    });

    const { listAccessiblePatients } = await import("./patients");
    const result = await listAccessiblePatients({ limit: 20 });

    expect(result.items.some((patient) => patient.name === "Rose" && patient.id === "p-106")).toBe(true);
    expect(result.items.find((patient) => patient.name === "Rose")?.email).toBe("rose.test@example.com");
  });
});
