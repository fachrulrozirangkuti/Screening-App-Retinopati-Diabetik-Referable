import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Users, UserPlus, Trash2, ShieldCheck, Edit2, X } from 'lucide-react';

const UserManagementPage = () => {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);

    const [formData, setFormData] = useState({
        id: '', username: '', password: '', nama_lengkap: '', role: 'DOKTER'
    });

    useEffect(() => { fetchUsers(); }, []);

    const fetchUsers = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/users');
            setUsers(response.data);
        } catch (error) { console.error(error); } finally { setIsLoading(false); }
    };

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleEdit = (user) => {
        setEditingId(user.id);
        setFormData({
            id: user.id, username: user.username, nama_lengkap: user.nama_lengkap, role: user.role,
            password: '' // Kosongkan agar aman, hanya diisi jika ingin diganti
        });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setFormData({ id: '', username: '', password: '', nama_lengkap: '', role: 'DOKTER' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await axios.put(`http://localhost:5000/api/users/${editingId}`, formData);
                Swal.fire({ title: 'Berhasil!', text: 'Data petugas dan password berhasil diperbarui.', icon: 'success' });
            } else {
                await axios.post('http://localhost:5000/api/users', formData);
                Swal.fire({ title: 'Berhasil!', text: 'Petugas baru berhasil didaftarkan.', icon: 'success' });
            }
            handleCancelEdit();
            fetchUsers();
        } catch (error) {
            Swal.fire({ title: 'Gagal!', text: error.response?.data?.error || 'Terjadi kesalahan sistem.', icon: 'error' });
        }
    };

    const handleDelete = async (id, nama) => {
        const activeUser = JSON.parse(localStorage.getItem('rdr_user'));
        if (activeUser.id === id) return Swal.fire({ title: 'Akses Ditolak', text: 'Tidak bisa menghapus akun sendiri!', icon: 'warning' });
        
        const result = await Swal.fire({ title: `Hapus Akun ${nama}?`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#dc2626' });
        if (result.isConfirmed) {
            try {
                await axios.delete(`http://localhost:5000/api/users/${id}`);
                setUsers(users.filter(u => u.id !== id));
                Swal.fire('Terhapus!', 'Akun petugas dicabut.', 'success');
            } catch (error) { Swal.fire('Gagal!', 'Gagal menghapus.', 'error'); }
        }
    };

    return (
        <div className="p-6 md:p-10 text-slate-800">
            <header className="mb-8 border-b pb-4">
                <div className="flex items-center gap-3">
                    <ShieldCheck className="w-8 h-8 text-blue-600" />
                    <div><h1 className="text-2xl font-bold">Kelola Petugas Medis</h1><p className="text-slate-500 text-sm">Hak akses dan kredensial</p></div>
                </div>
            </header>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit">
                    <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 border-b pb-2">
                        {editingId ? <Edit2 className="w-5 h-5 text-amber-600" /> : <UserPlus className="w-5 h-5 text-blue-600" />} 
                        {editingId ? 'Edit Data Petugas' : 'Registrasi Petugas'}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div><label className="block text-xs font-bold text-slate-600 mb-1">ID Petugas</label><input type="text" name="id" required disabled={!!editingId} value={formData.id} onChange={handleChange} className="w-full p-2.5 border rounded-lg text-sm disabled:bg-slate-100" /></div>
                        <div><label className="block text-xs font-bold text-slate-600 mb-1">Nama Lengkap</label><input type="text" name="nama_lengkap" required value={formData.nama_lengkap} onChange={handleChange} className="w-full p-2.5 border rounded-lg text-sm" /></div>
                        <div><label className="block text-xs font-bold text-slate-600 mb-1">Username Login</label><input type="text" name="username" required value={formData.username} onChange={handleChange} className="w-full p-2.5 border rounded-lg text-sm" /></div>
                        
                        {/* INPUT PASSWORD DITAMPILKAN JUGA SAAT EDIT */}
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">{editingId ? 'Ganti Password (Opsional)' : 'Password Sementara'}</label>
                            <input type="password" name="password" required={!editingId} placeholder={editingId ? 'Isi jika ingin ubah password' : 'Masukkan password'} value={formData.password} onChange={handleChange} className="w-full p-2.5 border rounded-lg text-sm" />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Hak Akses</label>
                            <select name="role" value={formData.role} onChange={handleChange} className="w-full p-2.5 border rounded-lg text-sm"><option value="DOKTER">DOKTER</option><option value="ADMIN">ADMIN</option></select>
                        </div>
                        <div className="flex gap-2">
                            <button type="submit" className="flex-1 bg-slate-900 text-white font-bold py-3 rounded-lg mt-4">{editingId ? 'Simpan' : 'Daftarkan'}</button>
                            {editingId && <button type="button" onClick={handleCancelEdit} className="px-4 bg-slate-200 text-slate-700 py-3 rounded-lg mt-4"><X className="w-5 h-5" /></button>}
                        </div>
                    </form>
                </div>
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-fit">
                    <table className="w-full text-sm text-left"><thead className="bg-slate-100 border-b"><tr><th className="px-6 py-4">NAMA</th><th className="px-6 py-4">USERNAME</th><th className="px-6 py-4">ROLE</th><th className="px-6 py-4 text-center">AKSI</th></tr></thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id} className="border-b hover:bg-slate-50">
                                <td className="px-6 py-4 font-bold">{user.nama_lengkap}</td>
                                <td className="px-6 py-4">{user.username}</td>
                                <td className="px-6 py-4"><span className={`px-2 py-1 text-xs font-bold rounded-md ${user.role === 'ADMIN' ? 'bg-purple-100' : 'bg-blue-100'}`}>{user.role}</span></td>
                                <td className="px-6 py-4 text-center flex justify-center gap-2"><button onClick={() => handleEdit(user)} className="p-1.5 text-blue-600"><Edit2 className="w-4 h-4"/></button><button onClick={() => handleDelete(user.id, user.nama_lengkap)} className="p-1.5 text-red-600"><Trash2 className="w-4 h-4"/></button></td>
                            </tr>
                        ))}
                    </tbody></table>
                </div>
            </div>
        </div>
    );
};

export default UserManagementPage;