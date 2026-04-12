import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import CoordinatorDashboard from './pages/CoordinatorDashboard';
import ReportEditor from './pages/ReportEditor';
import SharedPage from './pages/SharedPage';
import Navbar from './components/Navbar';

function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return (<div className="loading-overlay"><div className="spinner"></div><p style={{ color: 'var(--text-secondary)' }}>Loading...</p></div>);
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/coordinator'} replace />;
  }
  return children;
}

function AppLayout({ children }) {
  return (<><Navbar />{children}</>);
}

export default function App() {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) return (<div className="loading-overlay" style={{ minHeight: '100vh' }}><div className="spinner"></div></div>);

  return (
    <Routes>
      <Route path="/" element={
        isAuthenticated ? <Navigate to={user.role === 'admin' ? '/admin' : '/coordinator'} replace /> : <LoginPage />
      } />

      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['admin']}><AppLayout><AdminDashboard /></AppLayout></ProtectedRoute>
      } />

      <Route path="/coordinator" element={
        <ProtectedRoute allowedRoles={['coordinator']}><AppLayout><CoordinatorDashboard /></AppLayout></ProtectedRoute>
      } />

      <Route path="/report/new" element={
        <ProtectedRoute allowedRoles={['coordinator', 'admin']}><AppLayout><ReportEditor /></AppLayout></ProtectedRoute>
      } />

      <Route path="/report/:id/edit" element={
        <ProtectedRoute allowedRoles={['coordinator', 'admin']}><AppLayout><ReportEditor /></AppLayout></ProtectedRoute>
      } />

      {/* Public shared report access */}
      <Route path="/shared" element={<SharedPage />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
