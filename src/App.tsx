import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthLayout from "@/layouts/AuthLayout";
import DashboardLayout from "@/layouts/DashboardLayout";

// Auth Pages
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";

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
    <BrowserRouter>
      <Routes>
        {/* Root Redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Dashboard Routes */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="upload" element={<Upload />} />
          <Route path="preprocessing" element={<Preprocessing />} />
          <Route path="results" element={<Results />} />
          <Route path="export" element={<Export />} />
          <Route path="history" element={<History />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
