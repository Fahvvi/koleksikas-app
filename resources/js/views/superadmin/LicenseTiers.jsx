import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const initialFormState = { 
    id: null, name: '', slug: '', price: 0, 
    max_groups: 1, max_members_per_group: 50, 
    features: { wa_group_notif: false, export_pdf: false } 
};

export default function SuperAdminLicenseTiers() {
    const [tiers, setTiers] = useState([]);
    const [isLoadingData, setIsLoadingData] = useState(true);

    // Filter & Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState(initialFormState);

    const Toast = MySwal.mixin({
        toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true,
    });

    // --- FETCH DATA ---
    const fetchTiers = async () => {
        setIsLoadingData(true);
        try {
            const response = await axios.get('/api/v1/super-admin/license-tiers');
            setTiers(response.data.data || []);
        } catch (error) {
            console.error(error);
            // Fallback Dummy jika API belum siap
            setTiers([
                { id: 1, name: 'Free', slug: 'free-plan', price: 0, max_groups: 1, max_members_per_group: 15, is_active: true },
                { id: 2, name: 'Pro', slug: 'pro-plan', price: 55000, max_groups: 3, max_members_per_group: 100, is_active: true },
                { id: 3, name: 'Business', slug: 'business', price: 499000, max_groups: 50, max_members_per_group: 1000, is_active: false }
            ]);
        } finally {
            setIsLoadingData(false);
        }
    };

    useEffect(() => { fetchTiers(); }, []);

    // --- LOGIKA FILTER PENCARIAN ---
    const filteredTiers = tiers.filter((tier) => {
        const matchesSearch = tier.name.toLowerCase().includes(searchTerm.toLowerCase()) || tier.slug.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' ? true : (statusFilter === 'active' ? tier.is_active : !tier.is_active);
        return matchesSearch && matchesStatus;
    });

    // --- HANDLER MODAL & FORM ---
    const openModal = (mode, tier = null) => {
        setModalMode(mode);
        if (mode === 'edit' && tier) {
            // Mencegah error 'uncontrolled input' dengan memastikan default value boolean
            let parsedFeatures = { wa_group_notif: false, export_pdf: false };
            if (typeof tier.features === 'string') {
                try { parsedFeatures = { ...parsedFeatures, ...JSON.parse(tier.features) }; } catch(e){}
            } else if (typeof tier.features === 'object' && tier.features !== null) {
                parsedFeatures = { ...parsedFeatures, ...tier.features };
            }

            setFormData({ 
                ...initialFormState, // Pastikan struktur utuh
                ...tier, 
                name: tier.name || '',
                slug: tier.slug || '',
                features: parsedFeatures 
            });
        } else {
            setFormData(initialFormState);
        }
        setIsModalOpen(true);
    };

    const handleFeatureChange = (e) => {
        setFormData({
            ...formData,
            features: { ...formData.features, [e.target.name]: e.target.checked }
        });
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (modalMode === 'add') {
                await axios.post('/api/v1/super-admin/license-tiers', formData);
                Toast.fire({ icon: 'success', title: 'Paket berhasil ditambahkan!' });
            } else {
                await axios.put(`/api/v1/super-admin/license-tiers/${formData.id}`, formData);
                Toast.fire({ icon: 'success', title: 'Paket berhasil diperbarui!' });
            }
            fetchTiers();
            setIsModalOpen(false);
        } catch (error) {
            MySwal.fire('Gagal!', error.response?.data?.message || 'Terjadi kesalahan.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- TOGGLE STATUS ---
    const toggleStatus = async (id, currentStatus) => {
        try {
            await axios.put(`/api/v1/super-admin/license-tiers/${id}/toggle`);
            fetchTiers();
            Toast.fire({ icon: 'success', title: `Paket berhasil di${currentStatus ? 'nonaktifkan' : 'aktifkan'}!` });
        } catch (error) {
            MySwal.fire('Gagal!', 'Tidak dapat mengubah status paket.', 'error');
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* --- HEADER --- */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black text-kas-dark tracking-tight">Paket Lisensi</h2>
                    <p className="text-kas-soft text-sm mt-1">Kelola harga dan kapasitas tier untuk Mitra.</p>
                </div>
                <button onClick={() => openModal('add')} className="w-full md:w-auto px-6 py-3 bg-kas-primary hover:bg-kas-dark text-white rounded-xl font-bold shadow-lg shadow-kas-primary/30 transition-all active:scale-95 flex items-center justify-center gap-2">
                    <span className="text-lg leading-none">+</span> Tambah Paket
                </button>
            </div>

            {/* --- FILTER BAR --- */}
            <div className="bg-white p-4 rounded-2xl border border-kas-accent/30 shadow-sm flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                    <input 
                        type="text" 
                        placeholder="Cari nama paket atau slug..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-kas-primary focus:ring-1 focus:ring-kas-primary transition-all bg-kas-bg/30 text-sm"
                    />
                </div>
                <div className="w-full sm:w-48">
                    <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-kas-primary focus:ring-1 focus:ring-kas-primary transition-all bg-kas-bg/30 text-sm font-medium text-kas-dark"
                    >
                        <option value="all">Semua Status</option>
                        <option value="active">Hanya Aktif</option>
                        <option value="inactive">Hanya Nonaktif</option>
                    </select>
                </div>
            </div>

            {/* --- TABLE AREA --- */}
            <div className="bg-white rounded-2xl border border-kas-accent/30 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead>
                            <tr className="bg-kas-bg/50 border-b border-kas-accent/30 text-kas-dark text-sm uppercase tracking-wider">
                                <th className="py-4 px-6 font-bold">Nama Paket</th>
                                <th className="py-4 px-6 font-bold text-center">Harga (Rp)</th>
                                <th className="py-4 px-6 font-bold text-center">Kapasitas</th>
                                <th className="py-4 px-6 font-bold text-center">Status</th>
                                <th className="py-4 px-6 font-bold text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {isLoadingData ? (
                                <tr><td colSpan="5" className="py-10 text-center text-gray-500 font-medium">Memuat data paket...</td></tr>
                            ) : filteredTiers.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="py-12 text-center flex flex-col items-center justify-center">
                                        <span className="text-4xl mb-3">📭</span>
                                        <p className="text-kas-dark font-bold text-lg">Tidak ada paket ditemukan</p>
                                        <p className="text-gray-400 text-sm">Coba sesuaikan filter pencarian Anda.</p>
                                    </td>
                                </tr>
                            ) : filteredTiers.map((tier) => (
                                <tr key={tier.id} className="border-b border-kas-accent/20 hover:bg-kas-bg/30 transition-colors">
                                    <td className="py-4 px-6">
                                        <div className="font-bold text-kas-dark text-base">{tier.name}</div>
                                        <div className="text-xs text-kas-soft mt-0.5 font-mono">/{tier.slug}</div>
                                    </td>
                                    <td className="py-4 px-6 text-center font-black text-kas-primary text-base">
                                        {Number(tier.price) === 0 ? 'GRATIS' : Number(tier.price).toLocaleString('id-ID')}
                                    </td>
                                    <td className="py-4 px-6 text-center">
                                        <div className="text-sm font-bold text-gray-700">{tier.max_groups} Grup</div>
                                        <div className="text-xs text-gray-400 font-medium">{tier.max_members_per_group} Member/Grup</div>
                                    </td>
                                    <td className="py-4 px-6 text-center">
                                        <button 
                                            onClick={() => toggleStatus(tier.id, tier.is_active)}
                                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${tier.is_active ? 'bg-green-50 text-green-700 border-green-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200' : 'bg-red-50 text-red-700 border-red-200 hover:bg-green-50 hover:text-green-700 hover:border-green-200'}`}
                                            title="Klik untuk ubah status"
                                        >
                                            {tier.is_active ? 'Aktif' : 'Nonaktif'}
                                        </button>
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                        <button onClick={() => openModal('edit', tier)} className="px-4 py-2 text-kas-primary hover:bg-kas-primary hover:text-white border border-kas-primary/20 rounded-lg font-bold text-sm transition-all">
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- MODAL FORM --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-kas-dark/40 backdrop-blur-sm transition-opacity">
                    <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-kas-accent/50 max-h-[90vh] flex flex-col animate-slide-up sm:animate-fade-in">
                        <div className="bg-kas-bg p-5 sm:p-6 border-b border-kas-accent/30 flex justify-between items-center">
                            <h3 className="text-xl font-black text-kas-dark tracking-tight">
                                {modalMode === 'add' ? 'Tambah Paket Baru' : 'Edit Paket'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-gray-400 hover:text-red-500 hover:bg-red-50 font-bold transition-all">✕</button>
                        </div>
                        
                        <form onSubmit={handleFormSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Nama Paket</label>
                                    <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-kas-primary focus:ring-1 focus:ring-kas-primary transition-all bg-kas-bg/30 text-sm" required placeholder="Cth: Pro Plan" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Slug (URL)</label>
                                    <input type="text" value={formData.slug} onChange={(e) => setFormData({...formData, slug: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-kas-primary focus:ring-1 focus:ring-kas-primary transition-all bg-kas-bg/30 text-sm font-mono" required placeholder="Cth: pro-plan" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Harga Bulanan (Rp)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">Rp</span>
                                    <input type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-kas-primary focus:ring-1 focus:ring-kas-primary transition-all bg-kas-bg/30 text-sm font-bold text-kas-primary" required />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Batas Grup</label>
                                    <input type="number" value={formData.max_groups} onChange={(e) => setFormData({...formData, max_groups: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 outline-none focus:border-kas-primary transition-all text-sm font-bold" required />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Member / Grup</label>
                                    <input type="number" value={formData.max_members_per_group} onChange={(e) => setFormData({...formData, max_members_per_group: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 outline-none focus:border-kas-primary transition-all text-sm font-bold" required />
                                </div>
                            </div>

                            <div className="pt-2">
                                <label className="block text-sm font-bold text-gray-700 mb-3">Akses Fitur Khusus</label>
                                <div className="space-y-3">
                                    <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-kas-bg/50 transition-colors">
                                        <input type="checkbox" name="wa_group_notif" checked={formData.features.wa_group_notif} onChange={handleFeatureChange} className="w-5 h-5 text-kas-primary border-gray-300 rounded focus:ring-kas-primary" />
                                        <div>
                                            <div className="text-sm font-bold text-kas-dark">Notifikasi WhatsApp</div>
                                            <div className="text-xs text-gray-500 mt-0.5">Kirim tagihan otomatis via WA Bot</div>
                                        </div>
                                    </label>
                                    <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-kas-bg/50 transition-colors">
                                        <input type="checkbox" name="export_pdf" checked={formData.features.export_pdf} onChange={handleFeatureChange} className="w-5 h-5 text-kas-primary border-gray-300 rounded focus:ring-kas-primary" />
                                        <div>
                                            <div className="text-sm font-bold text-kas-dark">Export PDF Laporan</div>
                                            <div className="text-xs text-gray-500 mt-0.5">Unduh rekap keuangan komunitas</div>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3 border-t border-gray-100 mt-4 pb-4 sm:pb-0">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors">Batal</button>
                                <button type="submit" disabled={isSubmitting} className="flex-1 py-3.5 bg-kas-primary hover:bg-kas-dark text-white rounded-xl font-bold shadow-lg shadow-kas-primary/30 transition-all disabled:opacity-70 flex justify-center items-center">
                                    {isSubmitting ? 'Memproses...' : 'Simpan Paket'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}