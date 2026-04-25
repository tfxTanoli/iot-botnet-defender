import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthLayout from "@/layouts/AuthLayout";
import DashboardLayout from "@/layouts/DashboardLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { AuthProvider } from "@/contexts/AuthContext";

// Auth Pages
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import AuthCallback from "@/pages/auth/Callback";

// Dashboard Pages
import DashboardHome from "@/pages/dashboard/Home";
import Upload from "@/pages/dashboard/Upload";
import Preprocessing from "@/pages/dashboard/Preprocessing";
import Results from "@/pages/dashboard/Results";
import Export from "@/pages/dashboard/Export";
import History from "@/pages/dashboard/History";
import NotFound from "@/pages/NotFound";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Root Redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* OAuth Callback - must be outside AuthLayout and ProtectedRoute */}
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Dashboard Routes - Protected */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardHome />} />
              <Route path="upload" element={<Upload />} />
              <Route path="preprocessing" element={<Preprocessing />} />
              <Route path="results" element={<Results />} />
              <Route path="export" element={<Export />} />
              <Route path="history" element={<History />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
