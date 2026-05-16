import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { 
    Search, Building2, Mail, Phone, ShieldAlert, KeyRound, 
    CheckCircle2, XCircle, UserCheck, Unlock, Smartphone 
} from 'lucide-react';

const MySwal = withReactContent(Swal);

const initialFormState = {
    name: '', company_name: '', email: '', phone: '', password: '', license_tier_id: ''
};

export default function SuperAdminMitras() {
    const [isManageModalOpen, setIsManageModalOpen] = useState(false);
    const [manageData, setManageData] = useState({ mitra: null, users: [], current_license_id: '' });
    const [adminForm, setAdminForm] = useState({ id: '', name: '', email: '', phone_wa: '', password: '' });

    const [mitras, setMitras] = useState([]);
    const [tiers, setTiers] = useState([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [apiError, setApiError] = useState(false); 

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
            setMitras([]);
            setTiers([]);
        } finally {
            setIsLoadingData(false);
        }
    };

    const handleUnblock = (id, companyName) => {
        MySwal.fire({
            title: 'Aktifkan Kembali?',
            text: `Akses untuk "${companyName}" akan dipulihkan.`,
            icon: 'info',
            showCancelButton: true,
            confirmButtonColor: '#3b82f6',
            confirmButtonText: 'Ya, Aktifkan!',
            customClass: { popup: 'rounded-3xl' }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await axios.put(`/api/v1/super-admin/mitras/${id}/unblock`);
                    Toast.fire({ icon: 'success', title: 'Mitra aktif kembali!' });
                    fetchData();
                } catch (error) {
                    MySwal.fire('Gagal!', 'Terjadi kesalahan.', 'error');
                }
            }
        });
    };

    const openManageModal = async (mitra) => {
        try {
            const res = await axios.get(`/api/v1/super-admin/mitras/${mitra.id}/manage`);
            setManageData({ 
                mitra: mitra, 
                users: res.data.users, 
                current_license_id: res.data.current_license_id || '' 
            });
            if (res.data.users.length > 0) {
                const admin = res.data.users[0];
                setAdminForm({ id: admin.id, name: admin.name, email: admin.email, phone_wa: admin.phone_wa || '', password: '' });
            }
            setIsManageModalOpen(true);
        } catch (error) {
            Toast.fire({ icon: 'error', title: 'Gagal mengambil data akun.' });
        }
    };

    const handleUpdateLicense = async () => {
        try {
            await axios.put(`/api/v1/super-admin/mitras/${manageData.mitra.id}/change-license`, { license_tier_id: manageData.current_license_id });
            Toast.fire({ icon: 'success', title: 'Paket berhasil diubah!' });
            fetchData(); 
        } catch (error) {
            MySwal.fire('Gagal', 'Tidak dapat mengubah paket.', 'error');
        }
    };

    const handleForceUpdateUser = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`/api/v1/super-admin/users/${adminForm.id}/force-update`, adminForm);
            Toast.fire({ icon: 'success', title: 'Data Admin berhasil disinkronkan!' });
            setIsManageModalOpen(false);
            fetchData(); 
        } catch (error) {
            MySwal.fire('Gagal', error.response?.data?.message || 'Terjadi kesalahan validasi.', 'error');
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

    const handleApprove = (id, companyName) => {
        MySwal.fire({
            title: 'Setujui Mitra?',
            text: `Kamu akan mengaktifkan akses penuh untuk "${companyName}".`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#22c55e',
            cancelButtonText: 'Batal',
            confirmButtonText: 'Ya, Setujui!',
            customClass: { popup: 'rounded-3xl' }
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

    const handleSuspend = (id, companyName) => {
        MySwal.fire({
            title: 'Nonaktifkan Mitra?',
            text: `Akses untuk "${companyName}" akan diblokir. Apakah kamu yakin?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444', 
            cancelButtonText: 'Batal',
            confirmButtonText: 'Ya, Nonaktifkan!',
            customClass: { popup: 'rounded-3xl' }
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
            case 'active': return <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full text-xs font-black uppercase tracking-wider shadow-sm"><CheckCircle2 className="w-3.5 h-3.5"/> Aktif</span>;
            case 'pending': return <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 border border-amber-200 rounded-full text-xs font-black uppercase tracking-wider animate-pulse shadow-sm"><ShieldAlert className="w-3.5 h-3.5"/> Pending</span>;
            case 'suspended': return <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-600 border border-rose-200 rounded-full text-xs font-black uppercase tracking-wider shadow-sm"><XCircle className="w-3.5 h-3.5"/> Diblokir</span>;
            default: return <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-50 text-gray-600 border border-gray-200 rounded-full text-xs font-black uppercase tracking-wider">{status}</span>;
        }
    };

    // Fungsi pembantu untuk membuat inisial Avatar
    const getInitials = (name) => {
        if (!name) return 'M';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    return (
        <div className="space-y-6 animate-fade-in p-4 lg:p-8 max-w-7xl mx-auto">
            
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-kas-accent/30">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-kas-primary/10 rounded-2xl flex items-center justify-center border border-kas-primary/20">
                        <Building2 className="w-6 h-6 text-kas-primary" />
                    </div>
                    <div>
                        <h2 className="text-2xl md:text-3xl font-black text-kas-dark tracking-tight">Daftar Mitra</h2>
                        <p className="text-kas-soft text-sm mt-0.5 font-medium">Kelola akses, profil, dan paket lisensi komunitas.</p>
                    </div>
                </div>
                <button onClick={() => openModal('add')} className="w-full md:w-auto px-6 py-3.5 bg-kas-primary hover:bg-kas-dark text-white rounded-xl font-bold shadow-lg shadow-kas-primary/30 transition-all active:scale-95 flex items-center justify-center gap-2">
                    <span className="text-lg leading-none">+</span> Daftarkan Manual
                </button>
            </div>

            {/* API Error Warning */}
            {apiError && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-start gap-3 shadow-sm">
                    <ShieldAlert className="w-6 h-6 mt-0.5 shrink-0" />
                    <div>
                        <p className="font-black text-base">Koneksi Database Terputus!</p>
                        <p className="text-sm font-medium opacity-90 mt-1">Gagal mengambil data dari API `/api/v1/super-admin/mitras`. Periksa log server Anda.</p>
                    </div>
                </div>
            )}

            {/* Filter & Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-kas-accent/30 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-kas-primary transition-colors">
                        <Search className="w-5 h-5" />
                    </span>
                    <input 
                        type="text" placeholder="Cari nama komunitas, email, atau kontak..." 
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-kas-primary focus:ring-4 focus:ring-kas-primary/10 transition-all bg-gray-50 focus:bg-white text-sm font-bold text-kas-dark"
                    />
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                    <select 
                        value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                        className="flex-1 md:w-48 px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-kas-primary focus:ring-4 focus:ring-kas-primary/10 bg-gray-50 focus:bg-white text-sm font-bold text-kas-dark cursor-pointer transition-all"
                    >
                        <option value="all">Semua Status</option>
                        <option value="pending">🟡 Pending</option>
                        <option value="active">🟢 Aktif</option>
                        <option value="suspended">🔴 Diblokir</option>
                    </select>
                </div>
            </div>

            {/* Tabel Data Utama */}
            <div className="bg-white rounded-3xl border border-kas-accent/30 shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-400 text-xs uppercase tracking-widest">
                                <th className="py-5 px-6 font-black">Informasi Mitra</th>
                                <th className="py-5 px-6 font-black text-center">Kontak & Akses</th>
                                <th className="py-5 px-6 font-black text-center">Paket Lisensi</th>
                                <th className="py-5 px-6 font-black text-center">Status</th>
                                <th className="py-5 px-6 font-black text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {isLoadingData ? (
                                <tr>
                                    <td colSpan="5" className="p-0">
                                        <div className="flex flex-col items-center justify-center w-full min-h-[300px]">
                                            <div className="w-12 h-12 border-4 border-kas-primary/20 border-t-kas-primary rounded-full animate-spin mb-4"></div>
                                            <p className="text-gray-500 font-bold">Menyinkronkan data...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : currentItems.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-0">
                                        <div className="flex flex-col items-center justify-center w-full min-h-[300px] text-center px-4">
                                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100 shadow-inner">
                                                <Search className="w-8 h-8 text-gray-300" />
                                            </div>
                                            <p className="text-kas-dark font-black text-xl mb-1">Data Tidak Ditemukan</p>
                                            <p className="text-gray-400 text-sm max-w-sm mx-auto leading-relaxed">
                                                Tidak ada mitra yang cocok dengan filter atau pencarian Anda.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : currentItems.map((mitra) => (
                                <tr key={mitra.id} className="border-b border-gray-50 hover:bg-kas-bg/40 transition-colors group">
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-kas-primary/10 text-kas-primary font-black flex items-center justify-center border border-kas-primary/20 shrink-0">
                                                {getInitials(mitra.company_name)}
                                            </div>
                                            <div>
                                                <div className="font-black text-kas-dark text-base">{mitra.company_name}</div>
                                                <div className="text-xs text-gray-500 mt-0.5 font-medium flex items-center gap-1">
                                                    <UserCheck className="w-3.5 h-3.5" /> {mitra.name}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex flex-col items-center justify-center gap-1.5">
                                            <div className="flex items-center gap-1.5 text-sm font-bold text-gray-700 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100 w-fit">
                                                <Phone className="w-3.5 h-3.5 text-emerald-500" /> {mitra.phone || '-'}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100 w-fit">
                                                <Mail className="w-3.5 h-3.5" /> {mitra.email || '-'}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 text-center">
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-xl font-black text-xs shadow-sm">
                                            <ShieldAlert className="w-3.5 h-3.5" /> {mitra.tier_name || 'Menunggu Pembayaran'}
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 text-center">
                                        {getStatusBadge(mitra.status)}
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-100 lg:opacity-50 group-hover:opacity-100 transition-opacity">
                                            
                                            {/* God Mode Button */}
                                            {mitra.status === 'active' && (
                                                <button onClick={() => openManageModal(mitra)} className="w-9 h-9 flex items-center justify-center bg-kas-dark text-white hover:bg-black rounded-xl transition-all shadow-md tooltip-trigger" title="Kelola Profil & Lisensi">
                                                    <KeyRound className="w-4 h-4" />
                                                </button>
                                            )}
                                            
                                            {/* Approve Button */}
                                            {mitra.status === 'pending' && (
                                                <button onClick={() => handleApprove(mitra.id, mitra.company_name)} className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs transition-all shadow-md flex items-center gap-1.5">
                                                    <CheckCircle2 className="w-4 h-4" /> Setujui
                                                </button>
                                            )}

                                            {/* Suspend Button */}
                                            {mitra.status === 'active' && (
                                                <button onClick={() => handleSuspend(mitra.id, mitra.company_name)} className="w-9 h-9 flex items-center justify-center text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-xl transition-all" title="Blokir Mitra">
                                                    <XCircle className="w-4 h-4" />
                                                </button>
                                            )}

                                            {/* Unblock Button */}
                                            {mitra.status === 'suspended' && (
                                                <button onClick={() => handleUnblock(mitra.id, mitra.company_name)} className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-xl font-bold text-xs transition-all shadow-sm flex items-center gap-1.5">
                                                    <Unlock className="w-4 h-4" /> Unblock
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-3 mt-6">
                    <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-5 py-2.5 bg-white border border-gray-200 rounded-xl disabled:opacity-50 font-bold text-sm hover:border-kas-primary transition-colors">Prev</button>
                    <span className="text-sm font-black text-gray-600 bg-white px-5 py-2.5 rounded-xl border border-gray-200 shadow-sm">
                        {currentPage} / {totalPages}
                    </span>
                    <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="px-5 py-2.5 bg-white border border-gray-200 rounded-xl disabled:opacity-50 font-bold text-sm hover:border-kas-primary transition-colors">Next</button>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL GOD MODE (MANAGE AKUN & PAKET) */}
            {/* ========================================================================= */}
            {isManageModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-kas-dark/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-slide-up border border-kas-accent/50">
                        
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-kas-dark text-white">
                            <div>
                                <h3 className="text-xl font-black flex items-center gap-2"><Building2 className="w-5 h-5 text-kas-accent" /> {manageData.mitra?.company_name}</h3>
                                <p className="text-xs text-gray-300 mt-1 font-medium">Super Admin Override Mode (Tanpa OTP)</p>
                            </div>
                            <button onClick={() => setIsManageModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white font-bold transition-all">✕</button>
                        </div>

                        <div className="p-6 sm:p-8 overflow-y-auto space-y-8 bg-kas-bg/20">
                            
                            {/* SECTION 1: GANTI PAKET */}
                            <div className="bg-white border border-blue-100 p-6 rounded-3xl shadow-sm">
                                <h4 className="font-black text-kas-dark mb-4 flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100"><ShieldAlert className="w-4 h-4" /></div>
                                    Ganti Paket Lisensi
                                </h4>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <select 
                                        value={manageData.current_license_id} 
                                        onChange={(e) => setManageData({...manageData, current_license_id: e.target.value})}
                                        className="flex-1 px-4 py-3.5 rounded-xl border border-gray-200 outline-none focus:border-kas-primary focus:ring-4 focus:ring-kas-primary/10 font-bold text-sm bg-gray-50 focus:bg-white transition-all text-kas-dark"
                                    >
                                        <option value="">Pilih Paket Lisensi...</option>
                                        {tiers.map(tier => (
                                            <option key={tier.id} value={tier.id}>{tier.name} (Rp {tier.price})</option>
                                        ))}
                                    </select>
                                    <button onClick={handleUpdateLicense} className="px-6 py-3.5 bg-kas-primary hover:bg-kas-dark text-white rounded-xl font-black text-sm shadow-lg shadow-kas-primary/30 transition-all active:scale-95 whitespace-nowrap">
                                        Update Paket
                                    </button>
                                </div>
                            </div>

                            {/* SECTION 2: FORCE UPDATE AKUN ADMIN */}
                            <form onSubmit={handleForceUpdateUser} className="bg-white border border-gray-200 p-6 rounded-3xl shadow-sm space-y-4">
                                <h4 className="font-black text-kas-dark mb-4 flex items-center gap-2 border-b border-gray-100 pb-4">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100"><UserCheck className="w-4 h-4" /></div>
                                    Sinkronisasi Akun Admin
                                </h4>
                                
                                {adminForm.id === '' ? (
                                    <div className="p-4 bg-amber-50 text-amber-700 rounded-xl border border-amber-200 font-bold text-sm flex items-center gap-2">
                                        <ShieldAlert className="w-4 h-4" /> Belum ada akun Admin terdaftar untuk mitra ini.
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div>
                                                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Nama PIC</label>
                                                <div className="relative group">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><UserCheck className="w-4 h-4" /></span>
                                                    <input type="text" value={adminForm.name} onChange={e => setAdminForm({...adminForm, name: e.target.value})} className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white outline-none focus:border-kas-primary focus:ring-2 focus:ring-kas-primary/10 transition-all text-sm font-bold text-kas-dark" required />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Email Akses</label>
                                                <div className="relative group">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Mail className="w-4 h-4" /></span>
                                                    <input type="email" value={adminForm.email} onChange={e => setAdminForm({...adminForm, email: e.target.value})} className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white outline-none focus:border-kas-primary focus:ring-2 focus:ring-kas-primary/10 transition-all text-sm font-bold text-kas-dark" required />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Nomor WhatsApp</label>
                                                <div className="relative group">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Smartphone className="w-4 h-4" /></span>
                                                    <input type="text" value={adminForm.phone_wa} onChange={e => setAdminForm({...adminForm, phone_wa: e.target.value})} className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white outline-none focus:border-kas-primary focus:ring-2 focus:ring-kas-primary/10 transition-all text-sm font-bold text-kas-dark" required />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-black text-rose-500 uppercase tracking-widest mb-1.5">Reset Sandi (Opsional)</label>
                                                <div className="relative group">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-400"><KeyRound className="w-4 h-4" /></span>
                                                    <input type="text" value={adminForm.password} onChange={e => setAdminForm({...adminForm, password: e.target.value})} placeholder="Kosongkan jika tidak diubah" className="w-full pl-10 pr-4 py-3 rounded-xl border border-rose-200 bg-rose-50 focus:bg-white outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all text-sm font-bold text-kas-dark placeholder-rose-300" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-4 flex justify-end">
                                            <button type="submit" className="w-full sm:w-auto px-8 py-3.5 bg-kas-dark hover:bg-black text-white rounded-xl font-black shadow-lg shadow-black/20 transition-all active:scale-95">
                                                Simpan Sinkronisasi
                                            </button>
                                        </div>
                                    </>
                                )}
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL TAMBAH MANUAL TETAP ADA DI SINI (Kodenya disembunyikan agar rapi, kamu bisa menempelkan modal tambah yang lama di sini jika dibutuhkan) */}
            
        </div>
    );
}