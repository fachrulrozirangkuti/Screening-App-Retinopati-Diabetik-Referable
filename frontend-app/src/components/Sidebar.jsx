import React from 'react';
import { NavLink } from 'react-router-dom';
import { Activity, LayoutDashboard, History, LogOut, Stethoscope, Users, Target, ShieldAlert, Database, UserCheck } from 'lucide-react';

const Sidebar = ({ onLogout, userName, userRole }) => {
    const handleLogout = () => {
        localStorage.removeItem('rdr_user');
        localStorage.removeItem('rdr_token'); // Hapus token saat logout
        onLogout();
    };

    // Pengecekan status Admin
    const isAdmin = userRole === 'ADMIN';

    return (
        <div className="w-64 bg-slate-900 text-white min-h-screen p-4 flex flex-col fixed left-0 top-0 z-50">
            <div className="flex items-center gap-3 mb-10 mt-4 px-2">
                <Activity className="w-8 h-8 text-blue-400" />
                <div>
                    <h2 className="font-bold text-lg leading-tight">RDR System</h2>
                    <p className="text-xs text-slate-400">Poli Mata Terpadu</p>
                </div>
            </div>

            <nav className="flex flex-col gap-2 flex-1">
                <NavLink to="/" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition ${isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
                    <LayoutDashboard className="w-5 h-5" /> <span className="font-medium text-sm">Dashboard Utama</span>
                </NavLink>

                <NavLink to="/screening" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition ${isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
                    <Stethoscope className="w-5 h-5" /> <span className="font-medium text-sm">Skrining Baru</span>
                </NavLink>

                <NavLink to="/history" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition ${isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
                    <History className="w-5 h-5" /> <span className="font-medium text-sm">Riwayat Pasien</span>
                </NavLink>

                {/* MENU KHUSUS ADMIN SAJA */}
                {isAdmin && (
                    <>
                        <div className="mt-4 mb-2 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-t border-slate-800 pt-4">Admin Area</div>
                        <NavLink to="/users" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition ${isActive ? 'bg-purple-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
                            <Users className="w-5 h-5" /> <span className="font-medium text-sm">Kelola Petugas</span>
                        </NavLink>

                        <NavLink to="/evaluation" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition ${isActive ? 'bg-purple-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
                            <Target className="w-5 h-5" /> <span className="font-medium text-sm">Evaluasi Model AI</span>
                        </NavLink>
                        <NavLink to="/audit" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition ${isActive ? 'bg-purple-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
                            <ShieldAlert className="w-5 h-5" /> <span className="font-medium text-sm">Audit Trail</span>
                        </NavLink>
                        <NavLink to="/dataset" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition ${isActive ? 'bg-purple-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
                            <Database className="w-5 h-5" /> <span className="font-medium text-sm">Data & Model AI</span>
                        </NavLink>
                    </>
                )}
            </nav>

            <NavLink to="/profile" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition ${isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
                <UserCheck className="w-5 h-5" /> <span className="font-medium text-sm">Profil Saya</span>
            </NavLink>

            <div className="border-t border-slate-800 pt-4 mt-auto">
                <div className="mb-4 px-4">
                    <p className={`text-xs uppercase font-bold ${isAdmin ? 'text-purple-400' : 'text-blue-400'}`}>{userRole || 'DOKTER'}</p>
                    <p className="text-sm font-medium text-slate-300 truncate">{userName || 'Pengguna Medis'}</p>
                </div>
                <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-red-950 hover:text-red-400 transition w-full">
                    <LogOut className="w-5 h-5" /> <span className="font-medium text-sm">Keluar Sistem</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;