import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { QRCodeSVG } from 'qrcode.react';

const MySwal = withReactContent(Swal);

export default function MitraCheckout() {
    const { mitraId } = useParams();
    const navigate = useNavigate();
    
    const [tiers, setTiers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedTier, setSelectedTier] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [paymentData, setNeedsPayment] = useState(null);
    const [formData, setFormData] = useState({
        password: '',
        password_confirmation: ''
    });

    useEffect(() => {
        const fetchTiers = async () => {
            try {
                const response = await axios.get('/api/v1/public/license-tiers');
                if (response.data && Array.isArray(response.data.data)) {
                    const activeTiers = response.data.data.filter(t => t.is_active == true || t.is_active == 1);
                    setTiers(activeTiers);
                    if (activeTiers.length > 0) setSelectedTier(activeTiers[0].slug);
                } else {
                    MySwal.fire('Oops', 'Terjadi kesalahan format data dari server.', 'error');
                }
            } catch (error) {
                MySwal.fire('Gagal', 'Tidak dapat memuat paket lisensi.', 'error');
            } finally {
                setIsLoading(false);
            }
        };
        fetchTiers();
    }, []);

    // 👇 LOGIKA POLLING: Mengecek status pembayaran tiap 5 detik jika QRIS tampil
    useEffect(() => {
        let interval;
        if (paymentData) {
            interval = setInterval(async () => {
                try {
                    const res = await axios.get(`/api/v1/public/mitra/${mitraId}/status`);
                    if (res.data.status === 'active') {
                        clearInterval(interval);
                        setNeedsPayment(null);
                        MySwal.fire({
                            icon: 'success',
                            title: 'Pembayaran Diterima! 🎉',
                            text: 'Ruang kerja komunitas Anda sudah siap.',
                            confirmButtonColor: '#842A3B'
                        }).then(() => navigate('/auth/login', { replace: true }));
                    }
                } catch (e) {
                    console.error("Gagal cek status", e);
                }
            }, 5000);
        }
        return () => clearInterval(interval);
    }, [paymentData, mitraId, navigate]);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.password_confirmation) {
            MySwal.fire({ icon: 'error', title: 'Oops!', text: 'Konfirmasi kata sandi tidak cocok.', confirmButtonColor: '#842A3B' });
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                mitra_id: mitraId,
                license_tier_slug: selectedTier,
                password: formData.password
            };

            const response = await axios.post('/api/v1/mitra/activate', payload);
            
            if (response.data.needs_payment) {
                setNeedsPayment(response.data.data);
            } else {
                MySwal.fire({
                    icon: 'success',
                    title: 'Aktivasi Berhasil! 🎉',
                    text: 'Ruang kerja komunitas Anda sudah siap.',
                    confirmButtonColor: '#842A3B'
                }).then(() => navigate('/auth/login', { replace: true }));
            }
        } catch (error) {
            MySwal.fire({
                icon: 'error',
                title: 'Aktivasi Gagal',
                text: error.response?.data?.message || 'Terjadi kesalahan sistem.',
                confirmButtonColor: '#842A3B'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderFeatures = (featuresData) => {
        if (!featuresData) return null;
        try {
            let parsed = typeof featuresData === 'string' ? JSON.parse(featuresData) : featuresData;
            const featureLabels = {
                'wa_group_notif': 'Notifikasi WhatsApp Group',
                'wa_bot_bill': 'Tagihan otomatis via WA Bot',
                'export_pdf': 'Export PDF Laporan Absensi',
                'finance_recap': 'Rekap keuangan komunitas',
                'qris': 'Terima Pembayaran QRIS Otomatis',
                'wa_personal': 'Kirim Pesan WA Personal',
                'wa_group': 'Kirim Pesan WA ke Grup',
                'multi_admin': 'Dukungan Multi-Admin',
                'export': 'Export Data Excel & PDF',
                'custom_wa_template': 'Kustomisasi Pesan WA Bot',
                'auto_recap': 'Rekapitulasi Kas Otomatis'
            };

            if (typeof parsed === 'object' && !Array.isArray(parsed)) {
                return Object.keys(parsed).map((key, i) => (
                    parsed[key] ? <li key={i} className="flex items-start gap-3"><span className="text-kas-primary mt-0.5">✅</span> <span>{featureLabels[key] || key}</span></li> : null
                ));
            }
            if (Array.isArray(parsed)) {
                return parsed.map((feat, i) => <li key={i} className="flex items-start gap-3"><span className="text-kas-primary mt-0.5">✅</span> <span>{feat}</span></li>);
            }
            return <li className="flex items-start gap-3"><span className="text-kas-primary mt-0.5">✅</span> <span>{String(parsed)}</span></li>;
        } catch (e) {
            return <li className="flex items-start gap-3"><span className="text-kas-primary mt-0.5">✅</span> <span>{featuresData}</span></li>;
        }
    };

    if (isLoading) return <div className="min-h-screen flex items-center justify-center font-bold text-kas-primary text-xl">Memuat Paket Lisensi...</div>;

    return (
        <div className="min-h-screen bg-kas-bg flex flex-col font-sans text-kas-dark">
            <nav className="container mx-auto px-6 py-6 text-center">
                <Link to="/" className="text-3xl font-extrabold tracking-tight text-kas-primary">
                    Koleksi<span className="text-kas-soft">Kas.</span>
                </Link>
            </nav>

            <div className="flex-grow flex items-center justify-center p-4 lg:p-8">
                <div className="max-w-6xl w-full bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 p-8 md:p-14 animate-fade-in relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-kas-primary/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>

                    <div className="text-center mb-14">
                        <h2 className="text-4xl font-black text-kas-dark tracking-tight">Pilih Paket Lisensi</h2>
                        <p className="text-gray-500 font-medium mt-3 text-lg">Sesuaikan dengan skala dan kebutuhan manajemen komunitas Anda.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-14 relative z-10">
                        <div>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
                                {tiers.map((tier) => (
                                    <label key={tier.id} className={`relative flex flex-col h-full p-8 rounded-3xl border-2 cursor-pointer transition-all duration-300 ${selectedTier === tier.slug ? 'border-kas-primary bg-kas-primary/5 shadow-xl shadow-kas-primary/10 transform scale-[1.02]' : 'border-gray-100 hover:border-kas-primary/30 hover:bg-gray-50 bg-white'}`}>
                                        <input type="radio" name="tier" value={tier.slug} className="hidden" onChange={() => setSelectedTier(tier.slug)} checked={selectedTier === tier.slug} />
                                        <div className="flex justify-between items-start mb-6">
                                            <div>
                                                <h4 className="text-2xl font-black text-gray-800">{tier.name}</h4>
                                                <p className="text-3xl font-black text-kas-primary mt-2">{tier.price == 0 ? 'Gratis' : `Rp ${new Intl.NumberFormat('id-ID').format(tier.price)}`}</p>
                                            </div>
                                            {selectedTier === tier.slug && <span className="bg-kas-primary text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-md">✓</span>}
                                        </div>
                                        <div className="flex-1 mt-4 border-t border-gray-100 pt-6">
                                            <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Fitur Termasuk</div>
                                            <ul className="text-sm md:text-base space-y-4 text-gray-700 font-medium">
                                                <li className="flex items-start gap-3"><span className="text-kas-primary mt-0.5">✅</span> <span>Maks. <strong>{tier.max_groups}</strong> Grup</span></li>
                                                <li className="flex items-start gap-3"><span className="text-kas-primary mt-0.5">✅</span> <span><strong>{tier.max_members_per_group}</strong> Member / Grup</span></li>
                                                {renderFeatures(tier.features)}
                                            </ul>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="bg-kas-bg/50 p-8 md:p-10 rounded-[2rem] border border-kas-accent/40">
                            <h3 className="text-2xl font-black mb-2 text-kas-dark">Amankan Akun Admin</h3>
                            <p className="text-sm text-gray-500 mb-8 font-medium">Kata sandi ini akan digunakan untuk login ke dashboard manajemen Anda.</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Kata Sandi Baru</label>
                                    <input name="password" value={formData.password} onChange={handleChange} type={showPassword ? "text" : "password"} className="w-full px-5 py-4 rounded-2xl border border-gray-200 focus:border-kas-primary focus:ring-2 focus:ring-kas-primary/20 bg-white outline-none transition-all text-lg" placeholder="Min. 6 karakter" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Ulangi Kata Sandi</label>
                                    <div className="relative">
                                        <input name="password_confirmation" value={formData.password_confirmation} onChange={handleChange} type={showPassword ? "text" : "password"} className="w-full pl-5 pr-24 py-4 rounded-2xl border border-gray-200 focus:border-kas-primary focus:ring-2 focus:ring-kas-primary/20 bg-white outline-none transition-all text-lg" placeholder="Ketik ulang password" required />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-5 flex items-center text-xs font-bold text-kas-soft hover:text-kas-primary transition-colors">{showPassword ? "SEMBUNYIKAN" : "LIHAT"}</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-2 flex justify-center">
                            <button type="submit" disabled={isSubmitting || tiers.length === 0} className="w-full md:w-3/4 lg:w-1/2 py-5 bg-kas-primary hover:bg-kas-dark text-white rounded-2xl font-black shadow-xl shadow-kas-primary/30 transition-all active:scale-95 disabled:opacity-50 text-xl tracking-wide">
                                {isSubmitting ? 'Memproses...' : 'AKTIFKAN RUANG KERJA 🚀'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* 👇 MODAL PEMBAYARAN QRIS DIPERBAIKI 👇 */}
                {paymentData && (
                    <div className="fixed inset-0 z-[100] bg-kas-dark/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                        <div className="bg-white p-8 rounded-3xl text-center max-w-sm w-full shadow-2xl relative flex flex-col items-center">
                            
                            {/* Animasi Radar Polling */}
                            <div className="absolute -top-4 -right-4 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center animate-pulse">
                                <span className="text-xl">⏳</span>
                            </div>

                            <h3 className="text-xl font-black text-kas-dark mb-1">Menunggu Pembayaran</h3>
                            <p className="text-gray-500 font-medium text-xs">Sistem mengecek status secara otomatis.</p>
                            
                            <div className="bg-white p-4 rounded-xl border-2 border-gray-100 shadow-sm mt-6 mb-2">
                                <QRCodeSVG value={paymentData.qr_string} size={180} />
                            </div>
                            
                            <p className="text-kas-primary font-black text-3xl mb-4">
                                Rp {new Intl.NumberFormat('id-ID').format(paymentData.amount)}
                            </p>
                            
                            <button onClick={() => setNeedsPayment(null)} className="mt-2 w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-bold text-sm transition-colors">
                                Tutup / Bayar Nanti
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}