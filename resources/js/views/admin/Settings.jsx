import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

export default function Settings() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    // State Pengaturan
    const [paymentType, setPaymentType] = useState('pakasir'); // pakasir, midtrans, static_qris
    const [paymentData, setPaymentData] = useState({ project: '', api_key: '', client_key: '', server_key: '', qr_image: null });
    const [waSettings, setWaSettings] = useState({ is_active: true, daily_summary: true });

    useEffect(() => { fetchSettings(); }, []);

    const fetchSettings = async () => {
        try {
            const response = await axios.get('/api/v1/admin/settings');
            const { payment, whatsapp, type } = response.data.data;
            if (payment) setPaymentData(payment);
            if (type) setPaymentType(type);
            if (whatsapp) setWaSettings(whatsapp);
        } catch (error) { console.error(error); }
        finally { setIsLoading(false); }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await axios.post('/api/v1/admin/settings', {
                type: paymentType,
                payment: paymentData,
                whatsapp: waSettings
            });
            MySwal.fire('Berhasil!', 'Pengaturan Anda telah diperbarui.', 'success');
        } catch (error) {
            MySwal.fire('Gagal!', 'Terjadi kesalahan saat menyimpan.', 'error');
        } finally { setIsSaving(false); }
    };

    if (isLoading) return <div className="p-10 text-center animate-pulse">Memuat Pengaturan...</div>;

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 animate-fade-in">
            <div>
                <h2 className="text-3xl font-black text-gray-800">Pengaturan Mitra</h2>
                <p className="text-gray-500 text-sm">Konfigurasi pembayaran dan integrasi WhatsApp Anda.</p>
            </div>

            {/* --- SECTION: PAYMENT GATEWAY --- */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 bg-kas-dark text-white flex items-center gap-3">
                    <span className="text-2xl">💳</span>
                    <div>
                        <h3 className="font-bold">Metode Pembayaran</h3>
                        <p className="text-xs text-gray-400 font-medium">Pilih bagaimana member membayar iuran mereka.</p>
                    </div>
                </div>
                <div className="p-6 space-y-6">
                    <div>
                        <label className="block text-xs font-black text-gray-400 uppercase mb-2">Pilih Gateway</label>
                        <select 
                            value={paymentType} 
                            onChange={(e) => setPaymentType(e.target.value)}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-700 focus:ring-2 focus:ring-kas-primary outline-none"
                        >
                            <option value="pakasir">Pakasir (QRIS Dinamis Otomatis)</option>
                            <option value="midtrans">Midtrans (E-Wallet & Bank Otomatis)</option>
                            <option value="static_qris">QRIS Statis (Manual - Tanpa Potongan)</option>
                        </select>
                    </div>

                    {/* INPUT DINAMIS BERDASARKAN TIPE */}
                    <div className="p-4 bg-kas-bg/30 rounded-2xl border border-dashed border-gray-200">
                        {paymentType === 'pakasir' && (
                            <div className="space-y-4">
                                <div className="text-xs font-bold text-kas-primary mb-2 italic">* Gunakan Opsi C (Transaction Create API) di Pakasir.</div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Project Slug</label>
                                    <input type="text" value={paymentData.project} onChange={e => setPaymentData({...paymentData, project: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl" placeholder="contoh: koleksikas-futsal" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">API Key</label>
                                    <input type="password" value={paymentData.api_key} onChange={e => setPaymentData({...paymentData, api_key: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl" placeholder="••••••••••••" />
                                </div>
                            </div>
                        )}

                        {paymentType === 'midtrans' && (
                            <div className="space-y-4 text-center py-4">
                                <div className="text-4xl mb-2">🚧</div>
                                <p className="text-sm font-bold text-gray-500 uppercase">Fitur Midtrans Segera Hadir</p>
                            </div>
                        )}

                        {paymentType === 'static_qris' && (
                            <div className="space-y-4">
                                <div className="text-xs font-bold text-orange-600 mb-2 italic">* Member akan scan QRIS ini secara manual. Admin harus konfirmasi pembayaran secara manual.</div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Unggah Gambar QRIS Statis</label>
                                    <input type="file" className="w-full p-3 border border-gray-200 rounded-xl bg-white" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- SECTION: WHATSAPP NOTIF --- */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 bg-green-600 text-white flex items-center gap-3">
                    <span className="text-2xl">💬</span>
                    <div>
                        <h3 className="font-bold">Notifikasi WhatsApp</h3>
                        <p className="text-xs text-green-100 font-medium">Atur bagaimana sistem memberi tahu Anda dan member.</p>
                    </div>
                </div>
                <div className="p-6 space-y-4">
                    <label className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl cursor-pointer hover:bg-gray-100 transition-colors">
                        <div>
                            <p className="font-bold text-gray-800">Rekap Harian Admin</p>
                            <p className="text-xs text-gray-500">Kirim daftar siapa yang sudah bayar hari ini setiap jam 6 sore.</p>
                        </div>
                        <input 
                            type="checkbox" 
                            checked={waSettings.daily_summary} 
                            onChange={e => setWaSettings({...waSettings, daily_summary: e.target.checked})}
                            className="w-6 h-6 text-green-600 rounded-lg focus:ring-green-500"
                        />
                    </label>
                </div>
            </div>

            <button 
                onClick={handleSave} 
                disabled={isSaving}
                className="w-full py-4 bg-kas-primary hover:bg-kas-dark text-white rounded-2xl font-black text-lg shadow-xl shadow-kas-primary/20 transition-all active:scale-95 disabled:opacity-50"
            >
                {isSaving ? 'Menyimpan...' : 'Simpan Semua Pengaturan'}
            </button>
        </div>
    );
}