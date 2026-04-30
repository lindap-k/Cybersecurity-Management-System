import { Navigate, Routes, Route } from 'react-router-dom';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ReportIncidentPage } from '@/pages/ReportIncidentPage';
import { Layout } from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<ProtectedRoute allowedRoles={['administrator', 'analyst']}><DashboardPage section="overview" /></ProtectedRoute>} />
        <Route path="tickets/my" element={<ProtectedRoute allowedRoles={['administrator', 'analyst']}><DashboardPage section="my-tickets" /></ProtectedRoute>} />
        <Route path="tickets/unassigned" element={<ProtectedRoute allowedRoles={['administrator', 'analyst']}><DashboardPage section="unassigned" /></ProtectedRoute>} />
        <Route path="admin/users" element={<ProtectedRoute allowedRoles={['administrator']}><DashboardPage section="manage-team" /></ProtectedRoute>} />
        <Route path="report" element={<ReportIncidentPage />} />
      </Route>
    </Routes>
  );
}
