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
        <Route path="dashboard" element={<ProtectedRoute allowedRoles={['administrator', 'analyst']}><DashboardPage /></ProtectedRoute>} />
        <Route path="report" element={<ReportIncidentPage />} />
      </Route>
    </Routes>
  );
}
