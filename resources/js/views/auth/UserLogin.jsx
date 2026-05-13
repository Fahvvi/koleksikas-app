import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { CreditCard, ArrowRight, ShieldCheck, Phone, Eye, EyeOff, Lock, UserPlus, KeyRound, User, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BaseSwal = withReactContent(Swal);

// ==========================================
// 🎨 CUSTOM STYLING UNTUK POP-UP SWEETALERT
// ==========================================
const KasSwal = BaseSwal.mixin({
    customClass: {
        popup: 'rounded-[2rem] shadow-2xl border border-gray-100 font-sans p-6 sm:p-8 bg-white',
        title: 'text-2xl font-black text-kas-dark tracking-tight pt-2',
        htmlContainer: 'text-sm font-medium text-gray-500 mt-2',
        actions: 'w-full flex flex-col mt-6', 
        confirmButton: 'w-full bg-kas-primary hover:bg-kas-dark text-white rounded-xl font-black px-6 py-4 shadow-xl shadow-kas-primary/20 transition-all text-sm m-0',
        cancelButton: 'w-full bg-gray-100 hover:bg-gray-200 text-kas-dark rounded-xl font-bold px-6 py-4 transition-all text-sm m-0 mt-3',
        icon: 'border-0 scale-125 mb-4' 
    },
    buttonsStyling: false,
    backdrop: `rgba(17, 24, 39, 0.6) backdrop-filter blur(4px)` 
});

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

// ==========================================
// KOMPONEN UTAMA
// ==========================================
export default function UserLogin() {
    const [view, setView] = useState('login'); 
    const [authType, setAuthType] = useState(''); 
    
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    
    const navigate = useNavigate();
    const location = useLocation();
    const returnUrl = location.state?.returnUrl || '/explore';

    // 1. Logika Login
    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            let formattedPhone = phone.replace(/[^0-9]/g, '');
            const response = await axios.post('/api/v1/auth/login', {
                phone_wa: formattedPhone, password: password, role: 'user' 
            });

            localStorage.setItem('auth_token', response.data.access_token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            
            KasToast.fire({ icon: 'success', title: 'Berhasil masuk!' }).then(() => navigate(returnUrl));
        } catch (error) {
            KasSwal.fire({
                icon: 'error', title: 'Akses Ditolak',
                text: error.response?.data?.message || 'Nomor WhatsApp atau password salah.'
            });
        } finally { setIsLoading(false); }
    };

    // 2. Logika Request OTP
    const handleRequestOtp = async (e, type) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            let formattedPhone = phone.replace(/[^0-9]/g, '');
            const response = await axios.post('/api/v1/auth/request-otp', { 
                phone_wa: formattedPhone, type: type 
            });
            
            KasToast.fire({ icon: 'success', title: response.data.message });
            setAuthType(type); 
            setView('verify'); 
        } catch (error) {
            KasSwal.fire({
                icon: 'error', title: 'Gagal',
                text: error.response?.data?.message || 'Terjadi kesalahan sistem.'
            });
        } finally { setIsLoading(false); }
    };

    // 3. Logika Verifikasi OTP
    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            let formattedPhone = phone.replace(/[^0-9]/g, '');
            const response = await axios.post('/api/v1/auth/verify-otp', {
                name: name, phone_wa: formattedPhone, otp: otp, password: password, type: authType 
            });

            localStorage.setItem('auth_token', response.data.access_token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            
            KasSwal.fire({
                icon: 'success', title: 'Berhasil!',
                text: response.data.message,
                confirmButtonText: 'Mulai Mabar'
            }).then(() => navigate(returnUrl));
            
        } catch (error) {
            KasSwal.fire({
                icon: 'error', title: 'Verifikasi Gagal',
                text: error.response?.data?.message || 'OTP salah atau sudah kedaluwarsa.'
            });
        } finally { setIsLoading(false); }
    };

    return (
        <div className="min-h-screen bg-kas-bg flex flex-col justify-center items-center font-sans selection:bg-kas-accent selection:text-kas-dark relative overflow-hidden p-4">
            
            {/* Dekorasi Latar Belakang */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl aspect-square bg-gradient-to-br from-kas-primary/10 to-kas-soft/10 rounded-full blur-[100px] pointer-events-none"></div>

            {/* Topbar Navigasi */}
            <div className="absolute top-0 left-0 w-full p-6 lg:px-12 flex justify-between items-center z-10">
                <Link to="/" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 lg:w-10 lg:h-10 bg-white rounded-lg flex items-center justify-center shadow-sm border border-gray-200 group-hover:border-kas-primary transition-colors">
                        <CreditCard className="w-4 h-4 lg:w-5 lg:h-5 text-kas-primary" />
                    </div>
                    <span className="font-black text-lg lg:text-xl text-kas-dark tracking-tight">KoleksiKAS.</span>
                </Link>
                <Link to="/explore" className="text-xs lg:text-sm font-bold text-kas-dark/60 hover:text-kas-primary transition-colors bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
                    Cari Mabar
                </Link>
            </div>

            {/* Card Utama */}
            <div className="w-full max-w-[420px] bg-white rounded-[2rem] shadow-2xl shadow-kas-dark/5 border border-gray-100 p-6 sm:p-8 relative z-10">
                
                {/* 👇 ANIMASI SWITCH TOGGLE PILL 👇 */}
                {(view === 'login' || view === 'register') && (
                    <div className="relative flex bg-gray-100 p-1.5 rounded-2xl mb-8">
                        <motion.div 
                            className="absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white rounded-xl shadow-sm border border-gray-200/50"
                            animate={{ left: view === 'login' ? '6px' : 'calc(50% + 0px)' }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        />
                        <button 
                            type="button"
                            onClick={() => setView('login')} 
                            className={cn("flex-1 py-2.5 relative z-10 font-bold text-sm transition-colors", view === 'login' ? "text-kas-primary" : "text-gray-400 hover:text-gray-600")}
                        >
                            Masuk
                        </button>
                        <button 
                            type="button"
                            onClick={() => setView('register')} 
                            className={cn("flex-1 py-2.5 relative z-10 font-bold text-sm transition-colors", view === 'register' ? "text-kas-primary" : "text-gray-400 hover:text-gray-600")}
                        >
                            Daftar Baru
                        </button>
                    </div>
                )}

                <div className="min-h-[350px]">
                    <AnimatePresence mode="wait">
                        
                        {/* VIEW: LOGIN */}
                        {view === 'login' && (
                            <motion.div key="login" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}>
                                <div className="text-center mb-6">
                                    <div className="w-12 h-12 bg-gradient-to-br from-kas-primary to-kas-soft rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-kas-primary/30 transform -rotate-3">
                                        <Lock className="w-6 h-6 text-white transform rotate-3" />
                                    </div>
                                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Portal Member</h2>
                                    <p className="text-gray-500 font-medium text-xs mt-1">Masuk untuk melihat riwayat mabar & tagihan.</p>
                                </div>

                                <form onSubmit={handleLogin} className="space-y-4">
                                    <div>
                                        <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Nomor WhatsApp</label>
                                        <div className="relative group">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-kas-primary transition-colors"><Phone className="w-4 h-4" /></span>
                                            <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} 
                                                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-kas-primary outline-none transition-all font-bold text-gray-800 text-sm" placeholder="081234567890" />
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-center mb-1.5">
                                            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest">Kata Sandi</label>
                                            <button type="button" onClick={() => setView('forgot')} className="text-[11px] font-bold text-kas-primary hover:underline">Lupa sandi?</button>
                                        </div>
                                        <div className="relative group">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-kas-primary transition-colors"><ShieldCheck className="w-4 h-4" /></span>
                                            <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} 
                                                className="w-full pl-11 pr-11 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-kas-primary outline-none transition-all font-bold text-gray-800 text-sm" placeholder="••••••••" />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <button type="submit" disabled={isLoading} className="w-full py-3.5 bg-kas-dark hover:bg-black text-white rounded-xl font-black flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70 mt-2 shadow-lg shadow-kas-dark/20 text-sm">
                                        {isLoading ? 'Memeriksa...' : <>Masuk Akun <ArrowRight className="w-4 h-4" /></>}
                                    </button>
                                </form>
                            </motion.div>
                        )}

                        {/* VIEW: REGISTER */}
                        {view === 'register' && (
                            <motion.div key="register" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                                <div className="text-center mb-6">
                                    <div className="w-12 h-12 bg-kas-primary/10 border border-kas-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                        <UserPlus className="w-6 h-6 text-kas-primary" />
                                    </div>
                                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Daftar Member</h2>
                                    <p className="text-gray-500 font-medium text-xs mt-1">Gabung sekarang untuk ikut mabar & arisan.</p>
                                </div>

                                <form onSubmit={(e) => handleRequestOtp(e, 'register')} className="space-y-4">
                                    <div>
                                        <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Nama Lengkap</label>
                                        <div className="relative group">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-kas-primary"><User className="w-4 h-4" /></span>
                                            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} 
                                                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-kas-primary outline-none transition-all font-bold text-gray-800 text-sm" placeholder="Budi Santoso" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">WhatsApp Aktif</label>
                                        <div className="relative group">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-kas-primary"><Phone className="w-4 h-4" /></span>
                                            <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} 
                                                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-kas-primary outline-none transition-all font-bold text-gray-800 text-sm" placeholder="0812..." />
                                        </div>
                                    </div>
                                    <button type="submit" disabled={isLoading} className="w-full py-3.5 bg-kas-primary hover:bg-kas-dark text-white rounded-xl font-black flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70 shadow-lg shadow-kas-primary/30 mt-4 text-sm">
                                        {isLoading ? 'Memproses...' : <>Kirim OTP <ArrowRight className="w-4 h-4" /></>}
                                    </button>
                                </form>
                            </motion.div>
                        )}

                        {/* VIEW: FORGOT PASSWORD */}
                        {view === 'forgot' && (
                            <motion.div key="forgot" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }}>
                                <div className="text-center mb-6">
                                    <div className="w-12 h-12 bg-kas-accent/20 border border-kas-accent/40 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                        <KeyRound className="w-6 h-6 text-kas-accent" />
                                    </div>
                                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Lupa Sandi?</h2>
                                    <p className="text-gray-500 font-medium text-xs mt-1">Kami akan mengirim OTP untuk verifikasi.</p>
                                </div>

                                <form onSubmit={(e) => handleRequestOtp(e, 'forgot')} className="space-y-4">
                                    <div>
                                        <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Nomor WhatsApp Terdaftar</label>
                                        <div className="relative group">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-kas-primary"><Phone className="w-4 h-4" /></span>
                                            <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} 
                                                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-kas-primary outline-none transition-all font-bold text-gray-800 text-sm" placeholder="0812..." />
                                        </div>
                                    </div>
                                    <button type="submit" disabled={isLoading} className="w-full py-3.5 bg-kas-primary hover:bg-kas-dark text-white rounded-xl font-black transition-all active:scale-95 disabled:opacity-70 shadow-lg shadow-kas-primary/30 mt-2 text-sm">
                                        {isLoading ? 'Mencari...' : 'Kirim Link Reset'}
                                    </button>
                                    <button type="button" onClick={() => setView('login')} className="w-full py-2 text-gray-500 hover:text-gray-800 font-bold text-xs flex items-center justify-center gap-1.5 mt-2">
                                        <ArrowLeft className="w-3.5 h-3.5" /> Batal & Kembali
                                    </button>
                                </form>
                            </motion.div>
                        )}

                        {/* VIEW: VERIFY OTP */}
                        {view === 'verify' && (
                            <motion.div key="verify" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                                <div className="text-center mb-6">
                                    <div className="w-12 h-12 bg-green-50 border border-green-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                        <ShieldCheck className="w-6 h-6 text-green-600" />
                                    </div>
                                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Amankan Akun</h2>
                                    <p className="text-gray-500 font-medium text-xs mt-1">Masukkan 8 digit OTP dari WA & buat Sandi.</p>
                                </div>

                                <form onSubmit={handleVerifyOtp} className="space-y-4">
                                    <div>
                                        <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Kode OTP (8 Digit)</label>
                                        <input type="text" required maxLength="8" value={otp} onChange={(e) => setOtp(e.target.value)} 
                                            className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-kas-primary outline-none transition-all font-black tracking-[0.5em] text-center text-gray-800 text-lg" placeholder="••••••••" />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Buat Sandi Baru</label>
                                        <div className="relative group">
                                            <input type={showPassword ? "text" : "password"} required minLength="6" value={password} onChange={(e) => setPassword(e.target.value)} 
                                                className="w-full pl-4 pr-11 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-kas-primary outline-none transition-all font-bold text-gray-800 text-sm" placeholder="Min. 6 Karakter" />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    <button type="submit" disabled={isLoading} className="w-full py-3.5 bg-kas-primary hover:bg-kas-dark text-white rounded-xl font-black transition-all active:scale-95 disabled:opacity-70 shadow-lg shadow-kas-primary/30 mt-4 text-sm">
                                        {isLoading ? 'Memverifikasi...' : (authType === 'register' ? 'Selesai Daftar' : 'Ganti Sandi & Masuk')}
                                    </button>
                                    <button type="button" onClick={() => setView(authType)} className="w-full py-2 text-gray-500 hover:text-gray-800 font-bold text-xs flex items-center justify-center gap-1.5 mt-2">
                                        <ArrowLeft className="w-3.5 h-3.5" /> Ganti Nomor
                                    </button>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Tautan ke Admin Portal (Hanya muncul jika di Login/Register) */}
                {(view === 'login' || view === 'register') && (
                    <div className="mt-8 pt-6 border-t border-gray-100 text-center animate-fade-in">
                        <p className="text-gray-500 font-medium text-xs mb-3">
                            Pengelola / Ketua Komunitas?
                        </p>
                        <Link to="/auth/login" className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:border-kas-dark hover:text-kas-dark hover:bg-gray-50 transition-all text-sm">
                            <ShieldCheck className="w-4 h-4" /> Masuk ke Portal Admin
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}