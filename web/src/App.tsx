import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import { AppLayout } from './components/layout/AppLayout';
import Login from './pages/Login';
import Overview from './pages/Overview';
import Connect from './pages/Connect';
import Inbox from './pages/Inbox';
import Payments from './pages/Payments';

function Protected() {
  const { authed } = useAuth();
  if (!authed) return <Navigate to="/login" replace />;
  return <AppLayout />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<Protected />}>
          <Route path="/" element={<Overview />} />
          <Route path="/connect" element={<Connect />} />
          <Route path="/inbox" element={<Inbox />} />
          <Route path="/payments" element={<Payments />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}