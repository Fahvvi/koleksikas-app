import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

export default function Login() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({ email: '', password: '' });

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await axios.post('/api/v1/auth/login', formData);
            
            const token = response.data.data.token; 
            const user = response.data.data.user;

            // Simpan token untuk Axios (jika kamu pakai interceptor)
            localStorage.setItem('auth_token', token);
            // Simpan objek user secara utuh untuk dibaca oleh RoleGuard di app.jsx!
            localStorage.setItem('user', JSON.stringify(user));

            MySwal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'Berhasil masuk!',
                showConfirmButton: false,
                timer: 1500
            }).then(() => {
                // Arahkan sesuai Role
                if(user.role === 'super_admin') {
                    navigate('/super-admin/dashboard', { replace: true });
                } else {
                    navigate('/admin/dashboard', { replace: true });
                }
            });
            
        } catch (error) {
            // 👇 TANGKAP PENOLAKAN DARI BACKEND JIKA BELUM BAYAR 👇
            if (error.response?.status === 403 && error.response?.data?.pending_payment) {
                MySwal.fire({
                    icon: 'warning',
                    title: 'Pembayaran Tertunda',
                    text: error.response.data.message,
                    confirmButtonColor: '#842A3B',
                    confirmButtonText: 'Lanjutkan Pembayaran'
                }).then(() => {
                    navigate(`/mitra/checkout/${error.response.data.mitra_id}`);
                });
                setIsLoading(false);
                return;
            }

            // Error normal (Password salah)
            MySwal.fire({
                icon: 'error',
                title: 'Login Gagal',
                text: error.response?.data?.message || 'Email atau kata sandi Anda salah.',
                confirmButtonColor: '#842A3B'
            });
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-kas-bg flex font-sans text-kas-dark">
            
            {/* ========================================== */}
            {/* SISI KIRI: Branding & Informasi (Sembunyi di Mobile) */}
            {/* ========================================== */}
            <div className="hidden lg:flex lg:w-1/2 bg-kas-primary text-white flex-col justify-between p-12 xl:p-20 relative overflow-hidden">
                {/* Ornamen Background Transparan */}
                <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-white opacity-5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-black opacity-10 rounded-full blur-3xl"></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-16">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
                            <span className="text-kas-primary font-black text-xl">K</span>
                        </div>
                        <span className="text-3xl font-extrabold tracking-tight text-white">
                            Koleksi<span className="text-kas-accent">Kas.</span>
                        </span>
                    </div>

                    <h1 className="text-5xl xl:text-6xl font-black mb-6 leading-tight">
                        Kelola Koleksi,<br/>Catat dengan Cerdas.
                    </h1>
                    <p className="text-white/80 text-lg mb-12 max-w-md leading-relaxed font-medium">
                        KoleksiKas membantu Anda mencatat, mengelola, dan memantau semua koleksi kas komunitas dengan mudah, otomatis, dan efisien via QRIS.
                    </p>

                    <div className="grid grid-cols-2 gap-8 max-w-lg">
                        <div>
                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm border border-white/10">
                                <span className="text-2xl">⚡</span>
                            </div>
                            <h4 className="font-bold text-lg mb-1">Penagihan Mudah</h4>
                            <p className="text-sm text-white/70 font-medium">Catat & tagih koleksi dengan cepat dan praktis.</p>
                        </div>
                        <div>
                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm border border-white/10">
                                <span className="text-2xl">🔒</span>
                            </div>
                            <h4 className="font-bold text-lg mb-1">Data Aman</h4>
                            <p className="text-sm text-white/70 font-medium">Keamanan data Anda adalah prioritas utama kami.</p>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 text-white/50 text-sm font-medium">
                    &copy; {new Date().getFullYear()} KoleksiKas. All rights reserved.
                </div>
            </div>

            {/* ========================================== */}
            {/* SISI KANAN: Form Login */}
            {/* ========================================== */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
                {/* Logo untuk Mobile (Muncul jika lg ke bawah) */}
                <div className="absolute top-8 left-8 lg:hidden flex items-center gap-2">
                    <div className="w-8 h-8 bg-kas-primary rounded-lg flex items-center justify-center shadow-md">
                        <span className="text-white font-black text-sm">K</span>
                    </div>
                    <span className="text-2xl font-extrabold tracking-tight text-kas-primary">
                        Koleksi<span className="text-kas-soft">Kas.</span>
                    </span>
                </div>

                <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                    
                    <div className="text-center mb-10">
                        {/* Icon Kotak di Atas Form (Seperti di referensi) */}
                        <div className="w-16 h-16 bg-kas-primary text-white rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-kas-primary/30 mb-6">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-black text-gray-800">Selamat datang kembali!</h2>
                        <p className="text-gray-500 font-medium text-sm mt-2">Masuk untuk melanjutkan ke KoleksiKas</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <input 
                                    name="email" 
                                    value={formData.email} 
                                    onChange={handleChange} 
                                    type="email" 
                                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 focus:border-kas-primary focus:ring-1 focus:ring-kas-primary outline-none transition-all font-medium text-gray-700 bg-gray-50 focus:bg-white" 
                                    placeholder="Masukkan email Anda" 
                                    required 
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Kata Sandi</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <input 
                                    name="password" 
                                    value={formData.password} 
                                    onChange={handleChange} 
                                    type={showPassword ? "text" : "password"} 
                                    className="w-full pl-11 pr-12 py-3.5 rounded-xl border border-gray-200 focus:border-kas-primary focus:ring-1 focus:ring-kas-primary outline-none transition-all font-medium text-gray-700 bg-gray-50 focus:bg-white" 
                                    placeholder="Masukkan kata sandi Anda" 
                                    required 
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-kas-primary transition-colors"
                                >
                                    {showPassword ? (
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    ) : (
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Link to="/auth/forgot-password" className="text-sm font-bold text-kas-primary hover:text-kas-dark transition-colors">
                                Lupa kata sandi?
                            </Link>
                        </div>

                        <button type="submit" disabled={isLoading} className="w-full py-3.5 bg-kas-primary hover:bg-kas-dark text-white rounded-xl font-bold shadow-lg shadow-kas-primary/20 transition-all active:scale-95 disabled:opacity-70">
                            {isLoading ? 'Memeriksa...' : 'Masuk'}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-gray-500 font-medium text-sm">
                            Belum punya akun? <Link to="/mitra/register" className="text-kas-primary font-bold hover:underline">Daftar di sini</Link>
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
}