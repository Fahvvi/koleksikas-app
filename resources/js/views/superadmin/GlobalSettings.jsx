import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

export default function SuperAdminGlobalSettings() {
    const [activeTab, setActiveTab] = useState('general');
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // State untuk menampung semua setting
    const [settings, setSettings] = useState({
        app_name: 'KoleksiKas',
        platform_fee: 0,
        maintenance_mode: 'false',
        pakasir_project: '', // <-- Tambahan Baru
        pakasir_api_key: '',
        pakasir_endpoint: 'https://api.pakasir.com/v1',
        waha_endpoint: 'http://localhost:3000',
        waha_default_session: 'default',
    });

    const Toast = MySwal.mixin({
        toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true,
    });

    // Ambil data dari database
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await axios.get('/api/v1/super-admin/settings');
                if (response.data.data && Object.keys(response.data.data).length > 0) {
                    setSettings(prev => ({ ...prev, ...response.data.data }));
                }
            } catch (error) {
                console.error("Gagal mengambil settings", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, []);

    // Handler Perubahan Input
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (checked ? 'true' : 'false') : value
        }));
    };

    // Handler Simpan
    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await axios.put('/api/v1/super-admin/settings', settings);
            Toast.fire({ icon: 'success', title: 'Pengaturan berhasil disimpan!' });
        } catch (error) {
            MySwal.fire('Gagal Menyimpan', error.response?.data?.message || 'Terjadi kesalahan.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="p-10 text-center font-bold text-gray-500 animate-pulse">Memuat Pengaturan...</div>;

    return (
        <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-black text-kas-dark tracking-tight">Pengaturan Sistem</h2>
                <p className="text-kas-soft text-sm mt-1">Konfigurasi API Gateway, biaya layanan, dan operasional KoleksiKas.</p>
            </div>

            <div className="bg-white rounded-2xl border border-kas-accent/30 shadow-sm overflow-hidden flex flex-col md:flex-row">
                
                {/* --- SIDEBAR TABS --- */}
                <div className="w-full md:w-64 bg-gray-50 border-b md:border-b-0 md:border-r border-gray-100 p-4 flex md:flex-col gap-2 overflow-x-auto">
                    <button 
                        onClick={() => setActiveTab('general')} 
                        className={`text-left px-4 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'general' ? 'bg-kas-primary text-white shadow-md' : 'text-gray-600 hover:bg-gray-200'}`}
                    >
                        ⚙️ General & Platform
                    </button>
                    <button 
                        onClick={() => setActiveTab('payment')} 
                        className={`text-left px-4 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'payment' ? 'bg-kas-primary text-white shadow-md' : 'text-gray-600 hover:bg-gray-200'}`}
                    >
                        💳 Payment Gateway
                    </button>
                    <button 
                        onClick={() => setActiveTab('whatsapp')} 
                        className={`text-left px-4 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'whatsapp' ? 'bg-kas-primary text-white shadow-md' : 'text-gray-600 hover:bg-gray-200'}`}
                    >
                        💬 WhatsApp API (Waha)
                    </button>
                </div>

                {/* --- FORM AREA --- */}
                <form onSubmit={handleSave} className="flex-1 flex flex-col min-h-[500px]">
                    <div className="p-6 md:p-8 flex-1 overflow-y-auto">
                        
                        {/* TAB: GENERAL */}
                        {activeTab === 'general' && (
                            <div className="space-y-6 animate-slide-up">
                                <h3 className="text-xl font-black text-kas-dark border-b border-gray-100 pb-2">General Settings</h3>
                                
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Nama Aplikasi</label>
                                    <input type="text" name="app_name" value={settings.app_name} onChange={handleChange} className="w-full md:w-1/2 px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-kas-primary focus:ring-1 focus:ring-kas-primary transition-all bg-kas-bg/30 text-sm" />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Biaya Platform (Rp) / Transaksi Sukses</label>
                                    <p className="text-xs text-gray-500 mb-2">Biaya admin yang akan dipotong dari setiap transaksi tagihan.</p>
                                    <input type="number" name="platform_fee" value={settings.platform_fee} onChange={handleChange} className="w-full md:w-1/2 px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-kas-primary focus:ring-1 focus:ring-kas-primary transition-all bg-kas-bg/30 text-sm font-bold text-kas-primary" />
                                </div>

                                <div className="p-4 bg-red-50 border border-red-100 rounded-xl mt-6">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input type="checkbox" name="maintenance_mode" checked={settings.maintenance_mode === 'true'} onChange={handleChange} className="w-5 h-5 text-red-600 rounded border-red-300 focus:ring-red-600" />
                                        <div>
                                            <div className="font-bold text-red-800">Aktifkan Maintenance Mode</div>
                                            <div className="text-xs text-red-600 mt-0.5">Jika aktif, seluruh tenant dan API publik akan ditutup untuk perbaikan.</div>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* TAB: PAYMENT */}
                        {activeTab === 'payment' && (
                            <div className="space-y-6 animate-slide-up">
                                <h3 className="text-xl font-black text-kas-dark border-b border-gray-100 pb-2">Pakasir Integration</h3>
                                <p className="text-sm text-gray-500">Konfigurasi utama API Gateway untuk proses Tagihan & Pembayaran.</p>
                                
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Pakasir Project Slug</label>
                                    <p className="text-xs text-gray-500 mb-2">Diambil dari URL project Pakasir kamu (contoh: koleksikas).</p>
                                    <input type="text" name="pakasir_project" value={settings.pakasir_project || ''} onChange={handleChange} placeholder="Masukkan slug proyek" className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-kas-primary transition-all bg-kas-bg/30 text-sm font-mono" />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Pakasir API Key</label>
                                    <p className="text-xs text-gray-500 mb-2">Dapatkan dari menu Detail Proyek di Dashboard Pakasir.</p>
                                    <input type="password" name="pakasir_api_key" value={settings.pakasir_api_key || ''} onChange={handleChange} placeholder="xxx123..." className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-kas-primary transition-all bg-kas-bg/30 text-sm font-mono" />
                                </div>
                            </div>
                        )}

                        {/* TAB: WHATSAPP */}
                        {activeTab === 'whatsapp' && (
                            <div className="space-y-6 animate-slide-up">
                                <h3 className="text-xl font-black text-kas-dark border-b border-gray-100 pb-2">Waha API Integration</h3>
                                
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Waha Core Endpoint</label>
                                    <input type="url" name="waha_endpoint" value={settings.waha_endpoint} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-kas-primary transition-all bg-kas-bg/30 text-sm font-mono" />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Default Session Name</label>
                                    <p className="text-xs text-gray-500 mb-2">Nama sesi default untuk mengirim pesan global (contoh OTP).</p>
                                    <input type="text" name="waha_default_session" value={settings.waha_default_session} onChange={handleChange} className="w-full md:w-1/2 px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-kas-primary transition-all bg-kas-bg/30 text-sm font-mono" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Form Footer Action */}
                    <div className="p-4 md:p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
                        <button type="submit" disabled={isSaving} className="px-8 py-3 bg-kas-primary hover:bg-kas-dark text-white rounded-xl font-bold shadow-lg shadow-kas-primary/30 transition-all active:scale-95 disabled:opacity-70 flex items-center gap-2">
                            {isSaving ? 'Menyimpan...' : '💾 Simpan Perubahan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}