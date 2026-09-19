import { AlertNotificationBell } from "./AlertNotificationBell";
import { useState, useEffect } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Menu,
  X,
  Home,
  Heart,
  Activity,
  FileText,
  MessageCircle,
  ClipboardList,
  Bell,
  Calendar,
  BookOpen,
  Bot,
  FileBarChart,
  Users,
  Shield,
  Stethoscope,
  LayoutDashboard,
  AlertTriangle,
  MapPin,
  Clock3,
  HeartPulse,
  UserCog,
} from "lucide-react";
import { useAuthStore, normalizeUserRole } from "@/stores/authStore";
import { useAuth } from "@/hooks/useAuth";
import { Toaster } from "@/components/ui/Toaster";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { BrandMark } from "@/components/brand/BrandMark";
import type { UserRole } from "@maasuraksha/shared";

function navIcon(cls: string) {
  return null; // handled below by individual icons for type safety
}

interface NavItem {
  to: string;
  labelKey: string;
  icon: React.ReactNode;
  roles?: UserRole[];
}

export const DOCTOR_NAV_ITEMS: NavItem[] = [
  { to: "/doctor/dashboard", labelKey: "nav.dashboard", icon: <LayoutDashboard className="w-5 h-5" />, roles: ["DOCTOR" as UserRole] },
  { to: "/doctor/patients", labelKey: "nav.patients", icon: <Stethoscope className="w-5 h-5" />, roles: ["DOCTOR" as UserRole] },
  { to: "/doctor/appointments", labelKey: "nav.appointments", icon: <Calendar className="w-5 h-5" />, roles: ["DOCTOR" as UserRole] },
  { to: "/doctor/high-risk", labelKey: "nav.highRisk", icon: <AlertTriangle className="w-5 h-5" />, roles: ["DOCTOR" as UserRole] },
  { to: "/doctor/assessments", labelKey: "nav.assessments", icon: <ClipboardList className="w-5 h-5" />, roles: ["DOCTOR" as UserRole] },
  { to: "/doctor/vitals", labelKey: "nav.vitals", icon: <HeartPulse className="w-5 h-5" />, roles: ["DOCTOR" as UserRole] },
  { to: "/doctor/investigations", labelKey: "nav.investigations", icon: <FileBarChart className="w-5 h-5" />, roles: ["DOCTOR" as UserRole] },
  { to: "/doctor/care-plans", labelKey: "nav.carePlans", icon: <FileText className="w-5 h-5" />, roles: ["DOCTOR" as UserRole] },
  { to: "/doctor/referrals", labelKey: "nav.referrals", icon: <AlertTriangle className="w-5 h-5" />, roles: ["DOCTOR" as UserRole] },
  { to: "/doctor/asha", labelKey: "nav.ashaCoordination", icon: <Users className="w-5 h-5" />, roles: ["DOCTOR" as UserRole] },
  { to: "/doctor/delivery", labelKey: "nav.deliveryPlanning", icon: <HeartPulse className="w-5 h-5" />, roles: ["DOCTOR" as UserRole] },
  { to: "/doctor/follow-ups", labelKey: "nav.followUps", icon: <Clock3 className="w-5 h-5" />, roles: ["DOCTOR" as UserRole] },
  { to: "/doctor/notifications", labelKey: "nav.notifications", icon: <Bell className="w-5 h-5" />, roles: ["DOCTOR" as UserRole] },
  { to: "/doctor/education", labelKey: "nav.healthEducation", icon: <BookOpen className="w-5 h-5" />, roles: ["DOCTOR" as UserRole] },
  { to: "/doctor/reports", labelKey: "nav.reportsAnalytics", icon: <FileBarChart className="w-5 h-5" />, roles: ["DOCTOR" as UserRole] },
  { to: "/doctor/profile", labelKey: "nav.profileSettings", icon: <UserCog className="w-5 h-5" />, roles: ["DOCTOR" as UserRole] },
];

const NAV_ITEMS: NavItem[] = [
  { to: "/patient/dashboard", labelKey: "nav.dashboard", icon: <LayoutDashboard className="w-5 h-5" />, roles: ["PATIENT" as UserRole] },
  { to: "/patient/pregnancy", labelKey: "nav.pregnancy", icon: <Home className="w-5 h-5" />, roles: ["PATIENT" as UserRole] },
  { to: "/patient/metrics", labelKey: "nav.healthMetrics", icon: <Heart className="w-5 h-5" />, roles: ["PATIENT" as UserRole] },
  { to: "/patient/symptoms", labelKey: "nav.symptoms", icon: <Activity className="w-5 h-5" />, roles: ["PATIENT" as UserRole] },
  { to: "/patient/assessments", labelKey: "nav.assessments", icon: <FileText className="w-5 h-5" />, roles: ["PATIENT" as UserRole] },
  { to: "/patient/mood", labelKey: "nav.moodJournal", icon: <MessageCircle className="w-5 h-5" />, roles: ["PATIENT" as UserRole] },
  { to: "/patient/recommendations", labelKey: "nav.recommendations", icon: <FileText className="w-5 h-5" />, roles: ["PATIENT" as UserRole] },
  { to: "/patient/diet", labelKey: "nav.dietGuidance", icon: <FileText className="w-5 h-5" />, roles: ["PATIENT" as UserRole] },
  { to: "/patient/alerts", labelKey: "nav.alerts", icon: <Bell className="w-5 h-5" />, roles: ["PATIENT" as UserRole] },
  { to: "/patient/appointments", labelKey: "nav.appointments", icon: <Calendar className="w-5 h-5" />, roles: ["PATIENT" as UserRole] },
  { to: "/patient/referrals", labelKey: "nav.referrals", icon: <ClipboardList className="w-5 h-5" />, roles: ["PATIENT" as UserRole] },
  { to: "/patient/education", labelKey: "nav.education", icon: <BookOpen className="w-5 h-5" />, roles: ["PATIENT" as UserRole] },
  { to: "/patient/chat", labelKey: "nav.chatbot", icon: <Bot className="w-5 h-5" />, roles: ["PATIENT" as UserRole] },
  { to: "/patient/reports", labelKey: "nav.reports", icon: <FileBarChart className="w-5 h-5" />, roles: ["PATIENT" as UserRole] },
  { to: "/asha/dashboard", labelKey: "nav.dashboard", icon: <LayoutDashboard className="w-5 h-5" />, roles: ["ASHA" as UserRole] },
  { to: "/asha/patients", labelKey: "nav.assignedPatients", icon: <Users className="w-5 h-5" />, roles: ["ASHA" as UserRole] },
  { to: "/asha/high-risk", labelKey: "nav.highRisk", icon: <Shield className="w-5 h-5" />, roles: ["ASHA" as UserRole] },
  { to: "/asha/home-visits", labelKey: "nav.homeVisits", icon: <Clock3 className="w-5 h-5" />, roles: ["ASHA" as UserRole] },
  { to: "/asha/appointments", labelKey: "nav.appointments", icon: <Calendar className="w-5 h-5" />, roles: ["ASHA" as UserRole] },
  { to: "/asha/deliveries", labelKey: "nav.deliveryTracker", icon: <HeartPulse className="w-5 h-5" />, roles: ["ASHA" as UserRole] },
  { to: "/asha/birth-preparedness", labelKey: "nav.birthPreparedness", icon: <ClipboardList className="w-5 h-5" />, roles: ["ASHA" as UserRole] },
  { to: "/asha/referrals", labelKey: "nav.referrals", icon: <AlertTriangle className="w-5 h-5" />, roles: ["ASHA" as UserRole] },
  { to: "/asha/facilities", labelKey: "nav.healthFacilities", icon: <MapPin className="w-5 h-5" />, roles: ["ASHA" as UserRole] },
  { to: "/asha/notifications", labelKey: "nav.notifications", icon: <Bell className="w-5 h-5" />, roles: ["ASHA" as UserRole] },
  { to: "/asha/reports", labelKey: "nav.reports", icon: <FileBarChart className="w-5 h-5" />, roles: ["ASHA" as UserRole] },
  { to: "/asha/education", labelKey: "nav.education", icon: <BookOpen className="w-5 h-5" />, roles: ["ASHA" as UserRole] },
  { to: "/asha/profile", labelKey: "nav.profile", icon: <UserCog className="w-5 h-5" />, roles: ["ASHA" as UserRole] },
  ...DOCTOR_NAV_ITEMS,
  { to: "/admin/dashboard", labelKey: "nav.systemOverview", icon: <LayoutDashboard className="w-5 h-5" />, roles: ["ADMIN" as UserRole] },
  { to: "/admin/appointments", labelKey: "nav.appointments", icon: <Calendar className="w-5 h-5" />, roles: ["ADMIN" as UserRole] },
  { to: "/admin/users", labelKey: "nav.userManagement", icon: <Users className="w-5 h-5" />, roles: ["ADMIN" as UserRole] },
  { to: "/admin/education", labelKey: "nav.educationalContent", icon: <BookOpen className="w-5 h-5" />, roles: ["ADMIN" as UserRole] },
  { to: "/admin/audit-logs", labelKey: "nav.auditLogs", icon: <FileText className="w-5 h-5" />, roles: ["ADMIN" as UserRole] },
];

export default function AppLayout() {
  const { t } = useTranslation();
  const { user, logout, isVerifying } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  if (isVerifying || !user) {
    return <Spinner />;
  }

  const normalizedRole = normalizeUserRole(user.role);

  const filteredNav = NAV_ITEMS.filter((item) =>
    item.roles?.includes(normalizedRole)
  );

  const homePath = ["PATIENT", "ASHA", "DOCTOR", "ADMIN"].includes(normalizedRole)
    ? `/${normalizedRole.toLowerCase()}/dashboard`
    : "/login";

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Toaster />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 flex flex-col bg-cream-50/70 backdrop-blur-sm border-r border-rose-100/70 z-40 transform transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        aria-label={t("nav.sidebar")}
      >
        <div className="relative px-4 pt-4 pb-3 border-b border-rose-100/70">
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute right-3 top-3 lg:hidden text-gray-400 hover:text-gray-600 p-1"
            aria-label={t("common.close")}
          >
            <X className="w-5 h-5" />
          </button>
          <Link to={homePath} className="flex flex-col items-center text-center">
            <BrandMark className="w-12 h-12 shrink-0 mb-2" />
            <span className="font-display text-2xl font-bold text-gray-900 leading-none tracking-tight">
              {t("app.name")}
            </span>
            <span className="mt-1.5 text-[10.5px] font-semibold text-primary-600/90 leading-snug">
              {t("app.taglineLine1")} · {t("app.taglineLine2")}
            </span>
          </Link>
        </div>

        <nav className="flex-1 min-h-0 overflow-y-auto p-3 space-y-0.5">
          {filteredNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary-100/80 text-primary-800 shadow-sm"
                    : "text-gray-600 hover:bg-white hover:text-primary-700"
                }`
              }
            >
              {item.icon}
              {t(item.labelKey)}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 lg:ml-64 flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-cream-50/85 backdrop-blur-sm border-b border-rose-100/60 px-4 sm:px-6 py-3 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-600 hover:text-gray-900 p-1"
            aria-label={t("nav.sidebar")}
          >
            <Menu className="w-6 h-6" />
          </button>
          <Link to={homePath} className="flex items-center gap-2 lg:hidden">
            <BrandMark className="w-8 h-8 shrink-0" />
            <span className="font-display text-base font-semibold text-gray-900">
              {t("app.name")}
            </span>
          </Link>
          <div className="flex-1 min-w-0" />
          <div className="flex items-center gap-3">
            {user.role === "PATIENT" && <AlertNotificationBell userId={user.id} />}
            <LanguageSwitcher />
            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-rose-100/70 text-sm text-gray-600">
              <span className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-200 to-lavender-300 text-primary-800 flex items-center justify-center text-xs font-semibold">
                {user.name.charAt(0)}
              </span>
              <span className="font-medium truncate max-w-[130px]">{user.name}</span>
              <span className="text-xs text-gray-400">{t("roles." + user.role)}</span>
            </div>
            <Button variant="outline" size="sm" onClick={logout}>
              {t("nav.logout")}
            </Button>
          </div>
        </header>

        <main className={`flex-1 p-4 sm:p-6 lg:p-8 ${sidebarOpen ? "lg:ml-0" : ""}`}>
          <div className="max-w-screen-xl mx-auto">
            <Outlet />
          </div>
        </main>

        <footer className="text-center text-xs text-gray-400 py-3 border-t border-rose-100/60 bg-cream-50/40">
          {t("footer.disclaimer")}
        </footer>
      </div>
    </div>
  );
}