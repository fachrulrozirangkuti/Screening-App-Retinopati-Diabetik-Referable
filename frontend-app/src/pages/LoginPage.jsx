import React, { useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Activity, KeyRound, User } from 'lucide-react';

const LoginPage = ({ onLoginSuccess }) => {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const response = await axios.post('http://localhost:5000/api/login', formData);
            
            // Simpan sesi ke memori browser
            localStorage.setItem('rdr_user', JSON.stringify(response.data.user));
            localStorage.setItem('rdr_token', response.data.token); 
            
            // Suntikkan token JWT ke axios global
            axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
            
            Swal.fire({ title: 'Berhasil', text: 'Selamat datang di Sistem RDR', icon: 'success', timer: 1500, showConfirmButton: false });
            onLoginSuccess(response.data.user);
        } catch (error) {
            Swal.fire('Login Gagal!', error.response?.data?.error || 'Username atau Password salah.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden w-full max-w-4xl flex flex-col md:flex-row">
                
                {/* Bagian Kiri - Branding */}
                <div className="w-full md:w-1/2 bg-slate-900 p-10 flex flex-col justify-center text-white">
                    <Activity className="w-16 h-16 text-blue-500 mb-6" />
                    <h1 className="text-4xl font-black mb-2">RDR System</h1>
                    <p className="text-slate-400 mb-8 leading-relaxed">Sistem Cerdas Skrining Referable Diabetic Retinopathy menggunakan backbone Inception-V3 (AI).</p>
                    <div className="mt-auto">
                        <p className="text-xs text-slate-500">Poli Mata Terpadu - Prototype Edition</p>
                    </div>
                </div>

                {/* Bagian Kanan - Form Login */}
                <div className="w-full md:w-1/2 p-10 flex flex-col justify-center">
                    <h2 className="text-2xl font-bold text-slate-800 mb-1">Masuk ke Sistem</h2>
                    <p className="text-sm text-slate-500 mb-8">Masukkan kredensial medis Anda</p>

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-600 mb-2">Username</label>
                            <div className="relative">
                                <User className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
                                <input type="text" name="username" required value={formData.username} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition" placeholder="Masukkan username" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-600 mb-2">Password</label>
                            <div className="relative">
                                <KeyRound className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
                                <input type="password" name="password" required value={formData.password} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition" placeholder="••••••••" />
                            </div>
                        </div>
                        <button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
                            {isLoading ? 'Memverifikasi...' : 'Autentikasi Sistem'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;