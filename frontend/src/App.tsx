// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth.store';

// Public routes
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Protected routes
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard/DashboardPage';
import History from './pages/History/HistoryPage';
import Transfer from './pages/Transfer/TransferPage';

// Admin routes
import AdminRoute from './components/AdminRoute';
import AdminUsersPage from './pages/Admin/AdminUsersPage';
import AuditLogPage from './pages/Admin/AuditLogPage';
import DeletedUsersPage from './pages/Admin/DeletedUsersPage';

export default function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes - đã login thì redirect thẳng vào dashboard */}
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
        />
        <Route
          path="/register"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />}
        />

        {/* Protected routes */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/transfer" element={<ProtectedRoute><Transfer /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
        <Route path="/transfer" element={<ProtectedRoute><Transfer /></ProtectedRoute>} />
        <Route path="/admin/users" element={<AdminRoute><AdminUsersPage /></AdminRoute>} />
        <Route path="/admin/audit-logs" element={<AdminRoute><AuditLogPage /></AdminRoute>} />
        <Route path="/admin/deleted-users" element={<AdminRoute><DeletedUsersPage /></AdminRoute>} />
       
        {/* Fallback */}
        <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
      </Routes>
    </BrowserRouter>
  );
}