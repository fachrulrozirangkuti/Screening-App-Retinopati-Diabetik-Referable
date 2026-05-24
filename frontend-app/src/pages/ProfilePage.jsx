import React, { useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { UserCheck, KeyRound, Save } from 'lucide-react';

const ProfilePage = () => {
    const activeUser = JSON.parse(localStorage.getItem('rdr_user')) || {};
    const [formData, setFormData] = useState({
        nama_lengkap: activeUser.nama_lengkap || '',
        password: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.put('http://localhost:5000/api/profile', formData);
            // Update data user di local storage agar nama di sidebar berganti otomatis
            const updatedUser = { ...activeUser, nama_lengkap: formData.nama_lengkap };
            localStorage.setItem('rdr_user', JSON.stringify(updatedUser));

            Swal.fire('Berhasil!', response.data.message, 'success').then(() => {
                window.location.reload(); // Refresh halaman untuk sinkronisasi nama di sidebar
            });
        } catch (error) {
            Swal.fire('Gagal!', 'Terjadi kesalahan sistem.', 'error');
        }
    };

    return (
        <div className="p-6 md:p-10 text-slate-800 max-w-xl">
            <header className="mb-8 border-b pb-4 flex items-center gap-3">
                <UserCheck className="w-8 h-8 text-blue-600" />
                <div>
                    <h1 className="text-2xl font-bold">Pengaturan Profil</h1>
                    <p className="text-slate-500 text-sm">Kelola informasi biodata dan kata sandi akun Anda</p>
                </div>
            </header>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Username Login (Permanen)</label>
                        <input type="text" disabled value={activeUser.username} className="w-full p-2.5 bg-slate-50 border rounded-lg text-sm text-slate-400 cursor-not-allowed" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Nama Lengkap</label>
                        <input type="text" required value={formData.nama_lengkap} onChange={(e) => setFormData({ ...formData, nama_lengkap: e.target.value })} className="w-full p-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Ubah Kata Sandi Baru</label>
                        <div className="relative">
                            <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                            <input type="password" placeholder="Kosongkan jika tidak ingin diganti" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full pl-9 pr-4 py-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-slate-900 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-800 transition shadow-sm"><Save className="w-4 h-4" /> Simpan Perubahan Profil</button>
                </form>
            </div>
        </div>
    );
};

export default ProfilePage;