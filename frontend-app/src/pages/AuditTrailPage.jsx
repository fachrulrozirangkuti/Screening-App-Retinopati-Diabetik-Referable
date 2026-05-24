import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, TerminalSquare, DatabaseBackup } from 'lucide-react';
import Swal from 'sweetalert2';

const AuditTrailPage = () => {
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => { fetchLogs(); }, []);

    const fetchLogs = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/audit-logs');
            setLogs(response.data);
        } catch (error) { console.error(error); }
        finally { setIsLoading(false); }
    };

    // FUNGSI AKSI BACKUP DATABASE KHUSUS
    const handleBackupDatabase = async () => {
        try {
            window.open('http://localhost:5000/api/backup-database', '_blank');
            Swal.fire('Berhasil!', 'Berkas cadangan sistem (.json) berhasil diunduh.', 'success');
        } catch (error) {
            Swal.fire('Gagal!', 'Akses ditolak atau server terputus.', 'error');
        }
    };

    return (
        <div className="p-6 md:p-10 text-slate-800">
            <header className="mb-8 border-b pb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <TerminalSquare className="w-8 h-8 text-slate-800" />
                    <div>
                        <h1 className="text-2xl font-bold">Rekam Jejak Sistem (Audit Trail)</h1>
                        <p className="text-slate-500 text-sm">Pemantauan aktivitas pengguna dan log keamanan server</p>
                    </div>
                </div>

                {/* TOMBOL ACTION BACKUP DATA */}
                <button onClick={handleBackupDatabase} className="flex items-center gap-2 bg-purple-700 hover:bg-purple-800 text-white px-4 py-2.5 rounded-lg font-bold text-sm transition shadow-sm">
                    <DatabaseBackup className="w-4 h-4" /> Backup Database (.JSON)
                </button>
            </header>

            <div className="bg-slate-900 rounded-xl shadow-lg border border-slate-700 overflow-hidden text-slate-300">
                <div className="p-4 border-b border-slate-700 bg-slate-950 flex justify-between items-center">
                    <span className="font-mono text-sm text-green-400 flex items-center gap-2"><Activity className="w-4 h-4" /> Live System Logs</span>
                    <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">Read-Only Mode</span>
                </div>

                <div className="overflow-x-auto h-[550px] overflow-y-auto font-mono text-xs p-4">
                    {isLoading ? <div className="text-slate-500">Menyinkronkan log...</div> : (
                        <table className="w-full text-left">
                            <thead className="text-slate-500 border-b border-slate-800">
                                <tr>
                                    <th className="py-2 pr-4 w-40">TIMESTAMP</th>
                                    <th className="py-2 pr-4 w-24">LEVEL</th>
                                    <th className="py-2 pr-4 w-32">USER</th>
                                    <th className="py-2 pr-4 w-48">ACTION</th>
                                    <th className="py-2">MESSAGE</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log, index) => (
                                    <tr key={index} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                                        <td className="py-3 pr-4 text-slate-400">{log.timestamp}</td>
                                        <td className="py-3 pr-4"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${log.level === 'info' ? 'bg-blue-900/50 text-blue-400' : 'bg-red-900/50 text-red-400'}`}>{log.level.toUpperCase()}</span></td>
                                        <td className="py-3 pr-4 text-amber-200">{log.user}</td>
                                        <td className="py-3 pr-4 text-purple-300">{log.action}</td>
                                        <td className="py-3 text-slate-300">{log.message}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuditTrailPage;