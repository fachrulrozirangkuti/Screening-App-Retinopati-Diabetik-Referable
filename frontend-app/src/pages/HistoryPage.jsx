import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { CSVLink } from 'react-csv';
import { useReactToPrint } from 'react-to-print';
import { History, Search, AlertCircle, CheckCircle2, Eye, Trash2, X, FileDown, Printer } from 'lucide-react';

const HistoryPage = () => {
    const [historyData, setHistoryData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedItem, setSelectedItem] = useState(null);

    // Konfigurasi React-to-Print
    const printRef = useRef(null);
    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Arsip_Skrining_${selectedItem?.patient?.kode_pasien || 'RDR'}`,
    });

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/history');
            if (Array.isArray(response.data)) {
                setHistoryData(response.data);
            }
        } catch (error) {
            console.error("Gagal menarik data riwayat:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Hapus Rekam Medis?',
            text: "Data skrining ini akan dihapus secara permanen dan tidak dapat dikembalikan!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Ya, Hapus Data!',
            cancelButtonText: 'Batal',
        });

        if (result.isConfirmed) {
            try {
                await axios.delete(`http://localhost:5000/api/history/${id}`);
                setHistoryData(historyData.filter(item => item.id !== id));
                Swal.fire('Terhapus!', 'Data rekam medis berhasil dihapus.', 'success');
            } catch (error) {
                Swal.fire('Gagal!', 'Terjadi kesalahan sistem.', 'error');
            }
        }
    };

    const filteredData = historyData.filter(item => {
        const namaPasien = item.patient?.nama_pasien || 'Pasien Tanpa Nama';
        const kodePasien = item.patient?.kode_pasien || 'RM-UNKNOWN';
        return namaPasien.toLowerCase().includes(searchQuery.toLowerCase()) ||
            kodePasien.toLowerCase().includes(searchQuery.toLowerCase());
    });

    // Konfigurasi Header & Data untuk Export CSV
    const csvHeaders = [
        { label: "Waktu Pemeriksaan", key: "createdAt" },
        { label: "Kode Pasien", key: "patient.kode_pasien" },
        { label: "Nama Pasien", key: "patient.nama_pasien" },
        { label: "Mata", key: "mata" },
        { label: "Prediksi Label", key: "predicted_label" },
        { label: "Probabilitas (AI)", key: "probability_referable" },
        { label: "Catatan Dokter", key: "catatan_dokter" }
    ];

    return (
        <div className="p-6 md:p-10 text-slate-800 relative">
            <header className="mb-8 border-b pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <History className="w-8 h-8 text-blue-600" />
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">Riwayat Pemeriksaan</h1>
                            <p className="text-slate-500 text-sm">Arsip hasil segmentasi dan ekstraksi fitur visual InceptionV3</p>
                        </div>
                    </div>
                    
                    {/* Tombol Export CSV */}
                    <CSVLink 
                        data={filteredData} 
                        headers={csvHeaders} 
                        filename={`Riwayat_Skrining_${new Date().toISOString().slice(0,10)}.csv`}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg font-bold text-sm transition shadow-sm"
                    >
                        <FileDown className="w-4 h-4" /> Export ke CSV
                    </CSVLink>
                </div>
            </header>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                    <div className="relative w-72">
                        <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari No. RM atau Nama..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <span className="text-sm text-slate-500 font-medium">Total: {filteredData.length} Data</span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-600 uppercase bg-slate-100 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-bold">Waktu Pemeriksaan</th>
                                <th className="px-6 py-4 font-bold">Identitas Pasien</th>
                                <th className="px-6 py-4 font-bold">Mata</th>
                                <th className="px-6 py-4 font-bold">Hasil Ekstraksi</th>
                                <th className="px-6 py-4 font-bold text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan="5" className="px-6 py-10 text-center text-slate-500 font-medium animate-pulse">Menarik data dari server...</td></tr>
                            ) : filteredData.length === 0 ? (
                                <tr><td colSpan="5" className="px-6 py-10 text-center text-slate-500">Tidak ada data rekam medis yang ditemukan.</td></tr>
                            ) : (
                                filteredData.map((item) => (
                                    <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                                        <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                                            {new Date(item.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-800">{item.patient?.nama_pasien || 'Pasien Tanpa Nama'}</div>
                                            <div className="text-xs text-slate-500">{item.patient?.kode_pasien || 'RM-UNKNOWN'}</div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-700">{item.mata}</td>
                                        <td className="px-6 py-4">
                                            {item.predicted_class === 1 ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-100 text-red-700 font-bold text-xs">
                                                    <AlertCircle className="w-3.5 h-3.5" /> {(item.predicted_label || 'REFERABLE').toUpperCase()}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-100 text-green-700 font-bold text-xs">
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> {(item.predicted_label || 'NON-REFERABLE').toUpperCase()}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-3">
                                                <button onClick={() => setSelectedItem(item)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md transition" title="Lihat Detail">
                                                    <Eye className="w-5 h-5" />
                                                </button>
                                                <button onClick={() => handleDelete(item.id)} className="p-1.5 text-red-600 hover:bg-red-100 rounded-md transition" title="Hapus Data">
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL POP UP DETAIL */}
            {selectedItem && (
                <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
                        <div className="bg-slate-800 p-4 flex justify-between items-center text-white">
                            <h3 className="font-bold text-lg flex items-center gap-2"><Eye className="w-5 h-5 text-blue-400" /> Detail Hasil Segmentasi</h3>
                            <button onClick={() => setSelectedItem(null)} className="p-1 hover:bg-slate-700 rounded-md"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="text-xs font-bold uppercase text-slate-400 mb-3 border-b pb-1">Identitas Klinis</h4>
                                <div className="space-y-2 text-sm">
                                    <p><span className="text-slate-500">No. RM:</span> <span className="font-bold">{selectedItem.patient?.kode_pasien || 'RM-UNKNOWN'}</span></p>
                                    <p><span className="text-slate-500">Nama:</span> <span className="font-bold">{selectedItem.patient?.nama_pasien || 'Pasien Tanpa Nama'}</span></p>
                                    <p><span className="text-slate-500">Mata:</span> <span className="font-medium">{selectedItem.mata}</span></p>
                                </div>
                                <h4 className="text-xs font-bold uppercase text-slate-400 mt-6 mb-3 border-b pb-1">Ekstraksi Fitur AI</h4>
                                <div className={`p-3 border rounded-lg ${selectedItem.predicted_class === 1 ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
                                    <p className="font-bold text-lg mb-1">{(selectedItem.predicted_label || 'RESULT').toUpperCase()}</p>
                                    <p className="text-sm">Probabilitas: <b>{(parseFloat(selectedItem.probability_referable || 0) * 100).toFixed(2)}%</b></p>
                                </div>
                            </div>
                            <div>
                                <h4 className="text-xs font-bold uppercase text-slate-400 mb-3 border-b pb-1">Citra Fundus Retina</h4>
                                {selectedItem.gambar_path ? (
                                    <div className="bg-slate-100 rounded-lg overflow-hidden border border-slate-200 h-48 flex items-center justify-center">
                                        <img src={`http://localhost:5000/uploads/${selectedItem.gambar_path}`} alt="Fundus" className="object-contain h-full w-full" />
                                    </div>
                                ) : (
                                    <div className="h-48 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-400 text-sm">Tidak ada citra</div>
                                )}
                            </div>
                        </div>
                        
                        {/* FOOTER MODAL - TOMBOL CETAK & TUTUP */}
                        <div className="p-4 border-t bg-slate-50 flex justify-end gap-3">
                            <button onClick={handlePrint} className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
                                <Printer className="w-4 h-4" /> Download PDF / Cetak
                            </button>
                            <button onClick={() => setSelectedItem(null)} className="px-5 py-2 bg-slate-800 text-white text-sm font-semibold rounded-lg hover:bg-slate-900 transition">
                                Tutup Jendela
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* TEMPLATE SURAT PDF UNTUK CETAK (Sesuai Format SkriningPage) */}
            <div className="absolute w-0 h-0 overflow-hidden z-[-100]">
                {selectedItem && (
                    <div ref={printRef} className="p-12 text-black bg-white w-[210mm] min-h-[297mm]">
                        <div className="border-b-4 border-black pb-4 mb-8 text-center">
                            <h1 className="text-3xl font-extrabold uppercase tracking-wide">Klinik Mata Terpadu</h1>
                            <p className="text-md font-semibold mt-1">Sistem Cerdas Skrining Retinopati Diabetik</p>
                            <p className="text-sm mt-1">Lhokseumawe, Aceh - Indonesia</p>
                        </div>
                        
                        <h2 className="text-xl font-bold text-center mb-8 underline">LAPORAN HASIL SKRINING (INCEPTION-V3)</h2>

                        <div className="mb-6">
                            <p className="font-bold mb-2 bg-slate-100 p-1">I. IDENTITAS PASIEN</p>
                            <table className="w-full text-sm ml-4 mt-2">
                                <tbody>
                                    <tr><td className="w-48 py-1.5">Waktu Pemeriksaan</td><td>: <b>{new Date(selectedItem.createdAt).toLocaleString('id-ID')}</b></td></tr>
                                    <tr><td className="py-1.5">Nomor Rekam Medis</td><td>: <b>{selectedItem.patient?.kode_pasien || 'RM-UNKNOWN'}</b></td></tr>
                                    <tr><td className="py-1.5">Nama Pasien</td><td>: <b>{selectedItem.patient?.nama_pasien || 'Pasien Tanpa Nama'}</b></td></tr>
                                    <tr><td className="py-1.5">Sisi Mata (Lateralisasi)</td><td>: {selectedItem.mata}</td></tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="mb-10">
                            <p className="font-bold mb-2 bg-slate-100 p-1">II. HASIL KLASIFIKASI MODEL AI</p>
                            <div className="border-2 border-black p-5 ml-4 mt-2">
                                <p className="text-sm mb-4">Berdasarkan hasil ekstraksi komputasional pada citra fundus menggunakan model Inception-V3 (Transfer Learning), pasien ini diklasifikasikan sebagai:</p>
                                
                                <div className="text-center py-4 border-y border-dashed border-slate-400 mb-4 bg-slate-50">
                                    <p className="text-2xl font-black tracking-widest">
                                        {(selectedItem.predicted_label || '').toUpperCase()}
                                    </p>
                                </div>
                                
                                <table className="w-full text-sm">
                                    <tbody>
                                        <tr><td className="w-48 py-1">Tingkat Keyakinan (Probabilitas)</td><td>: <b>{(parseFloat(selectedItem.probability_referable || 0) * 100).toFixed(2)}%</b></td></tr>
                                        <tr>
                                            <td className="py-1 align-top">Rekomendasi Tindakan</td>
                                            <td className="font-semibold text-justify">: {selectedItem.predicted_class === 1 
                                                ? 'Ditemukan indikasi retinopati diabetik tahap Moderate/Severe/Proliferative. Pasien disarankan untuk SEGERA DIRUJUK ke Dokter Spesialis Mata.' 
                                                : 'Kondisi Normal atau Mild DR. Pasien dapat melanjutkan observasi berkala di fasilitas kesehatan primer.'}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {selectedItem.gambar_path && (
                            <div className="mb-10 page-break-inside-avoid">
                                <p className="font-bold mb-2 bg-slate-100 p-1">III. LAMPIRAN CITRA FUNDUS</p>
                                <div className="ml-4 mt-2 border border-slate-300 p-2 inline-block">
                                    <img src={`http://localhost:5000/uploads/${selectedItem.gambar_path}`} className="h-56 object-contain" alt="Fundus" />
                                </div>
                            </div>
                        )}

                        <div className="mt-16 flex justify-end">
                            <div className="text-center">
                                <p>Lhokseumawe, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                <p className="mb-20">Dicetak Dari Sistem RDR</p>
                                <p className="font-bold underline uppercase">Arsip Digital</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
};

export default HistoryPage;