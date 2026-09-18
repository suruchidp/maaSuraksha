import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SymptomsPage from "./Symptoms";
const mocks = vi.hoisted(() => ({ query: vi.fn(), mutate: vi.fn() }));
vi.mock("@/hooks/queries", () => ({ useSymptoms: mocks.query, useCreateSymptom: () => ({ mutate: mocks.mutate }) }));
vi.mock("@/hooks/useAuth", () => ({ useCurrentLanguage: () => "en" }));
beforeEach(() => { vi.clearAllMocks(); mocks.query.mockReturnValue({ data: { items: [], totalPages: 2 }, refetch: vi.fn() }); });
describe("Symptoms", () => {
 it("shows urgent guidance before submitting a red flag", async () => {
  render(<SymptomsPage />);
  await userEvent.click(screen.getByRole("button", { name: "Vaginal bleeding" }));
  expect(screen.getByRole("alert")).toHaveTextContent("immediately");
  expect(mocks.mutate).not.toHaveBeenCalled();
 });
 it("submits tracking fields and keeps warning guidance after successful save", async () => {
  mocks.mutate.mockImplementation((_input, options) => options.onSuccess({ triage: "urgent" }));
  render(<SymptomsPage />);
  await userEvent.click(screen.getByRole("button", { name: "Chest pain" }));
  await userEvent.type(screen.getByLabelText("Duration (hours)"), "2");
  await userEvent.selectOptions(screen.getByLabelText("Frequency"), "constant");
  await userEvent.click(screen.getByRole("button", { name: "Submit report" }));
  await waitFor(() => expect(mocks.mutate).toHaveBeenCalledWith(expect.objectContaining({ input: expect.objectContaining({ symptoms: ["chest_pain"], durationHours: 2, frequency: "constant" }) }), expect.any(Object)));
  expect(screen.getByRole("alert")).toHaveTextContent("immediately");
 });
 it("allows logging with optional tracking fields empty", async () => {
  render(<SymptomsPage />);
  await userEvent.click(screen.getByRole("button", { name: "Nausea" }));
  await userEvent.click(screen.getByRole("button", { name: "Submit report" }));
  await waitFor(() => expect(mocks.mutate).toHaveBeenCalled());
 });
 it("paginates history and resets page when filtering severity", async () => {
  render(<SymptomsPage />);
  await userEvent.click(screen.getByRole("button", { name: "Next" }));
  expect(mocks.query).toHaveBeenLastCalledWith(undefined, 20, 2, undefined);
  await userEvent.selectOptions(screen.getByLabelText("Filter by severity"), "severe");
  expect(mocks.query).toHaveBeenLastCalledWith(undefined, 20, 1, "severe");
 });
});

