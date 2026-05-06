import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

export default function Settings() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    // State Mode Tampilan (Read/Edit)
    const [isEditing, setIsEditing] = useState(false);
    
    // State Pengaturan
    const [paymentType, setPaymentType] = useState('koleksikas'); 
    const [paymentData, setPaymentData] = useState({ project: '', api_key: '', client_key: '', server_key: '', qr_image: null });
    const [waSettings, setWaSettings] = useState({ is_active: true, daily_summary: true });
    const [payoutData, setPayoutData] = useState({ bank_name: '', account_number: '', account_holder: '' });
    
    // 👇 State untuk Gating Fitur Lisensi
    const [allowedGateways, setAllowedGateways] = useState(['koleksikas']);

    useEffect(() => { fetchSettings(); }, []);

    const fetchSettings = async () => {
        try {
            const response = await axios.get('/api/v1/admin/settings');
            const { payment, whatsapp, type, payout, allowed_gateways } = response.data.data;
            
            if (allowed_gateways) setAllowedGateways(allowed_gateways);
            if (type) setPaymentType(type);
            if (payment) setPaymentData(prev => ({ ...prev, ...payment }));
            if (whatsapp) setWaSettings(prev => ({ ...prev, ...whatsapp }));
            if (payout) setPayoutData(prev => ({ ...prev, ...payout }));
            
        } catch (error) { 
            console.error('Gagal mengambil pengaturan:', error); 
        } finally { 
            setIsLoading(false); 
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await axios.post('/api/v1/admin/settings', {
                type: paymentType,
                payment: paymentData,
                whatsapp: waSettings,
                payout: payoutData,
            });
            MySwal.fire('Berhasil!', 'Pengaturan Anda telah diperbarui.', 'success');
            setIsEditing(false); 
            fetchSettings(); 
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Terjadi kesalahan saat menyimpan.';
            MySwal.fire('Gagal Menyimpan!', errorMsg, 'error');
        } finally { 
            setIsSaving(false); 
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                MySwal.fire('Gagal', 'Ukuran gambar tidak boleh lebih dari 2MB', 'error');
                e.target.value = '';
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => setPaymentData(prev => ({ ...prev, qr_image: reader.result }));
            reader.readAsDataURL(file);
        }
    };

    const gatewayNames = {
        koleksikas: '✨ KoleksiKAS (Gateway Terpusat)',
        pakasir: '🚀 Pakasir (QRIS Dinamis Mandiri)',
        midtrans: '💳 Midtrans (Otomatis)',
        static_qris: '🖼️ QRIS Statis (Manual)'
    };

    if (isLoading) return <div className="p-10 text-center animate-pulse font-bold text-gray-500">Memuat Pengaturan...</div>;

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 animate-fade-in">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-black text-gray-800">Pengaturan Mitra</h2>
                    <p className="text-gray-500 text-sm mt-1">Konfigurasi pembayaran dan integrasi sistem Anda.</p>
                </div>
                {!isEditing && (
                    <button 
                        onClick={() => setIsEditing(true)}
                        className="py-2.5 px-5 bg-gray-900 hover:bg-kas-primary text-white rounded-xl font-bold text-sm shadow-lg transition-all"
                    >
                        Ubah Pengaturan
                    </button>
                )}
            </div>

            {/* ========================================== */}
            {/* MODE 1: RINGKASAN (READ-ONLY)              */}
            {/* ========================================== */}
            {!isEditing ? (
                <div className="space-y-6 animate-slide-up">
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-6 items-start">
                        <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center text-3xl shrink-0">🏦</div>
                        <div className="flex-1 space-y-4 w-full">
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Gateway Pembayaran Aktif</p>
                                <p className="text-lg font-black text-gray-800">{gatewayNames[paymentType] || paymentType}</p>
                            </div>
                            
                            {paymentType === 'koleksikas' ? (
                                payoutData.account_number ? (
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-500 uppercase">Rekening Pencairan</p>
                                            <p className="font-black text-gray-800">{payoutData.bank_name} - {payoutData.account_number}</p>
                                            <p className="text-xs text-gray-500 font-medium">a.n {payoutData.account_holder}</p>
                                        </div>
                                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">Terhubung</span>
                                    </div>
                                ) : (
                                    <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-bold text-red-500 uppercase">Rekening Belum Diatur</p>
                                            <p className="text-xs text-red-700 font-medium">Klik "Ubah Pengaturan" untuk memasukkan rekening pencairan Anda.</p>
                                        </div>
                                    </div>
                                )
                            ) : null}

                            {paymentType === 'pakasir' && paymentData.project && (
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase">Project Slug Pakasir</p>
                                    <p className="font-black text-gray-800">{paymentData.project}</p>
                                </div>
                            )}

                            {paymentType === 'midtrans' && paymentData.client_key && (
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase">Midtrans Client Key</p>
                                    <p className="font-black text-gray-800">{paymentData.client_key}</p>
                                    <p className="text-xs text-green-600 font-bold mt-1">Server Key tersimpan dengan aman ✓</p>
                                </div>
                            )}

                            {paymentType === 'static_qris' && paymentData.qr_image && (
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">Preview QRIS Tersimpan</p>
                                    <img src={paymentData.qr_image} alt="QRIS Tersimpan" className="h-32 object-contain rounded-lg border border-gray-200 bg-white p-2" />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-6">
                        <div className="w-16 h-16 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center text-3xl shrink-0">💬</div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Notifikasi WhatsApp</p>
                            <p className="text-lg font-black text-gray-800">
                                Rekap Harian: <span className={waSettings.daily_summary ? 'text-green-500' : 'text-red-500'}>
                                    {waSettings.daily_summary ? 'Aktif' : 'Nonaktif'}
                                </span>
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
            /* ========================================== */
            /* MODE 2: EDIT (FORM PENGATURAN)             */
            /* ========================================== */
                <div className="space-y-8 animate-slide-up bg-gray-50/50 p-6 rounded-3xl border border-dashed border-gray-200">
                    
                    {/* --- KOTAK: PAYMENT GATEWAY --- */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-6 bg-kas-dark text-white flex items-center gap-3">
                            <span className="text-2xl">💳</span>
                            <div>
                                <h3 className="font-bold">Metode Pembayaran</h3>
                                <p className="text-xs text-gray-400 font-medium">Pilih bagaimana member membayar iuran mereka.</p>
                            </div>
                        </div>
                        <div className="p-6 space-y-6">
                            
                            {/* 👇 PILIHAN GATEWAY BERDASARKAN LISENSI 👇 */}
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase mb-3">Pilih Gateway</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    
                                    {/* KoleksiKAS */}
                                    <label className={`relative p-4 border-2 rounded-2xl cursor-pointer transition-all ${paymentType === 'koleksikas' ? 'border-kas-primary bg-kas-primary/5' : 'border-gray-200'}`}>
                                        <input type="radio" name="provider" value="koleksikas" className="hidden" 
                                            onChange={() => setPaymentType('koleksikas')} checked={paymentType === 'koleksikas'} />
                                        <div className="font-black text-kas-dark mb-1 text-sm">✨ KoleksiKAS</div>
                                        <p className="text-xs text-gray-500 font-medium">Bebas repot, saldo dicairkan manual ke rekening.</p>
                                    </label>

                                    {/* Pakasir */}
                                    <label className={`relative p-4 border-2 rounded-2xl transition-all ${!allowedGateways.includes('pakasir') ? 'opacity-50 cursor-not-allowed bg-gray-50' : paymentType === 'pakasir' ? 'border-kas-primary bg-kas-primary/5 cursor-pointer' : 'border-gray-200 cursor-pointer'}`}>
                                        <input type="radio" name="provider" value="pakasir" className="hidden" 
                                            disabled={!allowedGateways.includes('pakasir')} onChange={() => setPaymentType('pakasir')} checked={paymentType === 'pakasir'} />
                                        <div className="flex justify-between items-center mb-1">
                                            <div className="font-black text-kas-dark text-sm">🚀 Pakasir</div>
                                            {!allowedGateways.includes('pakasir') && <span title="Eksklusif Pro/Business" className="text-sm">🔒</span>}
                                        </div>
                                        <p className="text-xs text-gray-500 font-medium">Uang otomatis masuk rekening Anda.</p>
                                    </label>

                                    {/* Midtrans */}
                                    <label className={`relative p-4 border-2 rounded-2xl transition-all ${!allowedGateways.includes('midtrans') ? 'opacity-50 cursor-not-allowed bg-gray-50' : paymentType === 'midtrans' ? 'border-kas-primary bg-kas-primary/5 cursor-pointer' : 'border-gray-200 cursor-pointer'}`}>
                                        <input type="radio" name="provider" value="midtrans" className="hidden" 
                                            disabled={!allowedGateways.includes('midtrans')} onChange={() => setPaymentType('midtrans')} checked={paymentType === 'midtrans'} />
                                        <div className="flex justify-between items-center mb-1">
                                            <div className="font-black text-kas-dark text-sm">💳 Midtrans</div>
                                            {!allowedGateways.includes('midtrans') && <span title="Eksklusif Business" className="text-sm">🔒</span>}
                                        </div>
                                        <p className="text-xs text-gray-500 font-medium">Terima VA, E-Wallet, CC otomatis.</p>
                                    </label>

                                    {/* Static QRIS */}
                                    <label className={`relative p-4 border-2 rounded-2xl transition-all ${!allowedGateways.includes('static_qris') ? 'opacity-50 cursor-not-allowed bg-gray-50' : paymentType === 'static_qris' ? 'border-kas-primary bg-kas-primary/5 cursor-pointer' : 'border-gray-200 cursor-pointer'}`}>
                                        <input type="radio" name="provider" value="static_qris" className="hidden" 
                                            disabled={!allowedGateways.includes('static_qris')} onChange={() => setPaymentType('static_qris')} checked={paymentType === 'static_qris'} />
                                        <div className="flex justify-between items-center mb-1">
                                            <div className="font-black text-kas-dark text-sm">🖼️ QRIS Statis</div>
                                            {!allowedGateways.includes('static_qris') && <span title="Eksklusif Business" className="text-sm">🔒</span>}
                                        </div>
                                        <p className="text-xs text-gray-500 font-medium">Tanpa potongan fee, konfirmasi manual.</p>
                                    </label>

                                </div>
                            </div>

                            <div className="p-4 bg-kas-bg/30 rounded-2xl border border-dashed border-gray-200">
                                {paymentType === 'koleksikas' && (
                                    <div className="space-y-2 text-center py-4">
                                        <div className="text-4xl mb-2">✨</div>
                                        <h4 className="font-black text-gray-800">Gateway Terpusat KoleksiKAS</h4>
                                        <p className="text-sm font-medium text-gray-500 max-w-sm mx-auto leading-relaxed">
                                            Anda tidak perlu repot mendaftar Payment Gateway. Dana member akan dikelola oleh sistem pusat dan dapat dicairkan ke rekening Anda kapan saja, biasanya di proses maks 2x24 Jam.
                                        </p>
                                    </div>
                                )}
                                
                                {paymentType === 'pakasir' && (
                                    <div className="space-y-4">
                                        <div className="text-xs font-bold text-kas-primary mb-2 italic">* Gunakan Opsi C (Transaction Create API) di Pakasir.</div>
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Project Slug</label>
                                            <input type="text" value={paymentData.project || ''} onChange={e => setPaymentData({...paymentData, project: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl" placeholder="contoh: koleksikas-futsal" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">API Key</label>
                                            <input type="password" value={paymentData.api_key || ''} onChange={e => setPaymentData({...paymentData, api_key: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl" placeholder="••••••••••••" />
                                        </div>
                                    </div>
                                )}

                                {paymentType === 'midtrans' && (
                                    <div className="space-y-4">
                                        <div className="text-xs font-bold text-blue-600 mb-2 italic">* Masukkan kredensial dari dashboard Midtrans (Environment Production/Sandbox).</div>
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Client Key</label>
                                            <input type="text" value={paymentData.client_key || ''} onChange={e => setPaymentData({...paymentData, client_key: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl" placeholder="Mid-client-..." />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Server Key</label>
                                            <input type="password" value={paymentData.server_key || ''} onChange={e => setPaymentData({...paymentData, server_key: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl" placeholder="Mid-server-..." />
                                        </div>
                                    </div>
                                )}

                                {paymentType === 'static_qris' && (
                                    <div className="space-y-4">
                                        <div className="text-xs font-bold text-orange-600 mb-2 italic">* Member akan men-scan QRIS ini. Konfirmasi pelunasan dilakukan manual oleh Admin.</div>
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Unggah Gambar QRIS Statis</label>
                                            <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full p-3 border border-gray-200 rounded-xl bg-white text-sm" />
                                        </div>
                                        {paymentData.qr_image && (
                                            <div className="mt-4 p-4 bg-white border border-gray-100 rounded-xl inline-block">
                                                <p className="text-[10px] font-black text-gray-400 uppercase mb-2 text-center">Preview QRIS</p>
                                                <img src={paymentData.qr_image} alt="QRIS Preview" className="h-32 mx-auto object-contain" />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* --- KOTAK: WHATSAPP NOTIF --- */}
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

                    {/* --- KOTAK: PAYOUT / REKENING --- */}
                    {paymentType === 'koleksikas' && (
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden animate-slide-up">
                        <div className="p-6 bg-blue-600 text-white flex items-center gap-3">
                            <span className="text-2xl">🏦</span>
                            <div>
                                <h3 className="font-bold">Informasi Rekening & Pencairan</h3>
                                <p className="text-xs text-blue-100 font-medium">Rekening ini akan tersimpan dan digunakan untuk pencairan dana Mabar.</p>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Nama Bank</label>
                                    <select 
                                        value={payoutData.bank_name} 
                                        onChange={e => setPayoutData({...payoutData, bank_name: e.target.value})}
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-700 outline-none focus:border-blue-500"
                                    >
                                        <option value="">Pilih Bank</option>
                                        <option value="BCA">BCA</option>
                                        <option value="MANDIRI">Mandiri</option>
                                        <option value="BNI">BNI</option>
                                        <option value="BRI">BRI</option>
                                        <option value="SEABANK">SeaBank</option>
                                        <option value="JAGO">Bank Jago</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Nomor Rekening</label>
                                    <input 
                                        type="text" 
                                        value={payoutData.account_number} 
                                        onChange={e => setPayoutData({...payoutData, account_number: e.target.value})}
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none focus:border-blue-500" 
                                        placeholder="Contoh: 801234567" 
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Nama Pemilik Rekening (Sesuai Buku Tabungan)</label>
                                <input 
                                    type="text" 
                                    value={payoutData.account_holder} 
                                    onChange={e => setPayoutData({...payoutData, account_holder: e.target.value})}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none focus:border-blue-500" 
                                    placeholder="Contoh: Muhammad Fahmi Fadhillah" 
                                />
                            </div>
                        </div>
                    </div>
                    )}

                    {/* ACTION BUTTONS */}
                    <div className="flex flex-col-reverse md:flex-row gap-4 pt-4">
                        <button 
                            onClick={() => { setIsEditing(false); fetchSettings(); }}
                            className="w-full md:w-1/3 py-4 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-2xl font-black text-lg transition-all active:scale-95"
                        >
                            Batal Edit
                        </button>
                        <button 
                            onClick={handleSave} 
                            disabled={isSaving}
                            className="w-full md:w-2/3 py-4 bg-kas-primary hover:bg-kas-dark text-white rounded-2xl font-black text-lg shadow-xl shadow-kas-primary/20 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}