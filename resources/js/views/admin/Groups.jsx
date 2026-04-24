import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

export default function AdminGroups() {
    const [groups, setGroups] = useState([]);
    const [isLoadingData, setIsLoadingData] = useState(true);

    // --- State untuk Modal ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({ id: null, name: '', sport_type: 'Futsal', description: '' });

    // Toast Notification Config
    const Toast = MySwal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
    });

    // GET Data dari API
    const fetchGroups = async () => {
        try {
            // Asumsi token/auth sudah di-handle oleh interceptor axios atau Sanctum
            const response = await axios.get('/api/v1/admin/groups');
            setGroups(response.data.data || []); 
            setIsLoadingData(false);
        } catch (error) {
            console.error("Gagal mengambil data:", error);
            setIsLoadingData(false);
            // Fallback ke dummy sementara jika API belum siap
            setGroups([
                { id: 1, name: 'Futsal Sabtu Pagi (Dummy)', sport_type: 'Futsal', members_count: 15, status: 'Aktif' }
            ]);
        }
    };

    useEffect(() => {
        fetchGroups();
    }, []);

    const openModal = (mode, group = null) => {
        setModalMode(mode);
        if (mode === 'edit' && group) {
            setFormData(group);
        } else {
            setFormData({ id: null, name: '', sport_type: 'Futsal', description: '' });
        }
        setIsModalOpen(true);
    };

    // ACTION: POST & PUT
    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (modalMode === 'add') {
                await axios.post('/api/v1/admin/groups', formData);
                Toast.fire({ icon: 'success', title: 'Grup berhasil ditambahkan!' });
            } else {
                await axios.put(`/api/v1/admin/groups/${formData.id}`, formData);
                Toast.fire({ icon: 'success', title: 'Grup berhasil diperbarui!' });
            }
            
            fetchGroups(); // Refresh tabel
            setIsModalOpen(false);
        } catch (error) {
            console.error(error);
            MySwal.fire({
                icon: 'error',
                title: 'Gagal!',
                text: error.response?.data?.message || 'Terjadi kesalahan sistem.',
                confirmButtonColor: '#842A3B'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in relative">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black text-kas-dark tracking-tight">Komunitas Saya</h2>
                    <p className="text-kas-soft text-sm mt-1">Kelola grup olahraga dan daftar anggotanya.</p>
                </div>
                <button onClick={() => openModal('add')} className="px-5 py-2.5 bg-kas-primary hover:bg-kas-dark text-white rounded-xl font-bold shadow-lg shadow-kas-primary/20 transition-all active:scale-95 flex items-center gap-2">
                    <span className="text-xl leading-none">+</span> Tambah Grup Baru
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-kas-accent/30 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-kas-bg/50 border-b border-kas-accent/30 text-kas-dark text-sm">
                                <th className="py-4 px-6 font-bold">Nama Komunitas</th>
                                <th className="py-4 px-6 font-bold text-center">Anggota</th>
                                <th className="py-4 px-6 font-bold text-center">Status</th>
                                <th className="py-4 px-6 font-bold text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {isLoadingData ? (
                                <tr><td colSpan="4" className="py-8 text-center text-gray-500">Memuat data...</td></tr>
                            ) : groups.map((group) => (
                                <tr key={group.id} className="border-b border-kas-accent/20 hover:bg-kas-bg/30 transition-colors">
                                    <td className="py-4 px-6">
                                        <div className="font-bold text-kas-dark text-base">{group.name}</div>
                                        <div className="text-xs text-kas-soft font-medium mt-0.5">{group.sport_type}</div>
                                    </td>
                                    <td className="py-4 px-6 text-center">
                                        <span className="inline-flex items-center justify-center bg-kas-accent/20 text-kas-dark font-bold px-3 py-1 rounded-full border border-kas-accent/50">
                                            {group.members_count || 0} orang
                                        </span>
                                    </td>
                                    <td className="py-4 px-6 text-center">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${group.status === 'Aktif' || !group.status ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {group.status || 'Aktif'}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link to={`/admin/groups/${group.id}`} className="p-2 text-kas-primary hover:bg-kas-primary/10 rounded-lg transition-colors font-semibold text-sm">
                                                Detail
                                            </Link>
                                            <button onClick={() => openModal('edit', group)} className="p-2 text-gray-400 hover:text-kas-dark hover:bg-gray-100 rounded-lg transition-colors font-semibold text-sm">
                                                Edit
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL FORM */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-kas-accent/50">
                        <div className="bg-kas-bg p-6 border-b border-kas-accent/30 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-kas-dark">
                                {modalMode === 'add' ? 'Tambah Grup Baru' : 'Edit Grup'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 font-bold text-xl transition-colors">✕</button>
                        </div>
                        <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-kas-dark mb-1">Nama Grup</label>
                                <input 
                                    type="text" required
                                    value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-kas-soft outline-none bg-kas-bg/50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-kas-dark mb-1">Jenis Olahraga</label>
                                <select 
                                    value={formData.sport_type} onChange={(e) => setFormData({...formData, sport_type: e.target.value})}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-kas-soft outline-none bg-kas-bg/50"
                                >
                                    <option value="Futsal">Futsal</option>
                                    <option value="Minisoccer">Minisoccer</option>
                                    <option value="Badminton">Badminton</option>
                                    <option value="Lainnya">Lainnya</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-kas-dark mb-1">Deskripsi</label>
                                <textarea 
                                    rows="3"
                                    value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-kas-soft outline-none bg-kas-bg/50 resize-none"
                                ></textarea>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-kas-dark rounded-xl font-bold transition-colors">Batal</button>
                                <button type="submit" disabled={isSubmitting} className="flex-1 py-3 bg-kas-primary hover:bg-kas-dark text-white rounded-xl font-bold shadow-lg shadow-kas-primary/20 transition-all disabled:opacity-70">
                                    {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}