import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "@/modules/auth/components/ProtectedRoute";
import { LoginPage } from "@/modules/auth/pages/LoginPage";
import { HomePage } from "@/pages/HomePage";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
