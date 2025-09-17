import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, AuthContext } from "./contexts/AuthContext";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import AdminBusinesses from "./pages/AdminBusinesses";
import BusinessSettings from "./pages/BusinessSettings";
import SetPassword from "./pages/SetPassword";
import Header from "./components/Header";
import Footer from "./components/Footer";

function Protected({ children, allowedRoles }) {
  const { user } = React.useContext(AuthContext);
  if (!user?.token) return <Navigate to="/login" replace />;
  // Role-based protection if allowedRoles specified
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}


function PublicOnly({ children }) {
  const { user } = React.useContext(AuthContext);
  if (user?.token) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Header />
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={
            <PublicOnly>
              <LoginPage />
            </PublicOnly>
          }
        />
        <Route path="/set-password/:uid/:token" element={<SetPassword />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <Protected>
              <Dashboard />
            </Protected>
          }
        />

        {/* Superuser-only routes */}
        <Route
          path="/admin"
          element={
            <Protected allowedRoles={["superuser"]}>
              <AdminBusinesses />
            </Protected>
          }
        />

        {/* Business owner-only routes */}
        <Route
          path="/owner/users"
          element={
            <Protected allowedRoles={["owner"]}>
              <BusinessSettings />
            </Protected>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <Footer />
    </AuthProvider>
  );
}
