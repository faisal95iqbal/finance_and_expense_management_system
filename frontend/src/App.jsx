import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, AuthContext } from "./contexts/AuthContext";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import AdminBusinesses from "./pages/AdminBusinesses";
import BusinessSettings from "./pages/BusinessSettings";
import ExpenseList from "./pages/expense/ExpenseList";
import IncomeList from "./pages/income/IncomeList";
import ExpenseForm from "./pages/expense/ExpenseForm";
import IncomeForm from "./pages/income/IncomeForm";
import SetPassword from "./pages/SetPassword";
import ChatRoom from "./pages/ChatRoom";
import ActivityFeed from "./pages/ActivityFeed";
import Home from "./pages/Home";
import Layout from "./components/Layout";

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

      <Routes>
        <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
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
            <Protected allowedRoles={["owner", "manager","accountant"]}>
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
          path="/business/users"
          element={
            <Protected allowedRoles={["owner", "manager"]}>
              <BusinessSettings />
            </Protected>
          }
        />
        <Route path="/expenses" element={<Protected allowedRoles={["owner", "manager", "accountant"]}><ExpenseList /></Protected>} />
        <Route path="/expenses/new" element={<Protected allowedRoles={["owner", "manager", "accountant"]}><ExpenseForm /></Protected>} />
        <Route path="/incomes" element={<Protected allowedRoles={["owner", "manager", "accountant"]}><IncomeList /></Protected>} />
        <Route path="/incomes/new" element={<Protected allowedRoles={["owner", "manager", "accountant"]}><IncomeForm /></Protected>} />

        <Route path="/chatroom" element={<Protected allowedRoles={["owner", "manager", "accountant", "staff"]}><ChatRoom /></Protected>} />
        <Route path="/activityfeed" element={<Protected allowedRoles={["owner", "manager", "accountant", "staff"]}><ActivityFeed /></Protected>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>

    </AuthProvider>
  );
}
