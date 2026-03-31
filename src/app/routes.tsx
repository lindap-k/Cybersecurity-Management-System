import { createBrowserRouter, Navigate } from "react-router";
import { DashboardPage } from "./pages/DashboardPage";
import { ReportIncidentPage } from "./pages/ReportIncidentPage";
import { LoginPage } from "./pages/LoginPage";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: "dashboard",
        element: (
          <ProtectedRoute allowedRoles={["analyst", "admin"]}>
            <DashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "report",
        element: (
          <ProtectedRoute>
            <ReportIncidentPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);