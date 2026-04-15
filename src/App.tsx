import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "@/modules/auth/components/ProtectedRoute";
import { RoleRoute } from "@/modules/auth/components/RoleRoute";
import { ChangePasswordPage } from "@/modules/auth/pages/ChangePasswordPage";
import { LoginPage } from "@/modules/auth/pages/LoginPage";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { CountryOverviewPage } from "@/pages/dashboard/CountryOverviewPage";
import { DashboardHomePage } from "@/pages/dashboard/DashboardHomePage";
import { HrDeskPage } from "@/pages/dashboard/HrDeskPage";
import { PlaceholderPage } from "@/pages/dashboard/PlaceholderPage";
import { ReportsPage } from "@/pages/dashboard/ReportsPage";
import { ApprovalRequestDetailPage } from "@/pages/leave/ApprovalRequestDetailPage";
import { ApprovalsPage } from "@/pages/leave/ApprovalsPage";
import { ApplyLeavePage } from "@/pages/leave/ApplyLeavePage";
import { MyLeaveRequestDetailPage } from "@/pages/leave/MyLeaveRequestDetailPage";
import {
  EmployeeCreatePage,
  EmployeeDetailPage,
  EmployeeEditPage,
  EmployeesPage,
} from "@/pages/employees";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/change-password"
        element={
          <ProtectedRoute allowPasswordChangeOnly>
            <ChangePasswordPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={
            <RoleRoute allowRoles={["admin"]}>
              <DashboardHomePage />
            </RoleRoute>
          }
        />
        <Route
          path="overview/country/:countryPrefix"
          element={
            <RoleRoute allowRoles={["admin", "hr", "management"]}>
              <CountryOverviewPage />
            </RoleRoute>
          }
        />
        <Route
          path="employees"
          element={
            <RoleRoute allowRoles={["admin", "hr", "hod", "supervisor", "management"]}>
              <EmployeesPage />
            </RoleRoute>
          }
        />
        <Route
          path="employees/new"
          element={
            <RoleRoute allowRoles={["admin", "hr", "management"]}>
              <EmployeeCreatePage />
            </RoleRoute>
          }
        />
        <Route
          path="employees/:employeeNumber/edit"
          element={
            <RoleRoute allowRoles={["admin", "hr", "management"]}>
              <EmployeeEditPage />
            </RoleRoute>
          }
        />
        <Route
          path="employees/:employeeNumber"
          element={
            <RoleRoute allowRoles={["admin", "hr", "hod", "supervisor", "management"]}>
              <EmployeeDetailPage />
            </RoleRoute>
          }
        />
        <Route
          path="my-leave"
          element={
            <ApplyLeavePage />
          }
        />
        <Route
          path="my-leave/:requestId"
          element={
            <MyLeaveRequestDetailPage />
          }
        />
        <Route
          path="approvals"
          element={
            <RoleRoute allowRoles={["admin", "hr", "hod", "management"]}>
              <ApprovalsPage />
            </RoleRoute>
          }
        />
        <Route
          path="approvals/:requestId"
          element={
            <RoleRoute allowRoles={["admin", "hr", "hod", "management"]}>
              <ApprovalRequestDetailPage />
            </RoleRoute>
          }
        />
        <Route
          path="hr-desk"
          element={
            <RoleRoute allowRoles={["admin", "hr"]}>
              <HrDeskPage />
            </RoleRoute>
          }
        />
        <Route
          path="reports"
          element={
            <RoleRoute allowRoles={["admin", "hr", "hod", "supervisor", "management"]}>
              <ReportsPage />
            </RoleRoute>
          }
        />
        <Route
          path="settings"
          element={
            <RoleRoute allowRoles={["admin"]}>
              <PlaceholderPage
                title="Settings"
                description="Profile, notifications, and preferences."
              />
            </RoleRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
