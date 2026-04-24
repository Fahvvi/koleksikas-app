import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const initialFormState = {
    name: '', company_name: '', email: '', phone: '', password: '', license_tier_id: ''
};

export default function SuperAdminMitras() {
    const [mitras, setMitras] = useState([]);
    const [tiers, setTiers] = useState([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [apiError, setApiError] = useState(false); // Deteksi jika API gagal

    // Filter, Search, & Pagination
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [tierFilter, setTierFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [formData, setFormData] = useState(initialFormState);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const Toast = MySwal.mixin({
        toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true,
    });

    // --- FETCH DATA MURNI DARI DATABASE ---
    const fetchData = async () => {
        setIsLoadingData(true);
        setApiError(false);
        try {
            const [mitrasRes, tiersRes] = await Promise.all([
                axios.get('/api/v1/super-admin/mitras'),
                axios.get('/api/v1/super-admin/license-tiers')
            ]);

            setMitras(mitrasRes.data.data || []);
            setTiers(tiersRes.data.data || []);
        } catch (error) {
            console.error("Gagal mengambil data dari server:", error);
            setApiError(true);
            setMitras([]); // TIDAK ADA LAGI DATA DUMMY!
            setTiers([]);
        } finally {
            setIsLoadingData(false);
        }
    };

    useEffect(() => { fetchData(); }, []);
    useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter, tierFilter]);

    const filteredMitras = mitras.filter((mitra) => {
        const matchesSearch = 
            (mitra.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
            (mitra.company_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (mitra.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === 'all' ? true : mitra.status === statusFilter;
        const matchesTier = tierFilter === 'all' ? true : (mitra.tier_name || '').includes(tierFilter);
        
        return matchesSearch && matchesStatus && matchesTier;
    });

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredMitras.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredMitras.length / itemsPerPage);

    // --- HANDLER APPROVE ---
    const handleApprove = (id, companyName) => {
        MySwal.fire({
            title: 'Setujui Mitra?',
            text: `Kamu akan mengaktifkan akses penuh untuk "${companyName}".`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#22c55e',
            cancelButtonText: '<span style="color: black">Batal</span>',
            confirmButtonText: 'Ya, Setujui!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await axios.put(`/api/v1/super-admin/mitras/${id}/approve`);
                    Toast.fire({ icon: 'success', title: 'Mitra berhasil disetujui!' });
                    fetchData();
                } catch (error) {
                    MySwal.fire('Gagal!', error.response?.data?.message || 'Terjadi kesalahan.', 'error');
                }
            }
        });
    };

    // --- HANDLER SUSPEND (NONAKTIFKAN) ---
    const handleSuspend = (id, companyName) => {
        MySwal.fire({
            title: 'Nonaktifkan Mitra?',
            text: `Akses untuk "${companyName}" akan diblokir. Apakah kamu yakin?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444', // Merah danger
            cancelButtonText: '<span style="color: black">Batal</span>',
            confirmButtonText: 'Ya, Nonaktifkan!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await axios.put(`/api/v1/super-admin/mitras/${id}/suspend`);
                    Toast.fire({ icon: 'success', title: 'Mitra berhasil dinonaktifkan!' });
                    fetchData();
                } catch (error) {
                    MySwal.fire('Gagal!', error.response?.data?.message || 'Terjadi kesalahan.', 'error');
                }
            }
        });
    };

    const openModal = (mode, mitra = null) => {
        setModalMode(mode);
        setFormData(mode === 'detail' && mitra ? mitra : initialFormState);
        setIsModalOpen(true);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await axios.post('/api/v1/super-admin/mitras', formData);
            Toast.fire({ icon: 'success', title: 'Mitra baru berhasil ditambahkan!' });
            fetchData();
            setIsModalOpen(false);
        } catch (error) {
            MySwal.fire('Gagal!', error.response?.data?.message || 'Cek kembali isian formulir.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusBadge = (status) => {
        switch(status) {
            case 'active': return <span className="px-3 py-1 bg-green-100 text-green-700 border border-green-200 rounded-full text-xs font-bold">Aktif</span>;
            case 'pending': return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 border border-yellow-200 rounded-full text-xs font-bold animate-pulse">Pending</span>;
            case 'rejected': return <span className="px-3 py-1 bg-red-100 text-red-700 border border-red-200 rounded-full text-xs font-bold">Ditolak</span>;
            case 'suspended': return <span className="px-3 py-1 bg-gray-100 text-gray-700 border border-gray-300 rounded-full text-xs font-bold">Diblokir</span>;
            default: return <span className="px-3 py-1 bg-gray-100 text-gray-700 border border-gray-200 rounded-full text-xs font-bold">{status}</span>;
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black text-kas-dark tracking-tight">Daftar Mitra</h2>
                    <p className="text-kas-soft text-sm mt-1">Kelola klien dan lihat kapasitas pengguna mereka.</p>
                </div>
                <button onClick={() => openModal('add')} className="w-full md:w-auto px-6 py-3 bg-kas-primary hover:bg-kas-dark text-white rounded-xl font-bold shadow-lg shadow-kas-primary/30 transition-all active:scale-95 flex items-center justify-center gap-2">
                    <span className="text-lg leading-none">+</span> Tambah Mitra Manual
                </button>
            </div>

            {/* Peringatan jika API Error */}
            {apiError && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3">
                    <span className="text-xl">⚠️</span>
                    <div>
                        <p className="font-bold">Gagal terhubung ke Database!</p>
                        <p className="text-sm">Pastikan rute API `/api/v1/super-admin/mitras` sudah mereturn data JSON dengan benar.</p>
                    </div>
                </div>
            )}

            <div className="bg-white p-4 rounded-2xl border border-kas-accent/30 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                    <input 
                        type="text" placeholder="Cari nama, email, atau bisnis..." 
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-kas-primary focus:ring-1 focus:ring-kas-primary transition-all bg-kas-bg/30 text-sm"
                    />
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                    <select 
                        value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                        className="flex-1 md:w-40 px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-kas-primary bg-kas-bg/30 text-sm font-medium"
                    >
                        <option value="all">Semua Status</option>
                        <option value="pending">Pending</option>
                        <option value="active">Aktif</option>
                        <option value="suspended">Diblokir</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-kas-accent/30 shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead>
                            <tr className="bg-kas-bg/50 border-b border-kas-accent/30 text-kas-dark text-sm uppercase tracking-wider">
                                <th className="py-4 px-6 font-bold">Informasi Mitra</th>
                                <th className="py-4 px-6 font-bold text-center">Kontak</th>
                                <th className="py-4 px-6 font-bold text-center">Paket & Anggota</th>
                                <th className="py-4 px-6 font-bold text-center">Status</th>
                                <th className="py-4 px-6 font-bold text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {isLoadingData ? (
                                <tr>
                                    <td colSpan="5" className="p-0">
                                        <div className="flex flex-col items-center justify-center w-full min-h-[300px]">
                                            <div className="w-10 h-10 border-4 border-kas-primary/20 border-t-kas-primary rounded-full animate-spin mb-4"></div>
                                            <p className="text-gray-500 font-bold">Memuat data dari database...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : currentItems.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-0">
                                        <div className="flex flex-col items-center justify-center w-full min-h-[300px] text-center px-4">
                                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100 shadow-inner">
                                                <span className="text-4xl opacity-70">📭</span>
                                            </div>
                                            <p className="text-kas-dark font-black text-xl mb-1">Database Masih Kosong</p>
                                            <p className="text-gray-400 text-sm max-w-sm mx-auto leading-relaxed">
                                                Belum ada mitra yang terdaftar.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : currentItems.map((mitra) => (
                                <tr key={mitra.id} className="border-b border-kas-accent/20 hover:bg-kas-bg/30 transition-colors">
                                    <td className="py-4 px-6">
                                        <div className="font-bold text-kas-dark text-base">{mitra.company_name}</div>
                                        <div className="text-xs text-kas-soft mt-0.5 font-medium">Oleh: {mitra.name}</div>
                                    </td>
                                    <td className="py-4 px-6 text-center">
                                        <div className="text-sm font-bold text-gray-700">{mitra.phone}</div>
                                        <div className="text-xs text-blue-500 font-medium mt-0.5">{mitra.email}</div>
                                    </td>
                                    <td className="py-4 px-6 text-center">
                                        <div className="inline-block px-2 py-1 bg-kas-primary/10 text-kas-primary border border-kas-primary/20 rounded font-bold text-xs mb-1">
                                            {mitra.tier_name || 'Tidak Ada'}
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 text-center">
                                        {getStatusBadge(mitra.status)}
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => openModal('detail', mitra)} className="px-3 py-1.5 text-kas-primary hover:bg-kas-primary/10 rounded-lg font-bold text-sm transition-all">
                                                Detail
                                            </button>
                                            
                                            {/* Tombol Approve (Hanya untuk Pending) */}
                                            {mitra.status === 'pending' && (
                                                <button onClick={() => handleApprove(mitra.id, mitra.company_name)} className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold text-sm transition-all shadow-sm">
                                                    ✓ Approve
                                                </button>
                                            )}

                                            {/* Tombol Suspend (Hanya untuk Aktif) */}
                                            {mitra.status === 'active' && (
                                                <button onClick={() => handleSuspend(mitra.id, mitra.company_name)} className="px-3 py-1.5 text-red-500 hover:bg-red-50 border border-red-200 rounded-lg font-bold text-sm transition-all">
                                                    ✕ Blokir
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- MODAL (TAMBAH / DETAIL) --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-kas-dark/40 backdrop-blur-sm transition-opacity">
                    <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-kas-accent/50 max-h-[90vh] flex flex-col animate-slide-up sm:animate-fade-in">
                        <div className="bg-kas-bg p-5 sm:p-6 border-b border-kas-accent/30 flex justify-between items-center">
                            <h3 className="text-xl font-black text-kas-dark tracking-tight">
                                {modalMode === 'add' ? 'Registrasi Mitra Baru' : 'Detail Mitra'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-gray-400 hover:text-red-500 hover:bg-red-50 font-bold transition-all">✕</button>
                        </div>
                        
                        <form onSubmit={handleFormSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Nama Pemilik</label>
                                    <input type="text" value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} disabled={modalMode === 'detail'} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-kas-primary bg-kas-bg/30 text-sm disabled:opacity-70" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Nama Bisnis/Gor</label>
                                    <input type="text" value={formData.company_name || ''} onChange={(e) => setFormData({...formData, company_name: e.target.value})} disabled={modalMode === 'detail'} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-kas-primary bg-kas-bg/30 text-sm disabled:opacity-70" required />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                                    <input type="email" value={formData.email || ''} onChange={(e) => setFormData({...formData, email: e.target.value})} disabled={modalMode === 'detail'} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-kas-primary bg-kas-bg/30 text-sm disabled:opacity-70" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">No. WhatsApp</label>
                                    <input type="text" value={formData.phone || ''} onChange={(e) => setFormData({...formData, phone: e.target.value})} disabled={modalMode === 'detail'} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-kas-primary bg-kas-bg/30 text-sm disabled:opacity-70" required />
                                </div>
                            </div>

                            {modalMode === 'add' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Pilih Paket Lisensi</label>
                                        <select value={formData.license_tier_id || ''} onChange={(e) => setFormData({...formData, license_tier_id: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-kas-primary bg-kas-bg/30 text-sm" required>
                                            <option value="" disabled>-- Pilih Paket --</option>
                                            {tiers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Password Awal (Untuk Login)</label>
                                        <input type="password" value={formData.password || ''} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-kas-primary bg-kas-bg/30 text-sm" required minLength="6"/>
                                    </div>
                                </>
                            )}

                            {modalMode === 'detail' && (
                                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl mt-4 space-y-2">
                                    <div className="flex justify-between border-b border-gray-200 pb-2">
                                        <span className="text-xs font-bold text-gray-500 uppercase">Status:</span>
                                        {getStatusBadge(formData.status)}
                                    </div>
                                    <div className="flex justify-between pt-1">
                                        <span className="text-xs font-bold text-gray-500 uppercase">Terdaftar Pada:</span>
                                        <span className="text-sm font-bold text-gray-800">{new Date(formData.created_at).toLocaleDateString('id-ID')}</span>
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 mt-2 pb-4 sm:pb-0">
                                {modalMode === 'add' ? (
                                    <div className="flex gap-3">
                                        <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors">Batal</button>
                                        <button type="submit" disabled={isSubmitting} className="flex-1 py-3 bg-kas-primary hover:bg-kas-dark text-white rounded-xl font-bold transition-all disabled:opacity-70">
                                            {isSubmitting ? 'Memproses...' : 'Daftarkan Mitra'}
                                        </button>
                                    </div>
                                ) : (
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold transition-colors">Tutup Detail</button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}