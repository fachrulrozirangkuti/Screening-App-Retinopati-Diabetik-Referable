import React, { useState } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import DashboardPage from './pages/DashboardPage';
import ScreeningPage from './pages/ScreeningPage';
import HistoryPage from './pages/HistoryPage';
import LoginPage from './pages/LoginPage';
import UserManagementPage from './pages/UserManagementPage';
import EvaluationPage from './pages/EvaluationPage';
import AuditTrailPage from './pages/AuditTrailPage';
import DatasetModelPage from './pages/DatasetModelPage';
import ProfilePage from './pages/ProfilePage';


function App() {
  // Mengecek sesi login petugas
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('rdr_token');
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
    const savedUser = localStorage.getItem('rdr_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // Proteksi Gatekeeper: Jika belum login, kunci di halaman Login
  if (!user) {
    return <LoginPage onLoginSuccess={(userData) => setUser(userData)} />;
  }

  return (
    <Router>
      <div className="flex bg-slate-50 min-h-screen">
        {/* Mengirim data sesi ke komponen Sidebar */}
        <Sidebar onLogout={() => setUser(null)} userName={user.nama_lengkap} userRole={user.role} />

        <div className="flex-1 ml-64 overflow-x-hidden">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/screening" element={<ScreeningPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/users" element={<UserManagementPage />} />
            <Route path="/evaluation" element={<EvaluationPage />} /> {/* Rute Evaluasi */}
            <Route path="*" element={<Navigate to="/" replace />} />
            <Route path="/audit" element={<AuditTrailPage />} />
            <Route path="/dataset" element={<DatasetModelPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;