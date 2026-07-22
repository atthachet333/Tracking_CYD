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

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
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
        <Route path="settings" element={<SettingsPage />} />
        <Route path="settings/integrations/google-sheets" element={<GoogleSheetsIntegrationPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
