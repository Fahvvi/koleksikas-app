import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

export default function AdminSessions() {
    const [sessions, setSessions] = useState([]);
    const [groups, setGroups] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Modal State (Create)
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Modal State (Detail)
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedSession, setSelectedSession] = useState(null);

    // state untuk tab detail sesi (info, peserta, edit)
    const [detailTab, setDetailTab] = useState('info');
    
    const [formData, setFormData] = useState({
        group_id: '', name: '', description: '', scheduled_at: '', end_time: '', 
        location: '', maps_url: '', price: 0, max_participants: 30, is_public: false
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

    useEffect(() => { fetchData(); }, []);

    const formatRupiah = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
    const formatDate = (dateString) => new Date(dateString).toLocaleString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = { ...formData, price: parseFloat(formData.price), max_participants: parseInt(formData.max_participants) };
            await axios.post('/api/v1/admin/sessions', payload);
            Toast.fire({ icon: 'success', title: 'Jadwal berhasil dibuat!' });
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            MySwal.fire('Gagal!', error.response?.data?.message || 'Cek kembali form isian.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = (id, name) => {
        MySwal.fire({
            title: 'Batalkan Sesi?', text: `Sesi "${name}" akan dibatalkan dan dihapus.`, icon: 'warning',
            showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Ya, Hapus!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await axios.delete(`/api/v1/admin/sessions/${id}`);
                    Toast.fire({ icon: 'success', title: 'Sesi berhasil dihapus' });
                    fetchData();
                } catch (e) {
                    MySwal.fire('Gagal', 'Tidak dapat menghapus sesi.', 'error');
                }
            }
        });
    };

    // Buka Modal Detail
    const openDetailModal = async (session) => {
        setSelectedSession(session);
        setIsDetailModalOpen(true);
    };


    const handleManualReminder = async (sessionId) => {
        try {
            // Konfirmasi sebelum mengirim spam
            const result = await MySwal.fire({
                title: 'Kirim Pengingat?',
                text: "Sistem akan mengirim pesan WA ke member grup yang belum membayar/mengamankan slot.",
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Ya, Kirim Sekarang!',
                cancelButtonText: 'Batal',
                confirmButtonColor: '#f97316' // Warna orange agar serasi dengan tombolnya
            });

            if (result.isConfirmed) {
                MySwal.fire({
                    title: 'Menyiapkan Pengingat...',
                    text: 'Sistem sedang menembak pesan WhatsApp.',
                    allowOutsideClick: false,
                    didOpen: () => MySwal.showLoading()
                });

                const response = await axios.post(`/api/v1/admin/sessions/${sessionId}/remind`);

                MySwal.fire({
                    icon: 'success',
                    title: 'Berhasil!',
                    text: response.data.message
                });
            }
        } catch (error) {
            MySwal.fire('Gagal Mengirim', error.response?.data?.message || 'Terjadi kesalahan sistem.', 'error');
        }
    };

    // Eksekusi Broadcast WA
    const handleBroadcastWA = async () => {
        MySwal.fire({
            title: 'Kirim Broadcast WA?',
            text: `Pemberitahuan sesi "${selectedSession.name}" akan dikirim ke semua anggota grup.`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#25D366', // Warna khas WhatsApp
            confirmButtonText: 'Kirim Sekarang!',
            cancelButtonText: 'Batal'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    MySwal.fire({ title: 'Mengirim...', text: 'Mohon tunggu', allowOutsideClick: false, didOpen: () => { MySwal.showLoading(); }});
                    
                    await axios.post(`/api/v1/admin/sessions/${selectedSession.id}/broadcast`);
                    
                    MySwal.fire('Berhasil!', 'Pesan broadcast sedang dikirim ke member.', 'success');
                } catch (error) {
                    MySwal.fire('Gagal', 'Terjadi kesalahan saat mengirim broadcast.', 'error');
                }
            }
        });
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black text-kas-dark tracking-tight">Jadwal Sesi Main</h2>
                    <p className="text-kas-soft text-sm mt-1">Buat jadwal Mabar, tentukan lokasi dan biaya pendaftaran.</p>
                </div>
                <button onClick={() => { setFormData({ group_id: groups[0]?.id || '', name: '', description: '', scheduled_at: '', end_time: '', location: '', maps_url: '', price: 0, max_participants: 30, is_public: false }); setIsModalOpen(true); }} className="px-5 py-2.5 bg-kas-primary hover:bg-kas-dark text-white rounded-xl font-bold shadow-lg shadow-kas-primary/20 transition-all active:scale-95 flex items-center gap-2">
                    <span className="text-xl leading-none">+</span> Buat Sesi Baru
                </button>
            </div>

            {/* List Sesi */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {isLoading ? (
                    <div className="col-span-full text-center py-10 text-gray-500 font-bold">Memuat jadwal...</div>
                ) : sessions.length === 0 ? (
                    <div className="col-span-full bg-white p-10 rounded-2xl border border-dashed border-gray-300 text-center">
                        <span className="text-5xl opacity-50 block mb-4">📅</span>
                        <h3 className="font-bold text-gray-700 text-lg">Belum Ada Jadwal</h3>
                    </div>
                ) : sessions.map(session => (
                    <div key={session.id} className="bg-white rounded-2xl border border-kas-accent/30 shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                        <div className="p-5 border-b border-gray-100 flex-1">
                            <div className="flex justify-between items-start mb-3">
                                <span className={`px-2.5 py-1 text-[10px] font-black rounded uppercase tracking-wider ${session.is_public ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                                    {session.is_public ? '🌐 Publik' : '🔒 Khusus Member'}
                                </span>
                                <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded">
                                    {session.status}
                                </span>
                            </div>
                            <h3 className="text-lg font-black text-kas-dark leading-tight">{session.name}</h3>
                            <p className="text-xs font-bold text-kas-primary mt-1">{session.group?.name}</p>
                            
                            <div className="mt-4 space-y-2 text-sm text-gray-600 font-medium">
                                <div className="flex items-center gap-2"><span>🕒</span> {formatDate(session.scheduled_at)}</div>
                                <div className="flex items-center gap-2"><span>📍</span> <span className="truncate">{session.location}</span></div>
                                <div className="flex items-center gap-2"><span>💸</span> {Number(session.price) === 0 ? 'Gratis' : formatRupiah(session.price)} / Orang</div>
                            </div>
                        </div>
                        <div className="bg-gray-50 p-4 border-t border-gray-100 flex justify-between items-center">
                            <div className="text-sm">
                                <span className="font-black text-kas-dark">{session.participants_count}</span>
                                <span className="text-gray-400 text-xs font-bold"> / {session.max_participants} Pemain</span>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => openDetailModal(session)} className="px-3 py-1.5 bg-white border border-gray-200 hover:border-kas-primary text-kas-primary text-xs font-bold rounded-lg transition-colors shadow-sm">Detail</button>
                                <button onClick={() => handleDelete(session.id, session.name)} className="px-3 py-1.5 text-red-500 hover:bg-red-50 text-xs font-bold rounded-lg transition-colors">Hapus</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* --- MODAL DETAIL SESI & BROADCAST WA --- */}
            {isDetailModalOpen && selectedSession && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-kas-dark/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                        
                        {/* Header Modal */}
                        <div className="bg-kas-dark p-6 border-b border-gray-100 flex justify-between items-start text-white relative flex-shrink-0">
                            <div className="pr-8">
                                <span className={`inline-block mb-2 px-2.5 py-1 text-[10px] font-black rounded uppercase tracking-wider ${selectedSession.is_public ? 'bg-purple-500 text-white' : 'bg-gray-600 text-white'}`}>
                                    {selectedSession.is_public ? '🌐 Open Play (Publik)' : '🔒 Private (Khusus Member)'}
                                </span>
                                <h3 className="text-2xl font-black leading-tight">{selectedSession.name}</h3>
                                <p className="text-gray-300 text-sm mt-1">{selectedSession.group?.name}</p>
                            </div>
                            <button onClick={() => setIsDetailModalOpen(false)} className="text-gray-400 hover:text-white text-2xl font-bold absolute top-4 right-5">✕</button>
                        </div>
                        
                        {/* Tab Navigasi */}
                        <div className="flex border-b border-gray-200 bg-gray-50 flex-shrink-0">
                            <button 
                                onClick={() => setDetailTab('info')} 
                                className={`flex-1 py-3 text-sm font-bold transition-all ${detailTab === 'info' ? 'text-kas-primary border-b-2 border-kas-primary bg-white' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                📋 Info Sesi
                            </button>
                            <button 
                                onClick={() => setDetailTab('participants')} 
                                className={`flex-1 py-3 text-sm font-bold transition-all flex items-center justify-center gap-2 ${detailTab === 'participants' ? 'text-kas-primary border-b-2 border-kas-primary bg-white' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                👥 Daftar Peserta 
                                <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-[10px]">{selectedSession.participants_count}</span>
                            </button>
                        </div>

                        {/* Body Modal (Scrollable) */}
                        <div className="p-6 bg-kas-bg/30 overflow-y-auto flex-1">
                            
                            {/* KONTEN TAB: INFO */}
                            {detailTab === 'info' && (
                                <div className="space-y-6 animate-slide-up">
                                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3 text-sm">
                                        <div className="flex gap-3"><span className="text-xl">🕒</span><div><p className="text-gray-400 text-xs font-bold uppercase">Waktu</p><p className="font-bold text-kas-dark">{formatDate(selectedSession.scheduled_at)}</p></div></div>
                                        <hr className="border-gray-50"/>
                                        <div className="flex gap-3"><span className="text-xl">📍</span><div><p className="text-gray-400 text-xs font-bold uppercase">Lokasi</p><p className="font-bold text-kas-dark">{selectedSession.location}</p></div></div>
                                        <hr className="border-gray-50"/>
                                        <div className="flex justify-between items-center">
                                            <div className="flex gap-3"><span className="text-xl">💸</span><div><p className="text-gray-400 text-xs font-bold uppercase">HTM (Harga)</p><p className="font-black text-kas-primary text-base">{Number(selectedSession.price) === 0 ? 'Gratis' : formatRupiah(selectedSession.price)}</p></div></div>
                                            <div className="text-right">
                                                <p className="text-gray-400 text-xs font-bold uppercase">Slot Terisi</p>
                                                <p className="font-black text-kas-dark text-base">{selectedSession.participants_count} <span className="text-gray-400 font-medium text-xs">/ {selectedSession.max_participants}</span></p>
                                            </div>
                                        </div>
                                    </div>

                                    {selectedSession.description && (
                                        <div>
                                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Deskripsi / Catatan</h4>
                                            <p className="text-sm text-gray-700 bg-white p-4 rounded-xl border border-gray-100">{selectedSession.description}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* KONTEN TAB: PARTICIPANTS */}
                            {detailTab === 'participants' && (
                                <div className="animate-slide-up">

                                    {/* ACTION BUTTONS */}
                                        <div className="flex gap-2 mb-4">
                                            <button 
                                            onClick={() => handleManualReminder(selectedSession.id)}
                                            className="flex-1 py-2 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-xl text-[11px] font-black tracking-wide uppercase transition-all flex items-center justify-center gap-2"
                                        >
                                            📢 Colek yang Belum Bayar
                                            </button>
                                            <button 
                                                onClick={() => window.open(`/api/v1/admin/sessions/${selectedSession.id}/export-pdf`, '_blank')}
                                                className="flex-1 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2"
                                            >
                                                📄 Export PDF Absen
                                            </button>
                                        </div>
                                    {selectedSession.confirmed_participants?.length > 0 ? (
                                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
                                            {selectedSession.confirmed_participants.map((p, index) => (
                                                <div key={index} className="flex justify-between items-center p-4 hover:bg-gray-50">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-kas-primary/10 text-kas-primary font-black flex items-center justify-center text-xs">
                                                            {index + 1}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-gray-800 text-sm">{p.name}</p>
                                                            <p className="text-xs text-gray-400">{p.phone}</p>
                                                        </div>
                                                    </div>
                                                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-[10px] font-black uppercase">Paid</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <div className="text-4xl mb-2 opacity-50">🤷‍♂️</div>
                                            <p className="text-gray-500 font-bold text-sm">Belum ada peserta yang mendaftar/membayar.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                        </div>

                        {/* Footer Modal (Fixed Bottom) */}
                        <div className="p-5 bg-white border-t border-gray-100 flex flex-col gap-3 flex-shrink-0">
                            <button onClick={handleBroadcastWA} className="w-full py-3.5 bg-[#25D366] hover:bg-[#1DA851] text-white rounded-xl font-black text-sm shadow-lg shadow-green-200 transition-transform active:scale-95 flex items-center justify-center gap-2">
                                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                                Broadcast Info ke WhatsApp Grup
                            </button>
                            <button onClick={() => setIsDetailModalOpen(false)} className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-kas-dark rounded-xl font-bold text-sm transition-colors">
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL FORM CREATE SESI (Tidak Berubah dari Sebelumnya) */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-kas-bg">
                            <h3 className="text-xl font-bold text-kas-dark">Buat Jadwal Sesi</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 text-xl font-bold">✕</button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Pilih Komunitas (Grup)</label>
                                <select required value={formData.group_id} onChange={e => setFormData({...formData, group_id: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-kas-primary outline-none">
                                    <option value="" disabled>-- Pilih Grup --</option>
                                    {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Nama Sesi (Event)</label>
                                    <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-kas-primary outline-none" placeholder="Cth: Mabar Futsal Santai" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Tgl & Jam Mulai</label>
                                    <input type="datetime-local" required value={formData.scheduled_at} onChange={e => setFormData({...formData, scheduled_at: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-kas-primary outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Jam Selesai (Opsional)</label>
                                    <input type="time" value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-kas-primary outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Nama Lokasi/Venue</label>
                                    <input type="text" required value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-kas-primary outline-none" placeholder="Cth: GOR Cibubur" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Link Google Maps (Opsional)</label>
                                    <input type="url" value={formData.maps_url} onChange={e => setFormData({...formData, maps_url: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-kas-primary outline-none" placeholder="https://maps.app.goo.gl/..." />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Harga Iuran (HTM)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">Rp</span>
                                        <input type="number" required min="0" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-kas-primary outline-none font-bold text-kas-primary" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Batas Kuota Pemain</label>
                                    <input type="number" required min="1" value={formData.max_participants} onChange={e => setFormData({...formData, max_participants: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-kas-primary outline-none" />
                                </div>
                            </div>

                            <div className="p-4 bg-purple-50 border border-purple-100 rounded-xl">
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input type="checkbox" checked={formData.is_public} onChange={e => setFormData({...formData, is_public: e.target.checked})} className="mt-1 w-5 h-5 text-purple-600 rounded focus:ring-purple-500" />
                                    <div>
                                        <div className="text-sm font-bold text-purple-900">Jadikan Sesi Publik (Open Play)</div>
                                        <div className="text-xs text-purple-700 mt-1">Jika dicentang, sesi ini akan muncul di halaman depan KoleksiKas dan bisa didaftar oleh orang luar komunitas.</div>
                                    </div>
                                </label>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-kas-dark rounded-xl font-bold">Batal</button>
                                <button type="submit" disabled={isSubmitting} className="flex-1 py-3 bg-kas-primary hover:bg-kas-dark text-white rounded-xl font-bold transition-all disabled:opacity-70">
                                    {isSubmitting ? 'Memproses...' : 'Simpan Jadwal'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}