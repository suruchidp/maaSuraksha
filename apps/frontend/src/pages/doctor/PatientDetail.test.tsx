import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import DoctorPatientDetailPage from "./PatientDetail";

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
  useCreateMaternalRisk: vi.fn(),
  useCreateGDM: vi.fn(),
  useCreatePPD: vi.fn(),
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
  useCreateMaternalRisk: (...a: unknown[]) => mocks.useCreateMaternalRisk(...a),
  useCreateGDM: (...a: unknown[]) => mocks.useCreateGDM(...a),
  useCreatePPD: (...a: unknown[]) => mocks.useCreatePPD(...a),
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
        "doctor.runAssessments": "Run Risk Assessments",
        "doctor.quickActions": "Add recommendations & manage referrals",
        "doctor.backToPatients": "Back to patients",
        "appointments.bookTitle": "Book an Appointment",
        "assessments.maternal.title": "Maternal Risk Assessment",
        "assessments.gdm.title": "GDM Risk Assessment (Decision Support)",
        "assessments.ppd.title": "Perinatal Depression Screening (EPDS)",
        "metrics.date": "Date",
        "metrics.bp": "Blood Pressure",
        "metrics.weight": "Weight",
        "metrics.glucose": "Glucose",
        "metrics.heartRate": "Heart Rate",
        "metrics.temperature": "Temperature",
        "metrics.hemoglobin": "Hemoglobin",
        "pregnancy.gestationalWeek": "Gestational Week",
        "pregnancy.weeks": "weeks",
        "pregnancy.trimester": "Trimester",
        "pregnancy.lmp": "Last Menstrual Period",
        "pregnancy.dueDate": "Due Date",
        "pregnancy.riskStatus": "Risk Status",
        "pregnancy.highRisk": "High Risk",
        "pregnancy.lowRisk": "Normal Risk",
        "pregnancy.riskFactors": "Risk factors",
      };
      return params ? labels[key] ?? `${key}::${JSON.stringify(params)}` : labels[key] ?? key;
    },
  }),
}));

const patient = {
  id: "p1",
  name: "Asha Verma",
  email: "asha@example.com",
  phone: "+91 11111 11111",
  role: "PATIENT",
};

function okHook(data: unknown) {
  return { isLoading: false, isError: false, error: null, data };
}

function mockDefaults() {
  mocks.usePatients.mockReturnValue(okHook({ items: [patient] }));
  mocks.usePregnancy.mockReturnValue(
    okHook({ user: "p1", lmp: "2026-01-05", expectedDueDate: "2026-10-12", gestationalWeek: 20, trimester: 2, isHighRisk: false, riskFactors: [], medicalHistory: [] })
  );
  mocks.useHealthMetrics.mockReturnValue(
    okHook({ items: [{ id: "m1", user: "p1", systolicBP: 118, diastolicBP: 76, glucose: 92, weight: 62, date: "2026-09-10" }] })
  );
  mocks.useSymptoms.mockReturnValue(okHook({ items: [] }));
  mocks.useAlerts.mockReturnValue(okHook({ items: [] }));
  mocks.useUpdateAlertStatus.mockReturnValue({ mutate: vi.fn() });
  mocks.useReferrals.mockReturnValue(okHook({ items: [] }));
  mocks.useAppointments.mockReturnValue(okHook({ items: [] }));
  mocks.useReports.mockReturnValue(okHook({ items: [] }));
  mocks.useMaternalRiskHistory.mockReturnValue(okHook({ items: [] }));
  mocks.useGDMHistory.mockReturnValue(okHook({ items: [] }));
  mocks.usePPDHistory.mockReturnValue(okHook({ items: [] }));
  mocks.useCreateMaternalRisk.mockReturnValue({ mutate: vi.fn(), isPending: false });
  mocks.useCreateGDM.mockReturnValue({ mutate: vi.fn(), isPending: false });
  mocks.useCreatePPD.mockReturnValue({ mutate: vi.fn(), isPending: false });
  mocks.useCurrentLanguage.mockReturnValue("en");
  mocks.useAuthStore.mockImplementation((selector: unknown) => {
    const state = { user: { id: "d1", name: "Dr. Moti", role: "DOCTOR", language: "en" } };
    return typeof selector === "function" ? selector(state) : state;
  });
  mocks.useToastStore.mockImplementation((selector: unknown) => {
    const state = { push: vi.fn() };
    return typeof selector === "function" ? selector(state) : state;
  });
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/doctor/patients/p1"]}>
      <Routes>
        <Route path="/doctor/patients/:patientId" element={<DoctorPatientDetailPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("Doctor patient detail (reorganized record)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDefaults();
  });

  it("renders the real patient with overview pregnancy info", () => {
    renderPage();
    expect(screen.getAllByText("Asha Verma").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Gestational Week")).toBeInTheDocument();
    expect(screen.getByText("5 Jan 2026")).toBeInTheDocument();
  });

  it("shows the read-mostly clinical sections", () => {
    renderPage();
    expect(screen.getAllByText("Pregnancy").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Health History").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Symptoms").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Reports").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Appointments").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Referrals").length).toBeGreaterThanOrEqual(1);
  });

  it("keeps doctor-authorized assessment panels and their run header", () => {
    renderPage();
    expect(screen.getAllByText("Run Risk Assessments").length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByText("Maternal Risk Assessment").length
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByText("GDM Risk Assessment (Decision Support)").length
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByText("Perinatal Depression Screening (EPDS)").length
    ).toBeGreaterThanOrEqual(1);
  });

  it("does not embed the patient's own appointment-booking page in the doctor view", () => {
    renderPage();
    expect(screen.queryByText("Book an Appointment")).toBeNull();
    expect(screen.queryByText(/Schedule Visit/)).toBeNull();
  });
});