import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { CreditCard, ArrowRight, ShieldCheck, Phone, Eye, EyeOff, Lock, UserPlus, KeyRound, User } from 'lucide-react';
import Swal from 'sweetalert2';

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

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            let formattedPhone = phone.replace(/[^0-9]/g, '');
            const response = await axios.post('/api/v1/auth/login', {
                phone_wa: formattedPhone, password: password, role: 'user' 
            });

            localStorage.setItem('token', response.data.access_token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            navigate(returnUrl);
        } catch (error) {
            Swal.fire({
                icon: 'error', title: 'Akses Ditolak',
                text: error.response?.data?.message || 'Nomor WhatsApp atau password salah.',
                confirmButtonColor: '#842A3B', customClass: { popup: 'rounded-2xl' }
            });
        } finally { setIsLoading(false); }
    };

    const handleRequestOtp = async (e, type) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            let formattedPhone = phone.replace(/[^0-9]/g, '');
            const response = await axios.post('/api/v1/auth/request-otp', { 
                phone_wa: formattedPhone, type: type 
            });
            
            Swal.fire({
                toast: true, position: 'top', icon: 'success', title: response.data.message,
                showConfirmButton: false, timer: 3000
            });
            
            setAuthType(type); 
            setView('verify'); 
        } catch (error) {
            Swal.fire({
                icon: 'error', title: 'Gagal',
                text: error.response?.data?.message || 'Terjadi kesalahan sistem.',
                confirmButtonColor: '#842A3B', customClass: { popup: 'rounded-2xl' }
            });
        } finally { setIsLoading(false); }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            let formattedPhone = phone.replace(/[^0-9]/g, '');
            const response = await axios.post('/api/v1/auth/verify-otp', {
                name: name, phone_wa: formattedPhone, otp: otp, password: password, type: authType 
            });

            localStorage.setItem('token', response.data.access_token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            
            Swal.fire({
                icon: 'success', title: 'Berhasil!',
                text: response.data.message, confirmButtonColor: '#10B981', timer: 2000, showConfirmButton: false,
                customClass: { popup: 'rounded-2xl' }
            }).then(() => navigate(returnUrl));
            
        } catch (error) {
            Swal.fire({
                icon: 'error', title: 'Verifikasi Gagal',
                text: error.response?.data?.message || 'OTP salah atau sudah kedaluwarsa.',
                confirmButtonColor: '#842A3B', customClass: { popup: 'rounded-2xl' }
            });
        } finally { setIsLoading(false); }
    };

    return (
        <div className="min-h-screen bg-kas-bg flex flex-col justify-center font-sans selection:bg-kas-accent selection:text-kas-dark">
            
            <div className="absolute top-0 left-0 w-full p-4 sm:p-6 flex justify-between items-center z-10">
                <Link to="/" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm border border-gray-200 group-hover:border-kas-primary transition-colors">
                        <CreditCard className="w-4 h-4 text-kas-primary" />
                    </div>
                    <span className="font-black text-lg sm:text-xl text-kas-dark tracking-tight">KoleksiKAS.</span>
                </Link>
                <Link to="/explore" className="text-xs font-bold text-kas-dark/50 hover:text-kas-primary transition-colors bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-100">
                    Cari Mabar
                </Link>
            </div>

            <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl aspect-square bg-gradient-to-br from-kas-primary/10 to-kas-soft/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="w-full max-w-[400px] bg-white rounded-[2rem] shadow-2xl shadow-kas-dark/5 border border-gray-100 p-6 sm:p-8 relative z-10 animate-slide-up">
                    
                    {/* TAMPILAN 1: FORM LOGIN NORMAL */}
                    {view === 'login' && (
                        <div className="animate-fade-in">
                            <div className="text-center mb-6 relative">
                                <div className="w-12 h-12 bg-gradient-to-br from-kas-primary to-kas-soft rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-kas-primary/30 transform -rotate-3">
                                    <Lock className="w-6 h-6 text-white transform rotate-3" />
                                </div>
                                <h2 className="text-2xl font-black text-gray-900 mb-0.5 tracking-tight">Portal Member</h2>
                            </div>

                            <form onSubmit={handleLogin} className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Nomor WhatsApp</label>
                                    <div className="relative group">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-kas-primary transition-colors"><Phone className="w-4 h-4" /></span>
                                        <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-kas-primary focus:ring-2 focus:ring-kas-primary/10 outline-none transition-all font-bold text-gray-800 text-sm" placeholder="081234567890" />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-1.5">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Password</label>
                                        <button type="button" onClick={() => setView('forgot')} className="text-[10px] font-bold text-kas-primary hover:text-kas-dark transition-colors">Lupa Password?</button>
                                    </div>
                                    <div className="relative group">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-kas-primary transition-colors"><ShieldCheck className="w-4 h-4" /></span>
                                        <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-kas-primary focus:ring-2 focus:ring-kas-primary/10 outline-none transition-all font-bold text-gray-800 text-sm" placeholder="••••••" />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <button type="submit" disabled={isLoading} className="w-full py-3.5 bg-kas-dark hover:bg-black text-white rounded-xl font-black flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70 mt-2 shadow-lg shadow-kas-dark/20 text-sm">
                                    {isLoading ? 'Memeriksa...' : <>Masuk <ArrowRight className="w-4 h-4" /></>}
                                </button>
                            </form>

                            <div className="mt-5 pt-4 border-t border-gray-100 text-center">
                                <p className="text-xs text-gray-500 font-medium">
                                    Belum punya akun?{' '}
                                    <button onClick={() => setView('register')} className="text-kas-primary font-black hover:underline">Daftar Sekarang</button>
                                </p>
                            </div>
                        </div>
                    )}

                    {/* TAMPILAN 2: DAFTAR AKUN BARU */}
                    {view === 'register' && (
                        <div className="animate-slide-up">
                            <div className="text-center mb-5">
                                <div className="w-12 h-12 bg-kas-primary/10 border border-kas-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                    <UserPlus className="w-6 h-6 text-kas-primary" />
                                </div>
                                <h2 className="text-xl font-black text-gray-900 tracking-tight">Daftar Member</h2>
                            </div>

                            <form onSubmit={(e) => handleRequestOtp(e, 'register')} className="space-y-3.5">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Nama Lengkap</label>
                                    <div className="relative group">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-kas-primary transition-colors"><User className="w-4 h-4" /></span>
                                        <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-kas-primary focus:ring-2 focus:ring-kas-primary/10 outline-none transition-all font-bold text-gray-800 text-sm" placeholder="Nama Anda" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Nomor WhatsApp Aktif</label>
                                    <div className="relative group">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-kas-primary transition-colors"><Phone className="w-4 h-4" /></span>
                                        <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-kas-primary focus:ring-2 focus:ring-kas-primary/10 outline-none transition-all font-bold text-gray-800 text-sm" placeholder="0812..." />
                                    </div>
                                </div>
                                <button type="submit" disabled={isLoading} className="w-full py-3.5 bg-kas-primary hover:bg-kas-dark text-white rounded-xl font-black transition-all active:scale-95 disabled:opacity-70 shadow-lg shadow-kas-primary/30 mt-2 text-sm">
                                    {isLoading ? 'Memproses...' : 'Kirim OTP ke WhatsApp'}
                                </button>
                                <button type="button" onClick={() => setView('login')} className="w-full py-2 text-gray-500 hover:text-gray-800 font-bold text-xs">Kembali Login</button>
                            </form>
                        </div>
                    )}

                    {/* TAMPILAN 3: LUPA PASSWORD */}
                    {view === 'forgot' && (
                        <div className="animate-slide-up">
                            <div className="text-center mb-5">
                                <div className="w-12 h-12 bg-kas-accent/20 border border-kas-accent/40 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                    <KeyRound className="w-6 h-6 text-kas-accent" />
                                </div>
                                <h2 className="text-xl font-black text-gray-900 tracking-tight">Lupa Sandi</h2>
                                <p className="text-[10px] text-gray-500 font-medium mt-1">Kami akan mengirim OTP untuk mereset password Anda.</p>
                            </div>

                            <form onSubmit={(e) => handleRequestOtp(e, 'forgot')} className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Nomor WhatsApp Terdaftar</label>
                                    <div className="relative group">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-kas-primary transition-colors"><Phone className="w-4 h-4" /></span>
                                        <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-kas-primary focus:ring-2 focus:ring-kas-primary/10 outline-none transition-all font-bold text-gray-800 text-sm" placeholder="0812..." />
                                    </div>
                                </div>
                                <button type="submit" disabled={isLoading} className="w-full py-3.5 bg-kas-primary hover:bg-kas-dark text-white rounded-xl font-black transition-all active:scale-95 disabled:opacity-70 shadow-lg shadow-kas-primary/30 mt-2 text-sm">
                                    {isLoading ? 'Mencari Akun...' : 'Kirim Link Reset (OTP)'}
                                </button>
                                <button type="button" onClick={() => setView('login')} className="w-full py-2 text-gray-500 hover:text-gray-800 font-bold text-xs">Batal</button>
                            </form>
                        </div>
                    )}

                    {/* TAMPILAN 4: INPUT OTP & PASSWORD BARU */}
                    {view === 'verify' && (
                        <div className="animate-slide-up">
                            <div className="text-center mb-5">
                                <div className="w-12 h-12 bg-green-50 border border-green-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                    <ShieldCheck className="w-6 h-6 text-green-600" />
                                </div>
                                <h2 className="text-xl font-black text-gray-900 tracking-tight">Amankan Akun</h2>
                                <p className="text-[10px] text-gray-500 font-medium mt-1">Masukkan 8 digit OTP yang kami kirimkan ke WA.</p>
                            </div>

                            <form onSubmit={handleVerifyOtp} className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Kode OTP (8 Digit)</label>
                                    <input type="text" required maxLength="8" value={otp} onChange={(e) => setOtp(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-kas-primary focus:ring-2 focus:ring-kas-primary/10 outline-none transition-all font-black tracking-[0.5em] text-center text-gray-800 text-lg" placeholder="••••••••" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Buat Password Anda</label>
                                    <div className="relative group">
                                        <input type={showPassword ? "text" : "password"} required minLength="6" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-kas-primary focus:ring-2 focus:ring-kas-primary/10 outline-none transition-all font-bold text-gray-800 text-sm" placeholder="Min 6 Karakter" />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                                <button type="submit" disabled={isLoading} className="w-full py-3.5 bg-kas-primary hover:bg-kas-dark text-white rounded-xl font-black transition-all active:scale-95 disabled:opacity-70 shadow-lg shadow-kas-primary/30 mt-2 text-sm">
                                    {isLoading ? 'Memverifikasi...' : (authType === 'register' ? 'Selesai & Mulai Mabar' : 'Ganti Password & Login')}
                                </button>
                                <button type="button" onClick={() => setView(authType)} className="w-full py-2 text-gray-500 hover:text-gray-800 font-bold text-xs">Kembali</button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}