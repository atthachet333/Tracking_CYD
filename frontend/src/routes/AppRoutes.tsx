import { Routes, Route, Navigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardOverview } from "@/pages/DashboardOverview";
import { CustomerOverviewPage } from "@/pages/CustomerOverviewPage";
import { AdminOverviewPage } from "@/pages/AdminOverviewPage";
import { DocumentsOverviewPage } from "@/pages/DocumentsOverviewPage";
import { TeamDashboard } from "@/pages/TeamDashboard";
import { TasksPage } from "@/pages/TasksPage";
import { CustomersPage } from "@/pages/CustomersPage";
import { ReportsPage } from "@/pages/ReportsPage";
import { NotificationsPage } from "@/pages/NotificationsPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { GoogleSheetsIntegrationPage } from "@/pages/GoogleSheetsIntegrationPage";
import { AuditLogPage } from "@/pages/AuditLogPage";
import { LoginPage } from "@/pages/LoginPage";
import { ForbiddenPage } from "@/pages/ForbiddenPage";
import { ProtectedRoute, RequirePermission } from "@/components/auth/guards";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/403" element={<ForbiddenPage />} />
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardOverview />} />
          <Route path="customer-overview" element={<CustomerOverviewPage />} />
          <Route path="admin-overview" element={<AdminOverviewPage />} />
          <Route path="documents-overview" element={<DocumentsOverviewPage />} />
          <Route path="team" element={<TeamDashboard />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />

          {/* Admin เท่านั้น (backend ยังตรวจ 403/401 อีกชั้น) */}
          <Route element={<RequirePermission permission="settingsManage" />}>
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route element={<RequirePermission permission="integrationManage" />}>
            <Route path="settings/integrations/google-sheets" element={<GoogleSheetsIntegrationPage />} />
          </Route>
          <Route element={<RequirePermission permission="auditRead" />}>
            <Route path="audit-log" element={<AuditLogPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
