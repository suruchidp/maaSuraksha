import { describe, it, expect, vi, beforeEach } from "vitest";

const mockHttpList = vi.fn();

vi.mock("@/lib/api", () => ({
  httpList: mockHttpList,
}));

describe("listAccessiblePatients", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the patient list exactly as the API provides it (no fabricated patients)", async () => {
    const serverItems = [
      { id: "p-101", name: "Anita Verma", email: "anita@example.com", role: "PATIENT", language: "en", isActive: true, createdAt: "2026-09-01T00:00:00.000Z", updatedAt: "2026-09-19T00:00:00.000Z" },
    ];
    mockHttpList.mockResolvedValue({
      items: serverItems,
      total: 1,
      totalPages: 1,
      page: 1,
      limit: 20,
    });

    const { listAccessiblePatients } = await import("./patients");
    const result = await listAccessiblePatients({ limit: 20 });

    expect(result.items).toEqual(serverItems);
    expect(result.total).toBe(1);
    expect(result.totalPages).toBe(1);
  });

  it("forwards query params to the API unchanged", async () => {
    mockHttpList.mockResolvedValue({
      items: [],
      total: 0,
      totalPages: 0,
      page: 1,
      limit: 20,
    });

    const { listAccessiblePatients } = await import("./patients");
    await listAccessiblePatients({ search: "meera", limit: 5 });

    expect(mockHttpList).toHaveBeenCalledWith("/patients", { search: "meera", limit: 5 });
  });
});