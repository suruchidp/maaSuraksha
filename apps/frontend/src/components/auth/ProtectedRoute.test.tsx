import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

const mock = vi.hoisted(() => ({
  auth: { isAuthenticated: false, user: null as { role: string; name: string } | null, isVerifying: false },
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => mock.auth,
}));

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<div>LOGIN_PAGE</div>} />
        <Route path="/unauthorized" element={<div>UNAUTHORIZED_PAGE</div>} />
        <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
          <Route path="/protected" element={<div>SECRET_CONTENT</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    mock.auth = { isAuthenticated: false, user: null, isVerifying: false };
  });

  it("redirects unauthenticated users to login", () => {
    renderAt("/protected");
    expect(screen.getByText("LOGIN_PAGE")).toBeInTheDocument();
  });

  it("redirects a user without the allowed role to unauthorized", () => {
    mock.auth = { isAuthenticated: true, user: { role: "PATIENT", name: "Anu" }, isVerifying: false };
    renderAt("/protected");
    expect(screen.getByText("UNAUTHORIZED_PAGE")).toBeInTheDocument();
  });

  it("redirects stale or malformed roles back to login instead of showing the unauthorized screen", () => {
    mock.auth = { isAuthenticated: true, user: { role: "UNKNOWN_ROLE", name: "Broken" }, isVerifying: false };
    renderAt("/protected");
    expect(screen.getByText("LOGIN_PAGE")).toBeInTheDocument();
  });

  it("renders protected content for an allowed role", () => {
    mock.auth = { isAuthenticated: true, user: { role: "ADMIN", name: "Admin" }, isVerifying: false };
    renderAt("/protected");
    expect(screen.getByText("SECRET_CONTENT")).toBeInTheDocument();
  });

  it("shows a spinner while the session is being verified", () => {
    mock.auth = { isAuthenticated: false, user: null, isVerifying: true };
    renderAt("/protected");
    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});