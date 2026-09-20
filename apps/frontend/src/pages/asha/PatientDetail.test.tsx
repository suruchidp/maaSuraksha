import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ASHAPatientDetailPage from "./PatientDetail";

const mocks = vi.hoisted(() => ({
  usePatients: vi.fn(),
  usePregnancy: vi.fn(),
  useHealthMetrics: vi.fn(),
  useSymptoms: vi.fn(),
  useAlerts: vi.fn(),
  useUpdateAlertStatus: vi.fn(),
  useReferrals: vi.fn(),
  useAppointments: vi.fn(),
  useReports: vi.fn(),
  useMaternalRiskHistory: vi.fn(),
  useGDMHistory: vi.fn(),
  usePPDHistory: vi.fn(),
  useCreateHealthMetric: vi.fn(),
  useCreateAlert: vi.fn(),
  useCreateReferral: vi.fn(),
  useCreateAppointment: vi.fn(),
  useCurrentLanguage: vi.fn(),
  useAuthStore: vi.fn(),
  useToastStore: vi.fn(),
}));

vi.mock("@/hooks/queries", () => ({
  usePatients: (...a: unknown[]) => mocks.usePatients(...a),
  usePregnancy: (...a: unknown[]) => mocks.usePregnancy(...a),
  useHealthMetrics: (...a: unknown[]) => mocks.useHealthMetrics(...a),
  useSymptoms: (...a: unknown[]) => mocks.useSymptoms(...a),
  useAlerts: (...a: unknown[]) => mocks.useAlerts(...a),
  useUpdateAlertStatus: (...a: unknown[]) => mocks.useUpdateAlertStatus(...a),
  useReferrals: (...a: unknown[]) => mocks.useReferrals(...a),
  useAppointments: (...a: unknown[]) => mocks.useAppointments(...a),
  useReports: (...a: unknown[]) => mocks.useReports(...a),
  useMaternalRiskHistory: (...a: unknown[]) => mocks.useMaternalRiskHistory(...a),
  useGDMHistory: (...a: unknown[]) => mocks.useGDMHistory(...a),
  usePPDHistory: (...a: unknown[]) => mocks.usePPDHistory(...a),
  useCreateHealthMetric: (...a: unknown[]) => mocks.useCreateHealthMetric(...a),
  useCreateAlert: (...a: unknown[]) => mocks.useCreateAlert(...a),
  useCreateReferral: (...a: unknown[]) => mocks.useCreateReferral(...a),
  useCreateAppointment: (...a: unknown[]) => mocks.useCreateAppointment(...a),
}));

vi.mock("@/hooks/useAuth", () => ({
  useCurrentLanguage: (...a: unknown[]) => mocks.useCurrentLanguage(...a),
}));

vi.mock("@/stores/authStore", () => ({
  useAuthStore: (selector: unknown) => mocks.useAuthStore(selector),
}));

vi.mock("@/stores/toastStore", () => ({
  useToastStore: (selector: unknown) => mocks.useToastStore(selector),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      const labels: Record<string, string> = {
        "caregiver.pregnancy": "Pregnancy",
        "caregiver.latestMetrics": "Latest Vitals",
        "caregiver.recentAlerts": "Recent Alerts",
        "caregiver.healthHistory": "Health History",
        "caregiver.symptoms": "Symptoms",
        "caregiver.assessments": "Assessments",
        "caregiver.reports": "Reports",
        "caregiver.appointments": "Appointments",
        "caregiver.referrals": "Referrals",
        "caregiver.maternalRisk": "Maternal Risk",
        "caregiver.gdmScreening": "GDM Screening",
        "caregiver.ppdScreening": "PPD Screening",
        "caregiver.screeningFollowUp": "Results are screening outputs, not a diagnosis. Follow up where recommended.",
        "assessments.subtitle": "Risk assessments generate recommendations and never provide a diagnosis.",
        "status.risk.high": "High",
        "status.risk.medium": "Medium",
        "status.risk.moderate": "Moderate",
        "status.assessment.completed": "completed",
        "asha.quickActions": "Record & actions",
        "asha.recordMetric": "Record Health Metric",
        "asha.backToPatients": "Back to patients",
        "asha.refer": "Refer to Doctor",
        "appointments.bookTitle": "Book an Appointment",
        "doctor.runAssessments": "Run Risk Assessments",
        "doctor.quickActions": "Add recommendations & manage referrals",
        "common.hide": "Hide",
        "common.save": "Save",
        "common.noData": "No data",
        "metrics.date": "Date",
        "metrics.bp": "Blood Pressure",
        "metrics.weight": "Weight",
        "metrics.glucose": "Glucose",
        "metrics.heartRate": "Heart Rate",
        "metrics.temperature": "Temperature",
        "metrics.hemoglobin": "Hemoglobin",
        "metrics.none": "No metrics recorded yet",
        "pregnancy.gestationalWeek": "Gestational Week",
        "pregnancy.weeks": "weeks",
        "pregnancy.trimester": "Trimester",
        "pregnancy.lmp": "Last Menstrual Period",
        "pregnancy.dueDate": "Due Date",
        "pregnancy.riskStatus": "Risk Status",
        "pregnancy.highRisk": "High Risk",
        "pregnancy.lowRisk": "Normal Risk",
        "pregnancy.notFound": "Pregnancy profile not found",
        "alerts.none": "No alerts",
      };
      return params ? labels[key] ?? `${key}::${JSON.stringify(params)}` : labels[key] ?? key;
    },
  }),
}));

const patient = {
  id: "p1",
  name: "Meera Singh",
  email: "meera@example.com",
  phone: "+91 22222 22222",
  role: "PATIENT",
};

function okHook(data: unknown) {
  return { isLoading: false, isError: false, error: null, data };
}

function mockDefaults() {
  mocks.usePatients.mockReturnValue(okHook({ items: [patient] }));
  mocks.usePregnancy.mockReturnValue(
    okHook({ user: "p1", lmp: "2026-01-05", expectedDueDate: "2026-10-12", gestationalWeek: 30, trimester: 3, isHighRisk: true, riskFactors: ["hypertension"], medicalHistory: [] })
  );
  mocks.useHealthMetrics.mockReturnValue(
    okHook({ items: [{ id: "m1", user: "p1", systolicBP: 150, diastolicBP: 95, glucose: 140, weight: 66, date: "2026-09-10" }] })
  );
  mocks.useSymptoms.mockReturnValue(okHook({ items: [{ id: "s1", user: "p1", date: "2026-09-08", symptoms: ["swelling"], severity: "moderate" }] }));
  mocks.useAlerts.mockReturnValue(okHook({ items: [] }));
  mocks.useUpdateAlertStatus.mockReturnValue({ mutate: vi.fn() });
  mocks.useReferrals.mockReturnValue(okHook({ items: [] }));
  mocks.useAppointments.mockReturnValue(okHook({ items: [] }));
  mocks.useReports.mockReturnValue(okHook({ items: [] }));
  mocks.useMaternalRiskHistory.mockReturnValue(
    okHook({ items: [{ id: "r1", user: "p1", status: "completed", riskLevel: "high", riskScore: 0.8, createdAt: "2026-09-01" }] })
  );
  mocks.useGDMHistory.mockReturnValue(
    okHook({ items: [{ id: "g1", user: "p1", status: "completed", riskLevel: "moderate", riskScore: 0.6, createdAt: "2026-09-01" }] })
  );
  mocks.usePPDHistory.mockReturnValue(okHook({ items: [] }));
  mocks.useCreateHealthMetric.mockReturnValue({ mutate: vi.fn(), isPending: false });
  mocks.useCreateAlert.mockReturnValue({ mutate: vi.fn(), isPending: false });
  mocks.useCreateReferral.mockReturnValue({ mutate: vi.fn(), isPending: false });
  mocks.useCreateAppointment.mockReturnValue({ mutate: vi.fn(), isPending: false });
  mocks.useCurrentLanguage.mockReturnValue("en");
  mocks.useAuthStore.mockImplementation((selector: unknown) => {
    const state = { user: { id: "a1", name: "ASHA Tara", role: "ASHA", language: "en" } };
    return typeof selector === "function" ? selector(state) : state;
  });
  mocks.useToastStore.mockImplementation((selector: unknown) => {
    const state = { push: vi.fn() };
    return typeof selector === "function" ? selector(state) : state;
  });
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/asha/patients/p1"]}>
      <Routes>
        <Route path="/asha/patients/:patientId" element={<ASHAPatientDetailPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("ASHA patient detail (record + measurement workflow)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDefaults();
  });

  it("renders the real patient and shows the read-mostly clinical sections", () => {
    renderPage();
    expect(screen.getAllByText("Meera Singh").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Health History").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Symptoms").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Assessments").length).toBeGreaterThanOrEqual(1);
  });

  it("shows assessment screening results as screening, not diagnoses", () => {
    renderPage();
    expect(screen.getAllByText(/GDM Screening/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("High").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Moderate").length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByText(/Results are screening outputs, not a diagnosis/).length
    ).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText(/You have GDM/)).toBeNull();
    expect(screen.queryByText(/has gestational diabetes/)).toBeNull();
  });

  it("lets the ASHA record a glucose measurement inside the patient workflow", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: "Record & actions" }));
    expect(screen.getAllByText("Record Health Metric").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByLabelText(/Glucose \(mg\/dL\)/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByLabelText(/Weight \(kg\)/).length).toBeGreaterThanOrEqual(1);
  });

  it("does not expose the doctor-run assessment screens to the ASHA", () => {
    renderPage();
    expect(screen.queryByText("Run Risk Assessments")).toBeNull();
    expect(screen.queryByText("Maternal Risk Assessment")).toBeNull();
    expect(screen.queryByText(/Random Forest/)).toBeNull();
  });
});