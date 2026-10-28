import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from '../features/homepage/HomePage';
import LoginPage from '../features/auth/LoginPage';
import AppShell from '../components/layout/AppShell';
import RoleWorkspaceHome from '../features/dashboard/RoleWorkspaceHome';
import UserManagementPage from '../features/administration/UserManagementPage';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import GatedShellNotice from '../features/errors/GatedShellNotice';
import NotFoundPage from '../features/errors/NotFoundPage';
import AccessDeniedPage from '../features/errors/AccessDeniedPage';

export function AppRoutes() {
  return (
    <Routes>
      {/* 1. Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/unauthorized" element={<AccessDeniedPage />} />

      {/* 2. Protected Authenticated Application Shell */}
      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<AppShell />}>
          {/* Active Phase 2 Routes */}
          <Route index element={<RoleWorkspaceHome />} />
          <Route path="admin" element={<UserManagementPage />} />

          {/* Scaffolded Downstream Routes */}
          <Route path="dashboard" element={<GatedShellNotice title="Operational Dashboard (Phase 6)" />} />
          <Route path="institutions" element={<GatedShellNotice title="Institution 360° Registry (Phase 3)" />} />
          <Route path="complaints" element={<GatedShellNotice title="Complaint Case Management (Phase 3)" />} />
          <Route path="case-intelligence" element={<GatedShellNotice title="Cross-Bureau Case Intelligence (Phase 4)" />} />
          <Route path="workflow" element={<GatedShellNotice title="Workflow & Action History (Phase 5)" />} />
          <Route path="reports" element={<GatedShellNotice title="Reports & SLA Analytics (Phase 6)" />} />
        </Route>
      </Route>

      {/* 3. Fallback Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default AppRoutes;
