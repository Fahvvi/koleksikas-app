import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { Mail, ShieldCheck, EyeOff, Eye, ArrowRight, CreditCard, User, Building, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BaseSwal = withReactContent(Swal);

// ==========================================
// 🎨 CUSTOM STYLING UNTUK POP-UP SWEETALERT
// ==========================================
// 1. Desain Pop-up Tengah (Untuk Peringatan/Error/Konfirmasi)
const KasSwal = BaseSwal.mixin({
    customClass: {
        popup: 'rounded-[2rem] shadow-2xl border border-gray-100 font-sans p-6 sm:p-8 bg-white',
        title: 'text-2xl font-black text-kas-dark tracking-tight pt-2',
        htmlContainer: 'text-sm font-medium text-gray-500 mt-2',
        // 👇 KUNCI RAHASIANYA DI SINI: Lebarkan wadah tombolnya!
        actions: 'w-full flex flex-col mt-6', 
        // Tambahkan px-6 dan m-0 agar tombol tidak tergencet
        confirmButton: 'w-full bg-kas-primary hover:bg-kas-dark text-white rounded-xl font-black px-6 py-4 shadow-xl shadow-kas-primary/20 transition-all text-sm m-0',
        cancelButton: 'w-full bg-gray-100 hover:bg-gray-200 text-kas-dark rounded-xl font-bold px-6 py-4 transition-all text-sm m-0 mt-3',
        icon: 'border-0 scale-125 mb-4' 
    },
    buttonsStyling: false,
    backdrop: `rgba(17, 24, 39, 0.6) backdrop-filter blur(4px)` // Latar belakang nge-blur
});

// 2. Desain Toast (Notifikasi Kecil Melayang di Kanan Atas)
const KasToast = BaseSwal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 2000,
    timerProgressBar: true,
    customClass: {
        popup: 'rounded-2xl shadow-2xl font-sans border border-gray-100 bg-white px-4 py-3 mt-4 mr-4',
        title: 'text-sm font-bold text-kas-dark',
    }
});

function cn(...classes) {
    return classes.filter(Boolean).join(' ');
}

export default function AuthPortal() {
    const navigate = useNavigate();
    const location = useLocation();
    
    const [view, setView] = useState(location.pathname.includes('register') ? 'register' : 'login');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [loginData, setLoginData] = useState({ email: '', password: '' });
    const [registerData, setRegisterData] = useState({ name: '', email: '', phone: '', company_name: '' });

    const handleViewChange = (newView) => {
        setView(newView);
        window.history.replaceState(null, '', newView === 'login' ? '/auth/login' : '/mitra/register');
    };

    const handleLoginChange = (e) => setLoginData({ ...loginData, [e.target.name]: e.target.value });
    const handleRegisterChange = (e) => setRegisterData({ ...registerData, [e.target.name]: e.target.value });

    // ==========================================
    // LOGIKA LOGIN
    // ==========================================
    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await axios.post('/api/v1/auth/login', loginData);
            const { access_token: token, user } = response.data;

            localStorage.setItem('auth_token', token); 
            localStorage.setItem('user', JSON.stringify(user));

            // Gunakan Toast Custom untuk Sukses
            KasToast.fire({ icon: 'success', title: 'Berhasil masuk ke Dashboard!' }).then(() => {
                navigate(user.role === 'super_admin' ? '/super-admin/dashboard' : '/admin/dashboard', { replace: true });
            });
            
        } catch (error) {
            if (error.response?.status === 403 && error.response?.data?.pending_payment) {
                // Gunakan Swal Custom untuk Tertunda
                KasSwal.fire({
                    icon: 'warning', 
                    title: 'Pembayaran Tertunda',
                    text: error.response.data.message,
                    confirmButtonText: 'Lanjutkan Pembayaran'
                }).then(() => navigate(`/mitra/checkout/${error.response.data.mitra_id}`));
            } else {
                // Gunakan Swal Custom untuk Error (Akses Ditolak)
                KasSwal.fire({
                    icon: 'error', 
                    title: 'Akses Ditolak',
                    text: error.response?.data?.message || 'Email atau kata sandi Anda salah.'
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    // ==========================================
    // LOGIKA REGISTER
    // ==========================================
    const handleRegister = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const response = await axios.post('/api/v1/mitra/register', registerData);
            
            KasSwal.fire({
                icon: 'success', 
                title: 'Pendaftaran Berhasil!',
                text: 'Langkah selanjutnya: Pilih paket lisensi Anda.',
                confirmButtonText: 'Pilih Lisensi'
            }).then(() => {
                navigate(`/mitra/checkout/${response.data.data.mitra_id}`); 
            });
        } catch (error) {
            KasSwal.fire({
                icon: 'error', 
                title: 'Pendaftaran Gagal',
                text: error.response?.data?.message || 'Terjadi kesalahan sistem. Silakan coba lagi.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full bg-kas-bg font-sans text-kas-dark selection:bg-kas-accent selection:text-kas-dark">
            
            {/* SISI KIRI (Branding Desktop) */}
            <div className="hidden lg:flex lg:w-1/2 bg-kas-dark text-white flex-col justify-between p-10 xl:p-16 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-kas-primary/20 rounded-full blur-[120px] pointer-events-none translate-x-1/3 -translate-y-1/3"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-kas-primary/10 rounded-full blur-[100px] pointer-events-none -translate-x-1/3 translate-y-1/3"></div>

                <div className="relative z-10">
                    <Link to="/" className="flex items-center gap-3 mb-12 w-fit group">
                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 backdrop-blur-md group-hover:bg-white group-hover:scale-105 transition-all">
                            <CreditCard className="w-5 h-5 text-kas-primary" />
                        </div>
                        <span className="text-3xl font-black tracking-tight text-white">
                            Koleksi<span className="text-kas-primary">Kas.</span>
                        </span>
                    </Link>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={view}
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4 }}
                        >
                            <h1 className="text-4xl xl:text-5xl font-black mb-5 leading-[1.1] drop-shadow-lg">
                                {view === 'login' ? (
                                    <>Selamat Datang <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-kas-primary to-rose-400">Kembali, Admin.</span></>
                                ) : (
                                    <>Mulai Kelola <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-kas-primary to-rose-400">Komunitasmu.</span></>
                                )}
                            </h1>
                            <p className="text-white/70 text-lg mb-10 max-w-md leading-relaxed font-medium">
                                {view === 'login' 
                                    ? 'Kelola tagihan, cek saldo kas, dan atur jadwal komunitas Anda dalam satu dasbor pintar.' 
                                    : 'Bergabunglah dengan ratusan pengelola komunitas yang sudah beralih ke otomatisasi KoleksiKAS.'}
                            </p>
                        </motion.div>
                    </AnimatePresence>

                    <div className="grid grid-cols-2 gap-6 max-w-lg mt-8">
                        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm">
                            <span className="text-2xl mb-2 block">⚡</span>
                            <h4 className="font-bold text-sm mb-1 text-white">Otomatisasi Penuh</h4>
                            <p className="text-xs text-white/50 font-medium">Sistem penagihan & rekap jalan sendiri.</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm">
                            <span className="text-2xl mb-2 block">🛡️</span>
                            <h4 className="font-bold text-sm mb-1 text-white">Keamanan Bank</h4>
                            <p className="text-xs text-white/50 font-medium">Data dan dana terenkripsi aman.</p>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 text-white/30 text-xs font-medium tracking-wide">
                    &copy; {new Date().getFullYear()} KoleksiKAS by RootanRoo Digital.
                </div>
            </div>

            {/* SISI KANAN (Portal Interaktif) */}
            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-12 relative overflow-y-auto">
                <div className="lg:hidden flex items-center gap-2 mb-8 mt-4">
                    <div className="w-8 h-8 bg-kas-primary rounded-lg flex items-center justify-center shadow-md">
                        <CreditCard className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-black tracking-tight text-kas-dark">Koleksi<span className="text-kas-primary">Kas.</span></span>
                </div>

                <div className="w-full max-w-[420px] bg-white p-6 sm:p-8 rounded-[2rem] shadow-2xl shadow-kas-dark/5 border border-gray-100 relative">
                    
                    <div className="relative flex bg-gray-100 p-1.5 rounded-2xl mb-8">
                        <motion.div 
                            className="absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white rounded-xl shadow-sm border border-gray-200/50"
                            animate={{ left: view === 'login' ? '6px' : 'calc(50% + 0px)' }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        />
                        <button 
                            onClick={() => handleViewChange('login')} 
                            className={cn("flex-1 py-2.5 relative z-10 font-bold text-sm transition-colors", view === 'login' ? "text-kas-primary" : "text-gray-400 hover:text-gray-600")}
                        >
                            Masuk
                        </button>
                        <button 
                            onClick={() => handleViewChange('register')} 
                            className={cn("flex-1 py-2.5 relative z-10 font-bold text-sm transition-colors", view === 'register' ? "text-kas-primary" : "text-gray-400 hover:text-gray-600")}
                        >
                            Daftar Mitra
                        </button>
                    </div>

                    <div className="min-h-[350px]">
                        <AnimatePresence mode="wait">
                            
                            {/* FORM LOGIN */}
                            {view === 'login' && (
                                <motion.div
                                    key="login"
                                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="text-center mb-6">
                                        <h2 className="text-2xl font-black text-kas-dark tracking-tight">Portal Admin</h2>
                                        <p className="text-gray-500 font-medium text-xs mt-1">Masuk untuk mengelola komunitas Anda.</p>
                                    </div>

                                    <form onSubmit={handleLogin} className="space-y-4">
                                        <div>
                                            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Email Terdaftar</label>
                                            <div className="relative group">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-kas-primary transition-colors"><Mail className="w-4 h-4" /></span>
                                                <input name="email" type="email" value={loginData.email} onChange={handleLoginChange} required
                                                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-kas-primary outline-none transition-all font-bold text-gray-800 text-sm"
                                                    placeholder="admin@komunitas.com" />
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex justify-between items-center mb-1.5">
                                                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest">Kata Sandi</label>
                                                <Link to="/auth/forgot-password" className="text-[11px] font-bold text-kas-primary hover:underline">Lupa sandi?</Link>
                                            </div>
                                            <div className="relative group">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-kas-primary transition-colors"><ShieldCheck className="w-4 h-4" /></span>
                                                <input name="password" type={showPassword ? "text" : "password"} value={loginData.password} onChange={handleLoginChange} required
                                                    className="w-full pl-11 pr-11 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-kas-primary outline-none transition-all font-bold text-gray-800 text-sm"
                                                    placeholder="••••••••" />
                                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>

                                        <button type="submit" disabled={isLoading} className="w-full py-3.5 bg-kas-primary hover:bg-kas-dark text-white rounded-xl font-black flex items-center justify-center gap-2 shadow-lg shadow-kas-primary/20 transition-all active:scale-95 disabled:opacity-70 mt-2 text-sm">
                                            {isLoading ? 'Memeriksa...' : <>Masuk Dashboard <ArrowRight className="w-4 h-4" /></>}
                                        </button>
                                    </form>

                                    <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                                        <p className="text-gray-500 font-medium text-xs mb-3">
                                            Bukan pengelola komunitas?
                                        </p>
                                        <Link to="/user/login" className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-gray-100 text-kas-dark font-bold hover:border-kas-primary hover:bg-kas-primary/5 transition-all text-sm">
                                            <User className="w-4 h-4 text-kas-primary" /> Masuk Sebagai Member
                                        </Link>
                                    </div>
                                </motion.div>
                            )}

                            {/* FORM REGISTER */}
                            {view === 'register' && (
                                <motion.div
                                    key="register"
                                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="text-center mb-6">
                                        <h2 className="text-2xl font-black text-kas-dark tracking-tight">Daftar Mitra</h2>
                                        <p className="text-gray-500 font-medium text-xs mt-1">Buat ruang kerja untuk komunitas Anda.</p>
                                    </div>

                                    <form onSubmit={handleRegister} className="space-y-4">
                                        <div>
                                            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Nama Admin</label>
                                            <div className="relative group">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-kas-primary"><User className="w-4 h-4" /></span>
                                                <input name="name" type="text" value={registerData.name} onChange={handleRegisterChange} required className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-kas-primary outline-none transition-all font-bold text-gray-800 text-sm" placeholder="Budi Santoso" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Email Aktif</label>
                                                <div className="relative group">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-kas-primary"><Mail className="w-4 h-4" /></span>
                                                    <input name="email" type="email" value={registerData.email} onChange={handleRegisterChange} required className="w-full pl-9 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-kas-primary outline-none transition-all font-bold text-gray-800 text-sm" placeholder="budi@mail.com" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">WhatsApp</label>
                                                <div className="relative group">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-kas-primary"><Smartphone className="w-4 h-4" /></span>
                                                    <input name="phone" type="tel" value={registerData.phone} onChange={handleRegisterChange} required className="w-full pl-9 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-kas-primary outline-none transition-all font-bold text-gray-800 text-sm" placeholder="0812xxx" />
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Nama Komunitas / Event</label>
                                            <div className="relative group">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-kas-primary"><Building className="w-4 h-4" /></span>
                                                <input name="company_name" type="text" value={registerData.company_name} onChange={handleRegisterChange} required className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-kas-primary outline-none transition-all font-bold text-gray-800 text-sm" placeholder="Futsal Jumat Ceria" />
                                            </div>
                                        </div>

                                        <button type="submit" disabled={isLoading} className="w-full py-3.5 bg-kas-primary hover:bg-kas-dark text-white rounded-xl font-black flex items-center justify-center gap-2 shadow-lg shadow-kas-primary/20 transition-all active:scale-95 disabled:opacity-70 mt-4 text-sm">
                                            {isLoading ? 'Memproses...' : <>Lanjut Pilih Paket <ArrowRight className="w-4 h-4" /></>}
                                        </button>
                                    </form>
                                </motion.div>
                            )}

                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}