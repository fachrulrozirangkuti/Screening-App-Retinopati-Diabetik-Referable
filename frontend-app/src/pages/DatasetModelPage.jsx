import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Database, BrainCircuit, FileUp, RefreshCw, Image as ImageIcon, Trash2, DownloadCloud, Eye, X } from 'lucide-react';

const DatasetModelPage = () => {
    const [datasets, setDatasets] = useState([]);
    const [models, setModels] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [previewImage, setPreviewImage] = useState(null); // State untuk Pop-up Preview

    useEffect(() => {
        fetchFiles();
    }, []);

    const fetchFiles = async () => {
        setIsLoading(true);
        try {
            const resData = await axios.get('http://localhost:5000/api/datasets');
            const resModel = await axios.get('http://localhost:5000/api/models');
            setDatasets(resData.data);
            setModels(resModel.data);
        } catch (error) {
            console.error("Gagal menarik data file", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUploadDataset = async (e) => {
        e.preventDefault();
        const file = e.target.dataset_image.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('dataset_image', file);

        try {
            await axios.post('http://localhost:5000/api/datasets', formData);
            Swal.fire({ title: 'Berhasil!', text: 'Citra fundus ditambahkan ke dataset.', icon: 'success', timer: 1500 });
            e.target.reset();
            fetchFiles();
        } catch (error) {
            Swal.fire('Gagal!', 'Terjadi kesalahan saat mengunggah dataset.', 'error');
        }
    };

    const handleUploadModel = async (e) => {
        e.preventDefault();
        const file = e.target.model_file.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('model_file', file);

        try {
            await axios.post('http://localhost:5000/api/models', formData);
            Swal.fire({ title: 'Berhasil!', text: 'Model AI baru tersimpan.', icon: 'success', timer: 1500 });
            e.target.reset();
            fetchFiles();
        } catch (error) {
            Swal.fire('Gagal!', 'Terjadi kesalahan saat mengunggah model.', 'error');
        }
    };

    const handleDelete = async (type, filename) => {
        const result = await Swal.fire({
            title: `Hapus ${type === 'dataset' ? 'Dataset' : 'Model'}?`,
            text: `File ${filename} akan dihapus permanen dari sistem.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            confirmButtonText: 'Ya, Hapus!'
        });

        if (result.isConfirmed) {
            try {
                const endpoint = type === 'dataset' ? `/api/datasets/${filename}` : `/api/models/${filename}`;
                await axios.delete(`http://localhost:5000${endpoint}`);
                Swal.fire('Terhapus!', 'File berhasil dihapus.', 'success');
                fetchFiles();
            } catch (error) {
                Swal.fire('Gagal!', 'Tidak dapat menghapus file.', 'error');
            }
        }
    };

    return (
        <div className="p-6 md:p-10 text-slate-800 relative">
            <header className="mb-8 border-b pb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Database className="w-8 h-8 text-blue-600" />
                    <div>
                        <h1 className="text-2xl font-bold">Manajemen Dataset & AI</h1>
                        <p className="text-slate-500 text-sm">Repositori pengumpulan citra fundus dan versi model Machine Learning</p>
                    </div>
                </div>
                <button onClick={fetchFiles} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition" title="Segarkan Data">
                    <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* PANEL 1: DATASET CITRA */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[600px]">
                    <div className="p-4 border-b border-slate-200 bg-blue-50 flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-blue-600" />
                        <h2 className="font-bold text-blue-800">Gudang Dataset Citra</h2>
                    </div>

                    <div className="p-6 border-b border-slate-100 shrink-0">
                        <form onSubmit={handleUploadDataset} className="flex gap-3">
                            <input type="file" name="dataset_image" accept="image/*" required className="flex-1 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border rounded-lg cursor-pointer" />
                            <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 flex items-center gap-2 transition">
                                <FileUp className="w-4 h-4" /> Upload
                            </button>
                        </form>
                    </div>

                    <div className="overflow-y-auto flex-1 bg-slate-50 p-4">
                        {datasets.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                <ImageIcon className="w-12 h-12 mb-2 opacity-20" />
                                <p className="text-sm">Belum ada dataset yang dikumpulkan.</p>
                            </div>
                        ) : (
                            <ul className="space-y-3">
                                {datasets.map((file, i) => (
                                    <li key={i} className="flex flex-col sm:flex-row justify-between sm:items-center p-3 bg-white border border-slate-200 rounded-lg shadow-sm gap-3 hover:border-blue-300 transition">
                                        <div className="overflow-hidden">
                                            <p className="font-medium text-slate-700 truncate text-sm">{file.name}</p>
                                            <p className="text-xs text-slate-400 font-mono mt-0.5">{file.size}</p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            {/* Tombol Preview */}
                                            <button onClick={() => setPreviewImage(`http://localhost:5000/datasets/${file.name}`)} className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-md transition" title="Lihat Gambar">
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            {/* Tombol Download */}
                                            <a href={`http://localhost:5000/datasets/${file.name}`} download target="_blank" rel="noreferrer" className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition" title="Unduh File">
                                                <DownloadCloud className="w-4 h-4" />
                                            </a>
                                            {/* Tombol Hapus */}
                                            <button onClick={() => handleDelete('dataset', file.name)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition" title="Hapus Permanen">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* PANEL 2: REPOSITORI MODEL AI */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[600px]">
                    <div className="p-4 border-b border-slate-200 bg-purple-50 flex items-center gap-2">
                        <BrainCircuit className="w-5 h-5 text-purple-600" />
                        <h2 className="font-bold text-purple-800">Repositori Model AI (.h5 / .keras)</h2>
                    </div>

                    <div className="p-6 border-b border-slate-100 shrink-0">
                        <form onSubmit={handleUploadModel} className="flex gap-3">
                            <input type="file" name="model_file" accept=".h5,.keras" required className="flex-1 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 border rounded-lg cursor-pointer" />
                            <button type="submit" className="px-4 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 flex items-center gap-2 transition">
                                <FileUp className="w-4 h-4" /> Upload
                            </button>
                        </form>
                    </div>

                    <div className="overflow-y-auto flex-1 bg-slate-50 p-4">
                        {models.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                <BrainCircuit className="w-12 h-12 mb-2 opacity-20" />
                                <p className="text-sm">Repositori model masih kosong.</p>
                            </div>
                        ) : (
                            <ul className="space-y-3">
                                {models.map((file, i) => (
                                    <li key={i} className="flex flex-col sm:flex-row justify-between sm:items-center p-3 bg-white border border-slate-200 rounded-lg shadow-sm gap-3 hover:border-purple-300 transition">
                                        <div className="overflow-hidden">
                                            <p className="font-medium text-slate-700 truncate text-sm">{file.name}</p>
                                            <p className="text-xs text-slate-400 font-mono mt-0.5">{file.size}</p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            {/* Tombol Download Model */}
                                            <a href={`http://localhost:5000/models_ai/${file.name}`} download target="_blank" rel="noreferrer" className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition" title="Unduh Model">
                                                <DownloadCloud className="w-4 h-4" />
                                            </a>
                                            {/* Tombol Hapus Model */}
                                            <button onClick={() => handleDelete('model', file.name)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition" title="Hapus Permanen">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>

            {/* MODAL POP-UP PREVIEW GAMBAR */}
            {previewImage && (
                <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden w-full max-w-3xl relative animate-in zoom-in duration-200">
                        <div className="absolute top-4 right-4 z-10 bg-white/50 rounded-lg backdrop-blur-md">
                            <button onClick={() => setPreviewImage(null)} className="p-2 text-slate-800 hover:text-red-600 transition">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-2 bg-slate-100 flex justify-center items-center h-[500px]">
                            <img src={previewImage} alt="Preview Dataset" className="max-w-full max-h-full object-contain drop-shadow-md rounded" />
                        </div>
                        <div className="p-4 bg-white border-t flex justify-between items-center">
                            <p className="text-sm font-medium text-slate-600 truncate mr-4">Preview: {previewImage.split('/').pop()}</p>
                            <a href={previewImage} download target="_blank" rel="noreferrer" className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-800 transition shrink-0">
                                <DownloadCloud className="w-4 h-4" /> Unduh Gambar
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DatasetModelPage;