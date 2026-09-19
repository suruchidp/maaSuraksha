import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Spinner } from "@/components/ui/Spinner";
import { UserRole } from "@maasuraksha/shared";
import { normalizeUserRole } from "@/stores/authStore";

const VALID_ROLE_ALIASES = new Set([
  "ASHA",
  "ASHA_WORKER",
  "ASHAWORKER",
  "AWW",
  "ASHA_WORKER_ROLE",
  "DOCTOR",
  "DOCTOR_WORKER",
  "DOCTORWORKER",
  "PHYSICIAN",
  "MEDICAL_OFFICER",
  "ADMIN",
  "ADMINISTRATOR",
  "SYSTEM_ADMIN",
  "PATIENT",
  "USER",
  "MOTHER",
  "BENEFICIARY",
]);

export default function ProtectedRoute({ allowedRoles }: { allowedRoles?: string[] }) {
  const { isAuthenticated, user, isVerifying } = useAuth();
  const location = useLocation();

  if (isVerifying) return <Spinner />;

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  const rawRole = String(user.role ?? "").trim().toUpperCase().replace(/[-\s]+/g, "_");
  if (!VALID_ROLE_ALIASES.has(rawRole)) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  const normalizedRole = normalizeUserRole(user.role);
  if (allowedRoles && !allowedRoles.includes(normalizedRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}