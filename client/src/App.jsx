/* eslint-disable no-unused-vars */
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import GroupsList from './pages/GroupsList';
import AttendanceJournal from './pages/AttendanceJournal';
import AdminPanel from './pages/AdminPanel';
import { useTranslation } from 'react-i18next';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-slate-50">
          <Navbar />
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/groups" element={<GroupsList />} />
              <Route path="/journal/:groupId" element={<AttendanceJournal />} />
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/admin" element={<AdminPanel />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/groups" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;