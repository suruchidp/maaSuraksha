import { useState, useEffect } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Menu,
  X,
  Home,
  User,
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
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useAuth } from "@/hooks/useAuth";
import { Toaster } from "@/components/ui/Toaster";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import LanguageSwitcher from "@/components/LanguageSwitcher";
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
  { to: "/doctor/dashboard", labelKey: "nav.dashboard", icon: <LayoutDashboard className="w-5 h-5" />, roles: ["DOCTOR" as UserRole] },
  { to: "/doctor/patients", labelKey: "nav.patients", icon: <Stethoscope className="w-5 h-5" />, roles: ["DOCTOR" as UserRole] },
  { to: "/admin/dashboard", labelKey: "nav.systemOverview", icon: <LayoutDashboard className="w-5 h-5" />, roles: ["ADMIN" as UserRole] },
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

  const filteredNav = NAV_ITEMS.filter((item) =>
    item.roles?.includes(user.role)
  );

  const currentHome = `/patient/dashboard`
    .replace("/patient", `/${user.role.toLowerCase()}`)
    .replace("asha", "asha")
    .replace("doctor", "doctor")
    .replace("admin", "admin")
    .replace("patient", "patient");
  const homePath = ["PATIENT", "ASHA", "DOCTOR", "ADMIN"].includes(user.role)
    ? `/${user.role.toLowerCase()}/dashboard`
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
        className={`fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 z-40 transform transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        aria-label={t("nav.sidebar")}
      >
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
          <Link to={homePath} className="flex items-center gap-2 font-bold text-gray-900">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span>{t("app.name")}</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden text-gray-400 hover:text-gray-600 p-1"
            aria-label={t("common.close")}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="h-[calc(100%-64px)] overflow-y-auto p-3 space-y-0.5">
          {filteredNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary-50 text-primary-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
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
        <header className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 sm:px-6 py-3 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-600 hover:text-gray-900 p-1"
            aria-label={t("nav.sidebar")}
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex-1 min-w-0" />
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
              <User className="w-4 h-4" />
              <span className="font-medium truncate max-w-[120px]">{user.name}</span>
              <span className="text-xs text-gray-400">{t("roles." + user.role)}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={logout}>
              {t("nav.logout")}
            </Button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>

        <footer className="text-center text-xs text-gray-400 py-3 border-t border-gray-100">
          {t("footer.disclaimer")}
        </footer>
      </div>
    </div>
  );
}