import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

import Welcome from './pages/Welcome';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import DataEntryDashboard from './pages/DataEntryDashboard';
import BoothOfficerDashboard from './pages/BoothOfficerDashboard';
import VoterRegistration from './pages/VoterRegistration';
import VoterList from './pages/VoterList';
import BoothManagement from './pages/BoothManagement';
import VoterSearch from './pages/VoterSearch';
import FaceVerification from './pages/FaceVerification';
import VotingConfirmation from './pages/VotingConfirmation';
import ElectionManagement from './pages/ElectionManagement';
import CandidateManagement from './pages/CandidateManagement';
import VotingStatistics from './pages/VotingStatistics';
import AuditLogs from './pages/AuditLogs';
import UserProfile from './pages/UserProfile';

// Dynamic dashboard router according to user role
const RootDashboardRedirect = () => {
  const { role, isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (role === 'ADMIN') return <Navigate to="/admin-dashboard" replace />;
  if (role === 'DATA_ENTRY') return <Navigate to="/deo-dashboard" replace />;
  if (role === 'BOOTH_OFFICER') return <Navigate to="/booth-dashboard" replace />;
  return <Navigate to="/" replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Welcome and Login */}
          <Route path="/" element={<Welcome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<RootDashboardRedirect />} />

          {/* Protected Application Routes wrapped with Layout */}
          <Route element={<Layout />}>
            {/* Role Dashboards */}
            <Route
              path="/admin-dashboard"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/deo-dashboard"
              element={
                <ProtectedRoute allowedRoles={['DATA_ENTRY']}>
                  <DataEntryDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/booth-dashboard"
              element={
                <ProtectedRoute allowedRoles={['BOOTH_OFFICER', 'ADMIN']}>
                  <BoothOfficerDashboard />
                </ProtectedRoute>
              }
            />

            {/* Voter Registration & Management */}
            <Route
              path="/register-voter"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'DATA_ENTRY']}>
                  <VoterRegistration />
                </ProtectedRoute>
              }
            />
            <Route
              path="/voters"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'DATA_ENTRY', 'BOOTH_OFFICER']}>
                  <VoterList />
                </ProtectedRoute>
              }
            />

            {/* Booth Management */}
            <Route
              path="/booths"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'DATA_ENTRY']}>
                  <BoothManagement />
                </ProtectedRoute>
              }
            />

            {/* Polling Station Verification & Voting Process */}
            <Route
              path="/voter-search"
              element={
                <ProtectedRoute allowedRoles={['BOOTH_OFFICER', 'ADMIN']}>
                  <VoterSearch />
                </ProtectedRoute>
              }
            />
            <Route
              path="/face-verification"
              element={
                <ProtectedRoute allowedRoles={['BOOTH_OFFICER', 'ADMIN']}>
                  <FaceVerification />
                </ProtectedRoute>
              }
            />
            <Route
              path="/voting-confirmation"
              element={
                <ProtectedRoute allowedRoles={['BOOTH_OFFICER', 'ADMIN']}>
                  <VotingConfirmation />
                </ProtectedRoute>
              }
            />

            {/* Elections & Candidates */}
            <Route
              path="/elections"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <ElectionManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/candidates"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <CandidateManagement />
                </ProtectedRoute>
              }
            />

            {/* Statistics & Auditing */}
            <Route
              path="/statistics"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'BOOTH_OFFICER']}>
                  <VotingStatistics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/audit-logs"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'DATA_ENTRY', 'BOOTH_OFFICER']}>
                  <AuditLogs />
                </ProtectedRoute>
              }
            />

            {/* Profile */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <UserProfile />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
