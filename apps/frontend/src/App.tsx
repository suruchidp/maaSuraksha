import AdminAppointmentsPage from "@/pages/admin/Appointments";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { UserRole } from "@maasuraksha/shared";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AppLayout from "@/components/layout/AppLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import UnauthorizedPage from "@/pages/UnauthorizedPage";
import NotFoundPage from "@/pages/NotFoundPage";

import PatientDashboardPage from "@/pages/patient/Dashboard";
import PregnancyPage from "@/pages/patient/Pregnancy";
import HealthMetricsPage from "@/pages/patient/HealthMetrics";
import SymptomsPage from "@/pages/patient/Symptoms";
import AssessmentsPage from "@/pages/patient/Assessments";
import MoodJournalPage from "@/pages/patient/MoodJournal";
import RecommendationsPage from "@/pages/patient/Recommendations";
import DietPlansPage from "@/pages/patient/DietPlans";
import AlertsPage from "@/pages/patient/Alerts";
import AppointmentsPage from "@/pages/patient/Appointments";
import HomeVisitsPage from "@/pages/patient/HomeVisits";
import ReferralsPage from "@/pages/patient/Referrals";
import EducationPage from "@/pages/patient/Education";
import ChatbotPage from "@/pages/patient/Chatbot";
import ReportsPage from "@/pages/patient/Reports";

import ASHADashboardPage from "@/pages/asha/Dashboard";
import ASHAPatientsPage from "@/pages/asha/Patients";
import ASHAPatientDetailPage from "@/pages/asha/PatientDetail";
import {
  ASHAHighRiskPage,
  ASHAHomeVisitsPage,
  ASHAAppointmentsPage,
  ASHADeliveryTrackerPage,
  ASHABirthPreparednessPage,
  ASHAFollowUpsPage,
  ASHAReferralsPage,
  ASHAFacilitiesPage,
  ASHANotificationsPage,
  ASHAReportsPage,
  ASHAEducationPage,
  ASHAProfilePage,
  ASHAAlertsPage,
} from "@/pages/asha/Sections";

import DoctorDashboardPage from "@/pages/doctor/Dashboard";
import DoctorPatientsPage from "@/pages/doctor/Patients";
import DoctorPatientDetailPage from "@/pages/doctor/PatientDetail";
import {
  DoctorAppointmentsPage,
  DoctorHighRiskPage,
  DoctorAssessmentsPage,
  DoctorVitalsPage,
  DoctorInvestigationsPage,
  DoctorCarePlansPage,
  DoctorReferralsPage,
  DoctorASHACoordinationPage,
  DoctorDeliveryPage,
  DoctorFollowUpsPage,
  DoctorNotificationsPage,
  DoctorEducationPage,
  DoctorReportsPage,
  DoctorProfilePage,
} from "@/pages/doctor/Sections";

import AdminDashboardPage from "@/pages/admin/Dashboard";
import AdminUsersPage from "@/pages/admin/Users";
import AdminEducationPage from "@/pages/admin/Education";
import AdminAuditLogsPage from "@/pages/admin/AuditLogs";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col">
          <Routes>
            <Route
              path="/"
              element={
                <>
                  <Navbar />
                  <HomePage />
                  <Footer />
                </>
              }
            />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* Patient app */}
            <Route element={<ProtectedRoute allowedRoles={[UserRole.PATIENT]} />}>
              <Route path="/patient" element={<AppLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<PatientDashboardPage />} />
                <Route path="pregnancy" element={<PregnancyPage />} />
                <Route path="metrics" element={<HealthMetricsPage />} />
                <Route path="symptoms" element={<SymptomsPage />} />
                <Route path="assessments" element={<AssessmentsPage />} />
                <Route path="mood" element={<MoodJournalPage />} />
                <Route path="recommendations" element={<RecommendationsPage />} />
                <Route path="diet" element={<DietPlansPage />} />
                <Route path="alerts" element={<AlertsPage />} />
                <Route path="appointments" element={<AppointmentsPage />} />
                <Route path="home-visits" element={<HomeVisitsPage />} />
                <Route path="referrals" element={<ReferralsPage />} />
                <Route path="education" element={<EducationPage />} />
                <Route path="chat" element={<ChatbotPage />} />
                <Route path="reports" element={<ReportsPage />} />
              </Route>
            </Route>

            {/* ASHA app */}
            <Route element={<ProtectedRoute allowedRoles={[UserRole.ASHA]} />}>
              <Route path="/asha" element={<AppLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<ASHADashboardPage />} />
                <Route path="patients" element={<ASHAPatientsPage />} />
                <Route path="high-risk" element={<ASHAHighRiskPage />} />
                <Route path="home-visits" element={<ASHAHomeVisitsPage />} />
                <Route path="appointments" element={<ASHAAppointmentsPage />} />
                <Route path="deliveries" element={<ASHADeliveryTrackerPage />} />
                <Route path="birth-preparedness" element={<ASHABirthPreparednessPage />} />
                <Route path="follow-ups" element={<ASHAFollowUpsPage />} />
                <Route path="referrals" element={<ASHAReferralsPage />} />
                <Route path="facilities" element={<ASHAFacilitiesPage />} />
                <Route path="notifications" element={<ASHANotificationsPage />} />
                <Route path="reports" element={<ASHAReportsPage />} />
                <Route path="education" element={<ASHAEducationPage />} />
                <Route path="profile" element={<ASHAProfilePage />} />
                <Route path="alerts" element={<ASHAAlertsPage />} />
                <Route path="patients/:patientId" element={<ASHAPatientDetailPage />} />
              </Route>
            </Route>

            {/* Doctor app */}
            <Route element={<ProtectedRoute allowedRoles={[UserRole.DOCTOR]} />}>
              <Route path="/doctor" element={<AppLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<DoctorDashboardPage />} />
                <Route path="patients" element={<DoctorPatientsPage />} />
                <Route path="patients/:patientId" element={<DoctorPatientDetailPage />} />
                <Route path="appointments" element={<DoctorAppointmentsPage />} />
                <Route path="high-risk" element={<DoctorHighRiskPage />} />
                <Route path="assessments" element={<DoctorAssessmentsPage />} />
                <Route path="vitals" element={<DoctorVitalsPage />} />
                <Route path="investigations" element={<DoctorInvestigationsPage />} />
                <Route path="care-plans" element={<DoctorCarePlansPage />} />
                <Route path="referrals" element={<DoctorReferralsPage />} />
                <Route path="asha" element={<DoctorASHACoordinationPage />} />
                <Route path="delivery" element={<DoctorDeliveryPage />} />
                <Route path="follow-ups" element={<DoctorFollowUpsPage />} />
                <Route path="notifications" element={<DoctorNotificationsPage />} />
                <Route path="education" element={<DoctorEducationPage />} />
                <Route path="reports" element={<DoctorReportsPage />} />
                <Route path="profile" element={<DoctorProfilePage />} />
              </Route>
            </Route>

            {/* Admin app */}
            <Route element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]} />}>
              <Route path="/admin" element={<AppLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboardPage />} />
                <Route path="users" element={<AdminUsersPage />} />
                <Route path="appointments" element={<AdminAppointmentsPage />} />
                <Route path="education" element={<AdminEducationPage />} />
                <Route path="audit-logs" element={<AdminAuditLogsPage />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}