import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { Mail, ShieldCheck, EyeOff, Eye, ArrowRight, CreditCard } from 'lucide-react';

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
            
            const token = response.data.access_token; 
            const user = response.data.user;

            localStorage.setItem('auth_token', token); 
            localStorage.setItem('user', JSON.stringify(user));

            MySwal.fire({
                toast: true, position: 'top-end', icon: 'success', title: 'Berhasil masuk!',
                showConfirmButton: false, timer: 1500
            }).then(() => {
                if(user.role === 'super_admin') {
                    navigate('/super-admin/dashboard', { replace: true });
                } else {
                    navigate('/admin/dashboard', { replace: true });
                }
            });
            
        } catch (error) {
            if (error.response?.status === 403 && error.response?.data?.pending_payment) {
                MySwal.fire({
                    icon: 'warning', title: 'Pembayaran Tertunda',
                    text: error.response.data.message, confirmButtonColor: '#842A3B',
                    confirmButtonText: 'Lanjutkan Pembayaran', customClass: { popup: 'rounded-2xl' }
                }).then(() => {
                    navigate(`/mitra/checkout/${error.response.data.mitra_id}`);
                });
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user');
                setIsLoading(false);
                return;
            }

            MySwal.fire({
                icon: 'error', title: 'Akses Ditolak',
                text: error.response?.data?.message || 'Email atau kata sandi Anda salah.',
                confirmButtonColor: '#842A3B', customClass: { popup: 'rounded-2xl' }
            });
            setIsLoading(false);
        }
    };

    return (
        // Menggunakan min-h-screen agar bisa scroll alami jika layar HP sangat kecil
        <div className="flex min-h-screen w-full bg-kas-bg font-sans text-kas-dark selection:bg-kas-accent selection:text-kas-dark">
            
            {/* ========================================== */}
            {/* SISI KIRI: Branding (Hanya muncul di Desktop) */}
            {/* ========================================== */}
            <div className="hidden lg:flex lg:w-1/2 bg-kas-primary text-white flex-col justify-between p-10 xl:p-16 relative overflow-hidden">
                {/* Ornamen Background Transparan */}
                <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-white opacity-10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-black opacity-20 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-12">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
                            <CreditCard className="w-6 h-6 text-kas-primary" />
                        </div>
                        <span className="text-3xl font-black tracking-tight text-white">
                            Koleksi<span className="text-kas-accent">Kas.</span>
                        </span>
                    </div>

                    <h1 className="text-4xl xl:text-5xl font-black mb-5 leading-tight drop-shadow-sm">
                        Kelola Koleksi,<br/>Catat dengan Cerdas.
                    </h1>
                    <p className="text-white/80 text-base mb-10 max-w-md leading-relaxed font-medium">
                        Platform manajemen kas, arisan, dan mabar olahraga yang dirancang untuk mempermudah tugas admin komunitas via integrasi WhatsApp dan QRIS.
                    </p>

                    <div className="grid grid-cols-2 gap-6 max-w-lg">
                        <div>
                            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mb-3 backdrop-blur-sm border border-white/10">
                                <span className="text-xl">⚡</span>
                            </div>
                            <h4 className="font-bold text-base mb-1">Otomatisasi Penuh</h4>
                            <p className="text-xs text-white/70 font-medium">Sistem penagihan & rekap lunas jalan sendiri.</p>
                        </div>
                        <div>
                            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mb-3 backdrop-blur-sm border border-white/10">
                                <span className="text-xl">🔒</span>
                            </div>
                            <h4 className="font-bold text-base mb-1">Keamanan Data</h4>
                            <p className="text-xs text-white/70 font-medium">Seluruh data keuangan terenkripsi aman.</p>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 text-white/50 text-xs font-medium">
                    &copy; {new Date().getFullYear()} KoleksiKAS by RootanRoo.
                </div>
            </div>

            {/* ========================================== */}
            {/* SISI KANAN: Form Login (Responsive Mobile & Desktop) */}
            {/* ========================================== */}
            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-4 sm:p-6 relative">
                
                {/* Logo untuk Mobile */}
                <div className="absolute top-6 left-6 lg:hidden flex items-center gap-2">
                    <div className="w-8 h-8 bg-kas-primary rounded-lg flex items-center justify-center shadow-md">
                        <CreditCard className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-black tracking-tight text-kas-primary">
                        Koleksi<span className="text-kas-dark">Kas.</span>
                    </span>
                </div>

                {/* Form Card - Dibuat lebih padat */}
                <div className="w-full max-w-[400px] bg-white p-6 sm:p-8 rounded-[2rem] shadow-2xl shadow-kas-dark/5 border border-gray-100 z-10 mt-12 lg:mt-0">
                    
                    <div className="text-center mb-8">
                        <div className="w-14 h-14 bg-gradient-to-br from-kas-primary to-kas-soft text-white rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-kas-primary/30 mb-4 transform -rotate-6">
                            <ShieldCheck className="w-7 h-7 transform rotate-6" />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Portal Admin</h2>
                        <p className="text-gray-500 font-medium text-xs mt-1.5">Masuk untuk mengelola komunitas Anda.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Email Terdaftar</label>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-kas-primary transition-colors"><Mail className="w-4 h-4" /></span>
                                <input 
                                    name="email" 
                                    type="email" 
                                    value={formData.email} 
                                    onChange={handleChange} 
                                    required
                                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-kas-primary focus:ring-4 focus:ring-kas-primary/10 outline-none transition-all font-bold text-gray-800 text-sm"
                                    placeholder="admin@komunitas.com" 
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-1.5">
                                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest">Kata Sandi</label>
                                <Link to="/auth/forgot-password" className="text-[11px] font-bold text-kas-primary hover:text-kas-dark transition-colors">Lupa sandi?</Link>
                            </div>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-kas-primary transition-colors"><ShieldCheck className="w-4 h-4" /></span>
                                <input 
                                    name="password" 
                                    type={showPassword ? "text" : "password"} 
                                    value={formData.password} 
                                    onChange={handleChange} 
                                    required
                                    className="w-full pl-11 pr-11 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-kas-primary focus:ring-4 focus:ring-kas-primary/10 outline-none transition-all font-bold text-gray-800 text-sm"
                                    placeholder="••••••••" 
                                />
                                <button 
                                    type="button" 
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={isLoading} 
                            className="w-full py-3.5 bg-kas-primary hover:bg-kas-dark text-white rounded-xl font-black flex items-center justify-center gap-2 shadow-lg shadow-kas-primary/30 transition-all active:scale-95 disabled:opacity-70 mt-2 text-sm"
                        >
                            {isLoading ? 'Memeriksa...' : <>Masuk Dashboard <ArrowRight className="w-4 h-4" /></>}
                        </button>
                    </form>

                    <div className="mt-6 pt-5 border-t border-gray-100 text-center">
                        <p className="text-gray-500 font-medium text-xs">
                            Belum mendaftar sebagai Mitra? <br className="sm:hidden" />
                            <Link to="/mitra/register" className="text-kas-primary font-black hover:underline mt-1 sm:mt-0 sm:ml-1 inline-block">Daftar sekarang</Link>
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
}