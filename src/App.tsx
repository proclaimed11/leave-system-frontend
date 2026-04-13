import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "@/modules/auth/components/ProtectedRoute";
import { ChangePasswordPage } from "@/modules/auth/pages/ChangePasswordPage";
import { LoginPage } from "@/modules/auth/pages/LoginPage";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { DashboardHomePage } from "@/pages/dashboard/DashboardHomePage";
import { PlaceholderPage } from "@/pages/dashboard/PlaceholderPage";
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
        <Route index element={<DashboardHomePage />} />
        <Route path="employees" element={<EmployeesPage />} />
        <Route path="employees/new" element={<EmployeeCreatePage />} />
        <Route path="employees/:employeeNumber/edit" element={<EmployeeEditPage />} />
        <Route path="employees/:employeeNumber" element={<EmployeeDetailPage />} />
        <Route
          path="my-leave"
          element={
            <PlaceholderPage
              title="My leave"
              description="Request time off, view balances, and see your history."
            />
          }
        />
        <Route
          path="approvals"
          element={
            <PlaceholderPage
              title="Approvals"
              description="Queue for supervisors / HOD — approve or send back requests."
            />
          }
        />
        <Route
          path="hr-desk"
          element={
            <PlaceholderPage
              title="HR desk"
              description="HR-only tools — policies, imports, employee records (dummy)."
            />
          }
        />
        <Route
          path="reports"
          element={
            <PlaceholderPage
              title="Reports"
              description="Management & consultant read-only analytics (dummy)."
            />
          }
        />
        <Route
          path="settings"
          element={
            <PlaceholderPage
              title="Settings"
              description="Profile, notifications, and preferences."
            />
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
