import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

export default function AdminSessions() {
    const [sessions, setSessions] = useState([]);
    const [groups, setGroups] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedSession, setSelectedSession] = useState(null);
    const [detailTab, setDetailTab] = useState('info');
    
    const [searchParticipant, setSearchParticipant] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    const [formData, setFormData] = useState({
        group_id: '', name: '', description: '', scheduled_at: '', end_time: '', 
        location: '', region: '', maps_url: '', price: 0, max_participants: 30, is_public: false,
        type: 'event'
    });

    const Toast = MySwal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [sessionsRes, groupsRes] = await Promise.all([
                axios.get('/api/v1/admin/sessions'),
                axios.get('/api/v1/admin/groups')
            ]);
            setSessions(sessionsRes.data.data || []);
            setGroups(groupsRes.data.data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { 
        fetchData(); 
    }, []);

    const formatRupiah = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
    const formatDate = (dateString) => new Date(dateString).toLocaleString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    const formatForInput = (dateString) => {
        if (!dateString) return '';
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return '';
        const pad = (n) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    const handleExportPDF = async (sessionId, sessionName) => {
        try {
            MySwal.fire({ title: 'Menyiapkan PDF...', text: 'Mohon tunggu', allowOutsideClick: false, didOpen: () => { MySwal.showLoading(); }});
            const response = await axios.get(`/api/v1/admin/sessions/${sessionId}/export`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Daftar-${sessionName}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            MySwal.close();
        } catch (error) {
            MySwal.fire('Gagal!', 'Tidak dapat mengunduh dokumen PDF.', 'error');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = { ...formData, price: parseFloat(formData.price), max_participants: parseInt(formData.max_participants) };
            await axios.post('/api/v1/admin/sessions', payload);
            Toast.fire({ icon: 'success', title: 'Tagihan/Jadwal berhasil dibuat!' });
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            MySwal.fire('Gagal!', error.response?.data?.message || 'Cek kembali form isian.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = { ...formData, price: parseFloat(formData.price), max_participants: parseInt(formData.max_participants) };
            await axios.put(`/api/v1/admin/sessions/${selectedSession.id}`, payload);
            Toast.fire({ icon: 'success', title: 'Data berhasil diperbarui!' });
            setIsDetailModalOpen(false);
            fetchData();
        } catch (error) {
            MySwal.fire('Gagal!', error.response?.data?.message || 'Cek kembali form isian.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = (id, name) => {
        MySwal.fire({
            title: 'Hapus Data?', text: `"${name}" akan dihapus permanen.`, icon: 'warning',
            showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Ya, Hapus!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await axios.delete(`/api/v1/admin/sessions/${id}`);
                    Toast.fire({ icon: 'success', title: 'Berhasil dihapus' });
                    fetchData();
                } catch (e) {
                    MySwal.fire('Gagal', 'Tidak dapat menghapus data ini.', 'error');
                }
            }
        });
    };

    const openDetailModal = async (session, defaultTab = 'info') => {
        setSelectedSession(session);
        setFormData({
            group_id: session.group_id, name: session.name, description: session.description || '',
            scheduled_at: formatForInput(session.scheduled_at), end_time: session.end_time || '',
            location: session.location || '', region: session.region || '', maps_url: session.maps_url || '',
            price: session.price, max_participants: session.max_participants, is_public: session.is_public || false, type: session.type || 'event'
        });
        setDetailTab(defaultTab);
        setSearchParticipant(''); 
        setFilterStatus('all');   
        setIsDetailModalOpen(true);
    };

    const handleConfirmManual = async (userId, userName) => {
        MySwal.fire({
            title: 'Konfirmasi Pembayaran?', text: `Tandai tagihan ${userName} sebagai LUNAS secara manual?`,
            icon: 'question', showCancelButton: true, confirmButtonColor: '#25D366', confirmButtonText: 'Ya, Lunas!', cancelButtonText: 'Batal'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    MySwal.fire({ title: 'Memproses...', allowOutsideClick: false, didOpen: () => MySwal.showLoading() });
                    await axios.post(`/api/v1/admin/sessions/${selectedSession.id}/confirm/${userId}`);
                    MySwal.fire('Berhasil!', 'Pembayaran telah dikonfirmasi.', 'success');
                    fetchData();
                    setIsDetailModalOpen(false);
                } catch (error) {
                    MySwal.fire('Gagal', error.response?.data?.message || 'Terjadi kesalahan.', 'error');
                }
            }
        });
    };

    const handleManualReminder = async (sessionId) => {
        try {
            const result = await MySwal.fire({
                title: 'Kirim Pengingat?', text: "Sistem akan mengirim pesan WA ke member grup yang belum lunas.",
                icon: 'question', showCancelButton: true, confirmButtonText: 'Ya, Kirim Sekarang!', cancelButtonText: 'Batal', confirmButtonColor: '#f97316' 
            });
            if (result.isConfirmed) {
                MySwal.fire({ title: 'Menyiapkan Pengingat...', allowOutsideClick: false, didOpen: () => MySwal.showLoading() });
                const response = await axios.post(`/api/v1/admin/sessions/${sessionId}/remind`);
                MySwal.fire({ icon: 'success', title: 'Berhasil!', text: response.data.message });
            }
        } catch (error) {
            MySwal.fire('Gagal Mengirim', error.response?.data?.message || 'Terjadi kesalahan sistem.', 'error');
        }
    };

    const handleBroadcastWA = async () => {
        MySwal.fire({
            title: 'Kirim Broadcast WA?', text: `Tagihan "${selectedSession.name}" akan dikirim ke semua anggota grup.`,
            icon: 'question', showCancelButton: true, confirmButtonColor: '#25D366', confirmButtonText: 'Kirim Sekarang!', cancelButtonText: 'Batal'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    MySwal.fire({ title: 'Mengirim...', text: 'Mohon tunggu', allowOutsideClick: false, didOpen: () => { MySwal.showLoading(); }});
                    await axios.post(`/api/v1/admin/sessions/${selectedSession.id}/broadcast`);
                    MySwal.fire('Berhasil!', 'Pesan broadcast sedang dikirim ke member.', 'success');
                } catch (error) {
                    MySwal.fire('Gagal', error.response?.data?.message || 'Terjadi kesalahan.', 'error');
                }
            }
        });
    };

    const getBadgeInfo = (type) => {
        switch(type) {
            case 'arisan': return { icon: '🤝', label: 'Arisan', color: 'bg-green-100 text-green-700' };
            case 'iuran': return { icon: '💰', label: 'Iuran', color: 'bg-blue-100 text-blue-700' };
            case 'event': default: return { icon: '⚽', label: 'Event/Mabar', color: 'bg-purple-100 text-purple-700' };
        }
    };

    const getFilteredParticipants = () => {
        if (!selectedSession || !selectedSession.all_participants) return [];
        return selectedSession.all_participants.filter(p => {
            const nameMatch = (p.name || '').toLowerCase().includes((searchParticipant || '').toLowerCase());
            const phoneMatch = (p.phone || '').includes(searchParticipant || '');
            const matchesSearch = nameMatch || phoneMatch;
            const matchesStatus = filterStatus === 'all' ? true : (filterStatus === 'paid' ? p.status === 'paid' : p.status !== 'paid');
            return matchesSearch && matchesStatus;
        });
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black text-kas-dark tracking-tight">Tagihan & Jadwal</h2>
                    <p className="text-kas-soft text-sm mt-1">Buat tagihan arisan, uang kas, atau jadwal mabar untuk komunitas.</p>
                </div>
                <button onClick={() => { 
                    setFormData({ group_id: groups[0]?.id || '', name: '', description: '', scheduled_at: '', end_time: '', location: '', region: '', maps_url: '', price: 0, max_participants: 30, is_public: false, type: 'event' }); 
                    setIsModalOpen(true); 
                }} className="px-5 py-2.5 bg-kas-primary hover:bg-kas-dark text-white rounded-xl font-bold shadow-lg shadow-kas-primary/20 transition-all active:scale-95 flex items-center gap-2">
                    <span className="text-xl leading-none">+</span> Buat Baru
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {isLoading ? (
                    <div className="col-span-full text-center py-10 text-gray-500 font-bold">Memuat data...</div>
                ) : sessions.length === 0 ? (
                    <div className="col-span-full bg-white p-10 rounded-2xl border border-dashed border-gray-300 text-center">
                        <span className="text-5xl opacity-50 block mb-4">📝</span>
                        <h3 className="font-bold text-gray-700 text-lg">Belum Ada Tagihan/Jadwal</h3>
                    </div>
                ) : sessions.map(session => {
                    const badge = getBadgeInfo(session.type);
                    return (
                        <div key={session.id} className="bg-white rounded-2xl border border-kas-accent/30 shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col relative">
                            <div className="p-5 border-b border-gray-100 flex-1">
                                <div className="flex flex-wrap items-center gap-2 mb-3">
                                    <span className={`px-2.5 py-1 text-[10px] font-black rounded uppercase tracking-wider ${badge.color}`}>
                                        {badge.icon} {badge.label}
                                    </span>
                                    {session.is_public && (
                                        <span className="bg-orange-500 text-white text-[9px] font-black px-2 py-1 rounded shadow-sm tracking-wider uppercase">
                                            🌐 Publik
                                        </span>
                                    )}
                                </div>
                                <h3 className="text-lg font-black text-kas-dark leading-tight line-clamp-2">{session.name}</h3>
                                <p className="text-xs font-bold text-kas-primary mt-1 truncate">{session.group?.name}</p>
                                <div className="mt-4 space-y-2 text-sm text-gray-600 font-medium">
                                    <div className="flex items-center gap-2"><span>🕒</span> {formatDate(session.scheduled_at)}</div>
                                    <div className="flex items-center gap-2"><span>💸</span> {Number(session.price) === 0 ? 'Suka-suka' : formatRupiah(session.price)} / Orang</div>
                                </div>
                            </div>
                            
                            <div className="bg-gray-50 p-4 border-t border-gray-100 flex flex-col gap-3">
                                <div className="text-sm flex justify-between w-full">
                                    <span className="text-gray-500 font-bold text-xs">Lunas:</span>
                                    <div>
                                        <span className="font-black text-kas-dark">{session.participants_count}</span>
                                        <span className="text-gray-400 text-xs font-bold"> / {session.max_participants}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2 w-full mt-1">
                                    <button onClick={() => openDetailModal(session, 'info')} className="flex-1 py-1.5 bg-white border border-gray-200 hover:border-kas-primary text-kas-primary text-xs font-bold rounded-lg transition-colors shadow-sm">Detail</button>
                                    <button onClick={() => openDetailModal(session, 'edit')} className="flex-1 py-1.5 bg-white border border-gray-200 hover:border-orange-500 text-orange-500 text-xs font-bold rounded-lg transition-colors shadow-sm">Edit</button>
                                    <button onClick={() => handleDelete(session.id, session.name)} className="px-3 py-1.5 text-red-500 hover:bg-red-50 text-xs font-bold rounded-lg transition-colors border border-transparent">Hapus</button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* --- MODAL DETAIL SESI --- */}
            {isDetailModalOpen && selectedSession && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-kas-dark/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="bg-kas-dark p-6 border-b border-gray-100 flex justify-between items-start text-white relative flex-shrink-0">
                            <div className="pr-8">
                                <h3 className="text-2xl font-black leading-tight flex flex-wrap items-center gap-2">
                                    {selectedSession.name} 
                                    {selectedSession.is_public && <span className="bg-orange-500 text-[10px] px-2 py-0.5 rounded uppercase tracking-wider">Publik</span>}
                                </h3>
                                <p className="text-gray-300 text-sm mt-1">{selectedSession.group?.name}</p>
                            </div>
                            <button onClick={() => setIsDetailModalOpen(false)} className="text-gray-400 hover:text-white text-2xl font-bold absolute top-4 right-5">✕</button>
                        </div>
                        
                        <div className="flex border-b border-gray-200 bg-gray-50 flex-shrink-0 overflow-x-auto">
                            <button onClick={() => setDetailTab('info')} className={`flex-1 min-w-[100px] py-3 text-sm font-bold transition-all ${detailTab === 'info' ? 'text-kas-primary border-b-2 border-kas-primary bg-white' : 'text-gray-500 hover:text-gray-700'}`}>📋 Info</button>
                            <button onClick={() => setDetailTab('participants')} className={`flex-1 min-w-[120px] py-3 text-sm font-bold transition-all flex items-center justify-center gap-2 ${detailTab === 'participants' ? 'text-kas-primary border-b-2 border-kas-primary bg-white' : 'text-gray-500 hover:text-gray-700'}`}>
                                👥 Lunas <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-[10px]">{selectedSession.participants_count}</span>
                            </button>
                            <button onClick={() => setDetailTab('edit')} className={`flex-1 min-w-[100px] py-3 text-sm font-bold transition-all ${detailTab === 'edit' ? 'text-kas-primary border-b-2 border-kas-primary bg-white' : 'text-gray-500 hover:text-gray-700'}`}>✏️ Edit</button>
                        </div>

                        <div className="p-6 bg-kas-bg/30 overflow-y-auto flex-1">
                            {detailTab === 'info' && (
                                <div className="space-y-6 animate-slide-up">
                                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3 text-sm">
                                        <div className="flex gap-3"><span className="text-xl">🕒</span><div><p className="text-gray-400 text-xs font-bold uppercase">Tenggat Waktu</p><p className="font-bold text-kas-dark">{formatDate(selectedSession.scheduled_at)}</p></div></div>
                                        <hr className="border-gray-50"/>
                                        <div className="flex justify-between items-center">
                                            <div className="flex gap-3"><span className="text-xl">💸</span><div><p className="text-gray-400 text-xs font-bold uppercase">Tagihan</p><p className="font-black text-kas-primary text-base">{Number(selectedSession.price) === 0 ? 'Gratis' : formatRupiah(selectedSession.price)}</p></div></div>
                                            <div className="text-right"><p className="text-gray-400 text-xs font-bold uppercase">Target/Kuota</p><p className="font-black text-kas-dark text-base">{selectedSession.participants_count} <span className="text-gray-400 font-medium text-xs">/ {selectedSession.max_participants}</span></p></div>
                                        </div>
                                    </div>
                                    
                                    {selectedSession.type === 'event' && selectedSession.location && (
                                        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className="text-xl">📍</span>
                                                <div>
                                                    <p className="font-bold text-gray-800 text-sm">{selectedSession.location}</p>
                                                    <p className="text-xs text-gray-400">{selectedSession.region || 'Lokasi Kegiatan'}</p>
                                                </div>
                                            </div>
                                            {selectedSession.maps_url && (
                                                <a href={selectedSession.maps_url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">Buka Maps</a>
                                            )}
                                        </div>
                                    )}

                                    {selectedSession.description && (
                                        <div>
                                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Deskripsi / Catatan</h4>
                                            <p className="text-sm text-gray-700 bg-white p-4 rounded-xl border border-gray-100">{selectedSession.description}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {detailTab === 'participants' && (
                                <div className="animate-slide-up space-y-4">
                                    <div className="flex gap-2">
                                        <button onClick={() => handleManualReminder(selectedSession.id)} className="flex-1 py-2 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-xl text-[11px] font-black tracking-wide uppercase transition-all flex items-center justify-center gap-2">📢 Colek Belum Bayar</button>
                                        <button onClick={() => handleExportPDF(selectedSession.id, selectedSession.name)} className="flex-1 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2">📄 Export PDF</button>
                                    </div>
                                    
                                    <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                                        <input type="text" placeholder="🔍 Cari nama atau no WA..." value={searchParticipant} onChange={(e) => setSearchParticipant(e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-kas-primary transition-colors"/>
                                        <div className="flex bg-gray-50 rounded-lg p-1">
                                            <button onClick={() => setFilterStatus('all')} className={`flex-1 text-xs font-bold py-1.5 rounded-md transition-colors ${filterStatus === 'all' ? 'bg-white shadow-sm text-kas-dark' : 'text-gray-500 hover:text-gray-700'}`}>Semua</button>
                                            <button onClick={() => setFilterStatus('paid')} className={`flex-1 text-xs font-bold py-1.5 rounded-md transition-colors ${filterStatus === 'paid' ? 'bg-green-100 text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Lunas</button>
                                            <button onClick={() => setFilterStatus('pending')} className={`flex-1 text-xs font-bold py-1.5 rounded-md transition-colors ${filterStatus === 'pending' ? 'bg-orange-100 text-orange-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Belum Bayar</button>
                                        </div>
                                    </div>
                                    
                                    {getFilteredParticipants().length > 0 ? (
                                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
                                            {getFilteredParticipants().map((p, index) => (
                                                <div key={p.id || index} className="flex justify-between items-center p-4 hover:bg-gray-50 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-kas-bg text-kas-dark font-black flex items-center justify-center text-xs border border-gray-200 flex-shrink-0">
                                                            {(p.name || '?').charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-gray-800 text-sm">{p.name}</p>
                                                            <p className="text-[10px] text-gray-400 font-medium">{p.phone}</p>
                                                        </div>
                                                    </div>
                                                    
                                                    {p.status === 'paid' ? (
                                                        <span className="bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase flex items-center gap-1"><span>✓</span> LUNAS</span>
                                                    ) : (
                                                        <button onClick={() => handleConfirmManual(p.id, p.name)} className="bg-kas-primary hover:bg-kas-dark text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-colors shadow-sm">Tandai Lunas</button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8"><div className="text-3xl mb-2 opacity-30">🔍</div><p className="text-gray-500 font-bold text-xs">Peserta tidak ditemukan.</p></div>
                                    )}
                                </div>
                            )}

                            {detailTab === 'edit' && (
                                <form onSubmit={handleUpdate} className="space-y-5 animate-slide-up">
                                    <div className="grid grid-cols-1 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Jenis Penagihan</label>
                                            <select required value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-kas-primary outline-none text-sm font-bold text-kas-primary">
                                                <option value="event">⚽ Event / Mabar Olahraga</option>
                                                <option value="arisan">🤝 Arisan Bulanan</option>
                                                <option value="iuran">💰 Iuran Kas Komunitas</option>
                                            </select>
                                        </div>
                                        <div><label className="block text-sm font-bold text-gray-700 mb-1">Judul Sesi/Tagihan</label><input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-kas-primary outline-none text-sm" /></div>
                                        <div><label className="block text-sm font-bold text-gray-700 mb-1">Tenggat Waktu / Tgl Acara</label><input type="datetime-local" required value={formData.scheduled_at} onChange={e => setFormData({...formData, scheduled_at: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-kas-primary outline-none text-sm" /></div>
                                        <div className="flex gap-3">
                                            <div className="flex-1"><label className="block text-sm font-bold text-gray-700 mb-1">Nominal (Rp)</label><input type="number" required min="0" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-kas-primary outline-none text-sm" /></div>
                                            <div className="flex-1"><label className="block text-sm font-bold text-gray-700 mb-1">Target Kuota</label><input type="number" required min="1" value={formData.max_participants} onChange={e => setFormData({...formData, max_participants: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-kas-primary outline-none text-sm" /></div>
                                        </div>
                                        
                                        {formData.type === 'event' && (
                                            <>
                                                <div><label className="block text-sm font-bold text-gray-700 mb-1">Jam Selesai (Opsional)</label><input type="time" value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-kas-primary outline-none text-sm" /></div>
                                                
                                                <div className="p-4 bg-purple-50 border border-purple-100 rounded-xl space-y-4">
                                                    <div><label className="block text-xs font-bold text-purple-900 mb-1">Nama Lokasi/Venue</label><input type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-kas-primary outline-none text-sm" placeholder="Cth: Futsal Kopi Hitam" /></div>
                                                    
                                                    {/* 👇 INPUT TEKS MANUAL UNTUK WILAYAH 👇 */}
                                                    <div><label className="block text-xs font-bold text-purple-900 mb-1">Wilayah / Kota</label><input type="text" value={formData.region} onChange={e => setFormData({...formData, region: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-kas-primary outline-none text-sm" placeholder="Cth: Cileungsi, Bogor" /></div>

                                                    <div><label className="block text-xs font-bold text-purple-900 mb-1">Link Google Maps (Opsional)</label><input type="url" value={formData.maps_url} onChange={e => setFormData({...formData, maps_url: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-kas-primary outline-none text-sm text-blue-600" placeholder="Cth: https://maps.app.goo.gl/..." /></div>
                                                </div>
                                            </>
                                        )}

                                        <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl mt-4">
                                            <div>
                                                <p className="text-sm font-bold text-gray-800">Sesi Publik (Open Play)</p>
                                                <p className="text-xs text-gray-500 mt-0.5">Izinkan pendaftaran dari luar grup.</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" className="sr-only peer" checked={formData.is_public} onChange={(e) => setFormData({...formData, is_public: e.target.checked})} />
                                                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-kas-primary"></div>
                                            </label>
                                        </div>

                                        <div><label className="block text-sm font-bold text-gray-700 mb-1">Deskripsi / Catatan</label><textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-kas-primary outline-none text-sm" rows="2"></textarea></div>
                                    </div>
                                    <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-kas-primary hover:bg-kas-dark text-white rounded-xl font-bold transition-all disabled:opacity-70 mt-2">
                                        {isSubmitting ? 'Memproses...' : 'Simpan Perubahan'}
                                    </button>
                                </form>
                            )}
                        </div>

                        <div className="p-5 bg-white border-t border-gray-100 flex flex-col gap-3 flex-shrink-0">
                            {!selectedSession.is_public && (
                                <button onClick={handleBroadcastWA} className="w-full py-3 bg-[#25D366] hover:bg-[#1DA851] text-white rounded-xl font-black text-sm shadow-lg shadow-green-200 transition-transform active:scale-95 flex items-center justify-center gap-2">
                                    Broadcast Tagihan via WA
                                </button>
                            )}
                            <button onClick={() => setIsDetailModalOpen(false)} className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-kas-dark rounded-xl font-bold text-sm transition-colors">Tutup</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL FORM CREATE SESI */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-kas-bg">
                            <h3 className="text-xl font-bold text-kas-dark">Buat Sesi / Tagihan</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 text-xl font-bold">✕</button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2 bg-blue-50 p-4 rounded-xl border border-blue-100">
                                    <label className="block text-sm font-black text-blue-900 mb-2 uppercase tracking-wide">Pilih Jenis Penagihan</label>
                                    <div className="flex gap-2">
                                        <label className={`flex-1 p-3 rounded-lg border-2 cursor-pointer transition-all text-center font-bold text-xs ${formData.type === 'event' ? 'border-kas-primary bg-white text-kas-primary shadow-sm' : 'border-transparent bg-white/50 text-gray-500 hover:bg-white'}`}>
                                            <input type="radio" name="type" value="event" className="hidden" onChange={() => setFormData({...formData, type: 'event'})} />
                                            ⚽ Event / Mabar
                                        </label>
                                        <label className={`flex-1 p-3 rounded-lg border-2 cursor-pointer transition-all text-center font-bold text-xs ${formData.type === 'arisan' ? 'border-kas-primary bg-white text-kas-primary shadow-sm' : 'border-transparent bg-white/50 text-gray-500 hover:bg-white'}`}>
                                            <input type="radio" name="type" value="arisan" className="hidden" onChange={() => setFormData({...formData, type: 'arisan'})} />
                                            🤝 Arisan
                                        </label>
                                        <label className={`flex-1 p-3 rounded-lg border-2 cursor-pointer transition-all text-center font-bold text-xs ${formData.type === 'iuran' ? 'border-kas-primary bg-white text-kas-primary shadow-sm' : 'border-transparent bg-white/50 text-gray-500 hover:bg-white'}`}>
                                            <input type="radio" name="type" value="iuran" className="hidden" onChange={() => setFormData({...formData, type: 'iuran'})} />
                                            💰 Iuran Kas
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Pilih Komunitas (Grup)</label>
                                    <select required value={formData.group_id} onChange={e => setFormData({...formData, group_id: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-kas-primary outline-none">
                                        <option value="" disabled>-- Pilih Grup --</option>
                                        {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                    </select>
                                </div>
                                <div><label className="block text-sm font-bold text-gray-700 mb-1">Judul / Nama Acara</label><input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-kas-primary outline-none" placeholder="Cth: Arisan Bulan Mei" /></div>
                                
                                <div><label className="block text-sm font-bold text-gray-700 mb-1">Tenggat Waktu / Tgl Acara</label><input type="datetime-local" required value={formData.scheduled_at} onChange={e => setFormData({...formData, scheduled_at: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-kas-primary outline-none" /></div>
                                <div><label className="block text-sm font-bold text-gray-700 mb-1">Batas Kuota Lunas</label><input type="number" required min="1" value={formData.max_participants} onChange={e => setFormData({...formData, max_participants: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-kas-primary outline-none" /></div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Nominal Iuran (Rp)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">Rp</span>
                                        <input type="number" required min="0" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-kas-primary outline-none font-black text-kas-primary" />
                                    </div>
                                </div>
                                
                                {formData.type === 'event' && (
                                    <>
                                        <div className="md:col-span-2"><label className="block text-sm font-bold text-gray-700 mb-1">Jam Selesai (Opsional)</label><input type="time" value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-kas-primary outline-none" /></div>
                                        
                                        <div className="md:col-span-2 p-4 bg-purple-50 border border-purple-100 rounded-xl space-y-4">
                                            <div><label className="block text-xs font-bold text-purple-900 mb-1">Nama Lokasi/Venue</label><input type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-kas-primary outline-none" placeholder="Cth: Futsal Kopi Hitam" /></div>
                                            
                                            {/* 👇 INPUT TEKS MANUAL UNTUK WILAYAH 👇 */}
                                            <div><label className="block text-xs font-bold text-purple-900 mb-1">Wilayah / Kota</label><input type="text" value={formData.region} onChange={e => setFormData({...formData, region: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-kas-primary outline-none" placeholder="Cth: Cileungsi, Bogor" /></div>

                                            <div><label className="block text-xs font-bold text-purple-900 mb-1">Link Google Maps (Opsional)</label><input type="url" value={formData.maps_url} onChange={e => setFormData({...formData, maps_url: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-kas-primary outline-none text-blue-600" placeholder="Cth: https://maps.app.goo.gl/..." /></div>
                                        </div>
                                    </>
                                )}

                                <div className="md:col-span-2 flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl mt-2">
                                    <div>
                                        <p className="text-sm font-bold text-gray-800">Sesi Publik (Open Play)</p>
                                        <p className="text-xs text-gray-500 mt-0.5">Izinkan pendaftaran dari luar grup (via link/share).</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" checked={formData.is_public} onChange={(e) => setFormData({...formData, is_public: e.target.checked})} />
                                        <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-kas-primary"></div>
                                    </label>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-kas-dark rounded-xl font-bold">Batal</button>
                                <button type="submit" disabled={isSubmitting} className="flex-1 py-3 bg-kas-primary hover:bg-kas-dark text-white rounded-xl font-bold transition-all disabled:opacity-70">
                                    {isSubmitting ? 'Memproses...' : 'Simpan Data'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}