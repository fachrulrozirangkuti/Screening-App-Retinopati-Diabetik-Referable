import React, { useState, useRef } from 'react';
import axios from 'axios';
import { useReactToPrint } from 'react-to-print';
// PERBAIKAN: Menambahkan Eye, ScanSearch, dan Percent ke dalam import agar tidak error layar putih
import { Upload, Activity, User, FileText, AlertCircle, CheckCircle2, Eye, Printer, BrainCircuit, ScanSearch, Percent } from 'lucide-react';

function ScreeningPage() {
    const loggedInUser = JSON.parse(localStorage.getItem('rdr_user')) || {};

    const [formData, setFormData] = useState({
        kode_pasien: '', nama_pasien: '', umur: '', jenis_kelamin: 'Laki-laki',
        userId: loggedInUser.id || 'UNKNOWN', catatan_dokter: ''
    });

    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');

    const printRef = useRef(null);

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Hasil_Skrining_RDR_${formData.kode_pasien || 'Baru'}`,
    });

    const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
            setResult(null); setErrorMsg('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!imageFile) { setErrorMsg('Harap unggah citra fundus pasien terlebih dahulu!'); return; }
        setIsLoading(true); setErrorMsg(''); setResult(null);

        const submitData = new FormData();
        submitData.append('fundus_image', imageFile);
        Object.keys(formData).forEach(key => submitData.append(key, formData[key]));

        try {
            const response = await axios.post('http://localhost:5000/api/screening', submitData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setResult(response.data);
        } catch (error) {
            setErrorMsg(error.response?.data?.error || 'Koneksi Gagal ke Server Backend.');
        } finally {
            setIsLoading(false);
        }
    };

    // Kalkulasi persentase untuk UI
    const probReferable = result ? (parseFloat(result.ai_details.probability_referable) * 100).toFixed(2) : 0;
    const probNonReferable = result ? (100 - probReferable).toFixed(2) : 0;

    return (
        <div className="p-6 md:p-10 text-slate-800 relative">
            <header className="mb-8 border-b pb-4">
                <div className="flex items-center gap-3">
                    <Activity className="w-8 h-8 text-blue-600" />
                    <div>
                        <h1 className="text-2xl font-bold">Sistem Skrining Retinopati Diabetik</h1>
                        <p className="text-slate-500 text-sm">Arsitektur Inception-V3 (Fine-Tuning Terawasi) | Petugas: {loggedInUser.nama_lengkap || 'Admin'}</p>
                    </div>
                </div>
            </header>

            <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* KOLOM KIRI: FORMULIR (Lebar 5/12) */}
                <div className="lg:col-span-5 bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit">
                    <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 border-b pb-2">
                        <User className="w-5 h-5 text-blue-600" /> Registrasi Pemeriksaan
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">No. RM / NIK</label>
                                <input type="text" name="kode_pasien" required value={formData.kode_pasien} onChange={handleInputChange} className="w-full p-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="RM-2026-001" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Nama Pasien</label>
                                <input type="text" name="nama_pasien" required value={formData.nama_pasien} onChange={handleInputChange} className="w-full p-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="Nama Pasien" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Umur (Tahun)</label>
                                <input type="number" name="umur" required value={formData.umur} onChange={handleInputChange} className="w-full p-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="Misal: 52" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Gender</label>
                                <select name="jenis_kelamin" value={formData.jenis_kelamin} onChange={handleInputChange} className="w-full p-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="Laki-laki">Laki-laki</option>
                                    <option value="Perempuan">Perempuan</option>
                                </select>
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Citra Retina (Fundus)</label>
                            <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition">
                                <Upload className="w-6 h-6 mb-1 text-blue-500" />
                                <span className="text-sm font-medium text-slate-600">Klik / Drag gambar ke sini</span>
                                <span className="text-[10px] text-slate-400 mt-1">Format: JPG, PNG</span>
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                            </label>
                        </div>
                        <button type="submit" disabled={isLoading} className={`w-full text-white font-bold py-3.5 rounded-lg flex justify-center items-center gap-2 ${isLoading ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-700'} transition shadow-md mt-4`}>
                            {isLoading ? "AI Sedang Menganalisis..." : <><ScanSearch className="w-5 h-5" /> Ekstrak Prediksi Model</>}
                        </button>
                        {errorMsg && <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg font-medium border border-red-200">{errorMsg}</div>}
                    </form>
                </div>

                {/* KOLOM KANAN: PREVIEW & HASIL (Lebar 7/12) */}
                <div className="lg:col-span-7 space-y-6">
                    {/* Visualisasi Gambar Mentah */}
                    {!result && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 border-b pb-2"><FileText className="w-5 h-5 text-slate-500" /> Pratinjau Citra</h2>
                            {imagePreview ? (
                                <div className="rounded-xl overflow-hidden bg-slate-900 flex justify-center h-[300px] border border-slate-200 shadow-inner">
                                    <img src={imagePreview} className="object-contain h-full w-full" alt="Fundus" />
                                </div>
                            ) : (
                                <div className="h-[300px] rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center bg-slate-50 text-slate-400">
                                    <Eye className="w-12 h-12 mb-3 opacity-20" />
                                    <span className="text-sm font-medium">Menunggu Citra Fundus...</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* KOTAK HASIL KLASIFIKASI & HEATMAP (Menutupi Penuh Jika Sudah Ada Hasil) */}
                    {result && result.ai_details && (
                        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-300">
                            {/* Header Hasil */}
                            <div className={`p-5 flex items-center justify-between border-b ${result.ai_details.predicted_class === 1 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-full ${result.ai_details.predicted_class === 1 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                        {result.ai_details.predicted_class === 1 ? <AlertCircle className="w-8 h-8" /> : <CheckCircle2 className="w-8 h-8" />}
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-0.5">Keputusan Klinis AI</p>
                                        <h3 className={`font-black text-2xl ${result.ai_details.predicted_class === 1 ? 'text-red-700' : 'text-green-700'}`}>
                                            {result.ai_details.predicted_class === 1 ? 'REFERABLE DR' : 'NON-REFERABLE DR'}
                                        </h3>
                                    </div>
                                </div>
                                <div className="text-right hidden md:block">
                                    <p className="text-xs text-slate-500 font-medium">Lateralisasi Mata (Auto)</p>
                                    <p className="font-bold text-slate-800">{result.ai_details.detected_eye}</p>
                                </div>
                            </div>

                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Kolom Kiri: Statistik Probabilitas */}
                                <div className="flex flex-col justify-center space-y-6">
                                    <div>
                                        <div className="flex justify-between items-end mb-2">
                                            <span className="text-sm font-bold text-slate-700 flex items-center gap-1"><Percent className="w-4 h-4"/> Probabilitas Referable</span>
                                            <span className="text-xl font-black text-red-600">{probReferable}%</span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-3 border border-slate-200 overflow-hidden">
                                            <div className="bg-gradient-to-r from-red-500 to-red-600 h-full rounded-full transition-all duration-1000" style={{ width: `${probReferable}%` }}></div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-end mb-2">
                                            <span className="text-sm font-bold text-slate-700 flex items-center gap-1"><Percent className="w-4 h-4"/> Probabilitas Normal/Mild</span>
                                            <span className="text-xl font-black text-emerald-600">{probNonReferable}%</span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-3 border border-slate-200 overflow-hidden">
                                            <div className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-full rounded-full transition-all duration-1000" style={{ width: `${probNonReferable}%` }}></div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mt-auto">
                                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Saran Tindakan</p>
                                        <p className="text-sm font-medium text-slate-700 leading-relaxed text-justify">
                                            {result.ai_details.screening_decision}
                                        </p>
                                    </div>
                                </div>

                                {/* Kolom Kanan: Visualisasi Heatmap & Original */}
                                <div className="space-y-4">
                                    {result.ai_details.heatmap_base64 && (
                                        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm relative group">
                                            <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded backdrop-blur-sm z-10 flex items-center gap-1">
                                                <BrainCircuit className="w-3 h-3 text-yellow-400"/> EXPLAINABLE HEATMAP
                                            </div>
                                            <img src={result.ai_details.heatmap_base64} alt="Heatmap DR" className="w-full h-[220px] object-cover" />
                                        </div>
                                    )}
                                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm relative group">
                                        <div className="absolute top-2 left-2 bg-white/80 text-slate-800 text-[10px] font-bold px-2 py-1 rounded backdrop-blur-sm z-10">
                                            CITRA ASLI
                                        </div>
                                        <img src={imagePreview} alt="Original Fundus" className="w-full h-[120px] object-cover grayscale-[20%]" />
                                    </div>
                                </div>
                            </div>

                            {/* Footer Area Tombol Cetak */}
                            <div className="p-4 bg-slate-50 border-t border-slate-200">
                                <button onClick={handlePrint} className="w-full bg-slate-800 text-white py-3.5 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-900 transition shadow-md font-bold text-sm">
                                    <Printer className="w-5 h-5" /> Cetak Laporan & Visualisasi (PDF)
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* ========================================================= */}
            {/* TEMPLATE SURAT PDF UNTUK CETAK (Telah Diperbaiki HTML-nya) */}
            {/* ========================================================= */}
            <div className="absolute w-0 h-0 overflow-hidden z-[-100]">
                <div ref={printRef} className="p-12 text-black bg-white w-[210mm] min-h-[297mm] font-serif">
                    {/* Header Kop Surat */}
                    <div className="border-b-4 border-black pb-4 mb-6 text-center">
                        <h1 className="text-3xl font-extrabold uppercase tracking-wide">Klinik Mata Terpadu</h1>
                        <p className="text-md font-semibold mt-1">Sistem Cerdas Skrining Retinopati Diabetik</p>
                        <p className="text-sm mt-1">Lhokseumawe, Aceh - Indonesia</p>
                    </div>

                    <h2 className="text-xl font-bold text-center mb-6 underline">LAPORAN HASIL SKRINING (INCEPTION-V3)</h2>

                    {/* Informasi Pasien */}
                    <div className="mb-6">
                        <p className="font-bold mb-2 bg-slate-100 p-1.5 border border-slate-300">I. IDENTITAS PASIEN</p>
                        <table className="w-full text-sm ml-4 mt-2">
                            <tbody>
                                <tr><td className="w-48 py-1.5">Nomor Rekam Medis</td><td>: <b>{formData.kode_pasien}</b></td></tr>
                                <tr><td className="py-1.5">Nama Pasien</td><td>: <b>{formData.nama_pasien}</b></td></tr>
                                <tr><td className="py-1.5">Usia / Jenis Kelamin</td><td>: {formData.umur} Tahun / {formData.jenis_kelamin}</td></tr>
                                <tr><td className="py-1.5">Sisi Mata (Lateralisasi)</td><td>: {result?.ai_details?.detected_eye || formData.mata}</td></tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Hasil Klasifikasi */}
                    <div className="mb-6 page-break-inside-avoid">
                        <p className="font-bold mb-2 bg-slate-100 p-1.5 border border-slate-300">II. HASIL KLASIFIKASI MODEL AI</p>
                        <div className="border-2 border-black p-4 ml-4 mt-2">
                            <p className="text-sm mb-4 text-justify">Berdasarkan hasil ekstraksi komputasional pada citra fundus menggunakan model Inception-V3 (Transfer Learning), pasien ini diklasifikasikan sebagai:</p>

                            <div className="text-center py-3 border-y border-dashed border-slate-400 mb-4 bg-slate-50">
                                <p className="text-2xl font-black tracking-widest">
                                    {result?.ai_details?.predicted_class === 1 ? 'REFERABLE DR' : 'NON-REFERABLE DR'}
                                </p>
                            </div>

                            <table className="w-full text-sm">
                                <tbody>
                                    <tr>
                                        <td className="w-48 py-1">Probabilitas Referable</td>
                                        <td>: <b>{probReferable}%</b></td>
                                    </tr>
                                    <tr>
                                        <td className="py-1 align-top">Rekomendasi Tindakan</td>
                                        <td className="font-semibold text-justify pb-1">: {result?.ai_details?.screening_decision}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Lampiran Visual (Asli & Heatmap Bersebelahan) */}
                    {imagePreview && (
                        <div className="mb-8 page-break-inside-avoid">
                            <p className="font-bold mb-2 bg-slate-100 p-1.5 border border-slate-300">III. LAMPIRAN VISUALISASI MEDIS</p>
                            <div className="ml-4 mt-2 flex gap-4">
                                <div className="flex-1 border border-slate-400 p-2 text-center">
                                    <p className="text-xs font-bold mb-2 uppercase">Citra Fundus Asli</p>
                                    <img src={imagePreview} className="h-48 w-full object-contain bg-slate-100" alt="Fundus Original" />
                                </div>
                                {result?.ai_details?.heatmap_base64 && (
                                    <div className="flex-1 border border-slate-400 p-2 text-center">
                                        <p className="text-xs font-bold mb-2 uppercase">Peta Panas Patologis (Heatmap)</p>
                                        <img src={result.ai_details.heatmap_base64} className="h-48 w-full object-cover bg-slate-100" alt="Fundus Heatmap" />
                                    </div>
                                )}
                            </div>
                            <p className="text-[10px] mt-2 ml-4 italic">* Area berwarna cerah/kemerahan pada peta panas mengindikasikan atensi visual algoritma AI terhadap anomali retina (eksudat/perdarahan/lesi).</p>
                        </div>
                    )}

                    {/* Tanda Tangan */}
                    <div className="mt-10 flex justify-end">
                        <div className="text-center">
                            <p className="text-sm">Lhokseumawe, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                            <p className="mb-20 text-sm">Petugas Pemeriksa</p>
                            <p className="font-bold underline uppercase">{loggedInUser.nama_lengkap || 'Admin Sistem'}</p>
                            <p className="text-xs text-slate-600">ID: {loggedInUser.username || '-'}</p>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}

export default ScreeningPage;