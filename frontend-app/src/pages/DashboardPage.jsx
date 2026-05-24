import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, Users, AlertTriangle, Eye, ShieldCheck } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

const DashboardPage = () => {
    const [stats, setStats] = useState({ total: 0, referable: 0, nonReferable: 0, recentData: [] });
    const [isLoading, setIsLoading] = useState(true);

    // Mengambil data pengguna yang sedang login dari localStorage
    const activeUser = JSON.parse(localStorage.getItem('rdr_user')) || {};
    const isAdmin = activeUser.role === 'ADMIN';

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Untuk kesederhanaan, kita ambil data dari endpoint history yang sudah ada
                const response = await axios.get('http://localhost:5000/api/history');
                const data = response.data;
                
                const referable = data.filter(item => item.predicted_class === 1).length;
                const nonReferable = data.length - referable;
                const recent = data.slice(0, 5); // Ambil 5 data terbaru

                setStats({ total: data.length, referable, nonReferable, recentData: recent });
            } catch (error) {
                console.error("Gagal menarik data dashboard:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    const pieData = [
        { name: 'Referable DR', value: stats.referable, color: '#ef4444' }, // Merah
        { name: 'Non-Referable', value: stats.nonReferable, color: '#10b981' } // Hijau
    ];

    return (
        <div className="p-6 md:p-10 text-slate-800">
            <header className="mb-8">
                <h1 className="text-3xl font-black text-slate-900 mb-2">Selamat Datang, {activeUser.nama_lengkap || 'Dokter'}!</h1>
                <p className="text-slate-500 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" /> Hak Akses Anda Saat Ini: <span className="font-bold text-blue-600">{activeUser.role}</span>
                </p>
            </header>

            {/* KARTU STATISTIK ATAS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><Users size={28} /></div>
                    <div><p className="text-sm font-bold text-slate-400 uppercase">Total Pemeriksaan</p><h3 className="text-3xl font-black">{isLoading ? '...' : stats.total}</h3></div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center text-red-600"><AlertTriangle size={28} /></div>
                    <div><p className="text-sm font-bold text-slate-400 uppercase">Kasus Referable</p><h3 className="text-3xl font-black text-red-600">{isLoading ? '...' : stats.referable}</h3></div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center text-green-600"><Eye size={28} /></div>
                    <div><p className="text-sm font-bold text-slate-400 uppercase">Kasus Non-Referable</p><h3 className="text-3xl font-black text-green-600">{isLoading ? '...' : stats.nonReferable}</h3></div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* GRAFIK DISTRIBUSI (PIE CHART) */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2 border-b pb-2"><Activity className="w-5 h-5 text-blue-500" /> Distribusi Hasil Skrining</h3>
                    <div className="h-64 w-full">
                        {stats.total === 0 ? (
                            <div className="h-full flex items-center justify-center text-slate-400 text-sm">Belum ada data visual.</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                        {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                    </Pie>
                                    <RechartsTooltip />
                                    <Legend verticalAlign="bottom" height={36}/>
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* TABEL AKTIVITAS TERBARU */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-700 mb-4 border-b pb-2">Pemeriksaan Terbaru</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 border-b"><tr><th className="px-4 py-3">Pasien</th><th className="px-4 py-3">Mata</th><th className="px-4 py-3">Prediksi AI</th></tr></thead>
                            <tbody>
                                {isLoading ? <tr><td colSpan="3" className="px-4 py-4 text-center">Memuat...</td></tr> : 
                                stats.recentData.length === 0 ? <tr><td colSpan="3" className="px-4 py-4 text-center text-slate-400">Belum ada aktivitas.</td></tr> :
                                stats.recentData.map(item => (
                                    <tr key={item.id} className="border-b hover:bg-slate-50">
                                        <td className="px-4 py-3 font-medium">{item.patient?.nama_pasien} <br/><span className="text-xs font-normal text-slate-500">{new Date(item.createdAt).toLocaleDateString()}</span></td>
                                        <td className="px-4 py-3">{item.mata}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 text-xs font-bold rounded ${item.predicted_class === 1 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                {item.predicted_class === 1 ? 'REFERABLE' : 'NON-REFERABLE'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;