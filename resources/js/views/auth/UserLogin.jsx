import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { CreditCard, ArrowRight, ShieldCheck, Phone } from 'lucide-react';
import Swal from 'sweetalert2';

export default function UserLogin() {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const navigate = useNavigate();
    const location = useLocation();
    
    // Ambil returnUrl jika user dilempar dari halaman Explore
    const returnUrl = location.state?.returnUrl || '/user/dashboard';

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            // Tembak ke endpoint login (pastikan backend mendukung login via phone_wa)
            const response = await axios.post('/api/v1/auth/login', {
                phone_wa: phone,
                password: password,
                role: 'user' // Penanda bahwa ini login member
            });

            localStorage.setItem('token', response.data.access_token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            
            // Kembalikan user ke halaman sebelumnya (misal: Explore) atau ke Dashboard Member
            navigate(returnUrl);
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Login Gagal',
                text: error.response?.data?.message || 'Nomor WhatsApp atau password salah.',
                confirmButtonColor: '#842A3B'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center font-sans selection:bg-kas-accent selection:text-kas-dark">
            
            {/* Top Navigation Minimalist */}
            <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-10">
                <Link to="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm border border-gray-100">
                        <CreditCard className="w-5 h-5 text-kas-primary" />
                    </div>
                    <span className="font-black text-xl text-kas-dark">KoleksiKAS.</span>
                </Link>
                <Link to="/explore" className="text-sm font-bold text-gray-500 hover:text-kas-dark transition-colors">Cari Mabar</Link>
            </div>

            <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl aspect-square bg-kas-primary/5 rounded-full blur-3xl pointer-events-none"></div>

                <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl shadow-kas-dark/5 border border-gray-100 p-8 md:p-10 relative z-10 animate-slide-up">
                    
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-kas-bg rounded-2xl flex items-center justify-center mx-auto mb-4 border border-kas-accent/50 shadow-inner">
                            <span className="text-3xl">👋</span>
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 mb-2">Selamat Datang!</h2>
                        <p className="text-sm text-gray-500 font-medium">Login untuk melihat riwayat iuran dan daftar open play dengan mudah.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Nomor WhatsApp</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><Phone className="w-5 h-5" /></span>
                                <input 
                                    type="text" 
                                    required 
                                    value={phone} 
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-kas-primary focus:ring-4 focus:ring-kas-primary/10 outline-none transition-all font-medium text-gray-800"
                                    placeholder="Cth: 081234567890"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Password / PIN</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><ShieldCheck className="w-5 h-5" /></span>
                                <input 
                                    type="password" 
                                    required 
                                    value={password} 
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-kas-primary focus:ring-4 focus:ring-kas-primary/10 outline-none transition-all font-medium text-gray-800"
                                    placeholder="Masukkan password Anda"
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full py-4 bg-kas-dark hover:bg-black text-white rounded-xl font-black tracking-wide flex justify-center items-center gap-2 transition-all active:scale-95 disabled:opacity-70 mt-2 shadow-lg"
                        >
                            {isLoading ? 'Memeriksa...' : <>Login Sekarang <ArrowRight className="w-5 h-5" /></>}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                        <p className="text-sm text-gray-500 font-medium">
                            Belum terdaftar di komunitas manapun? <br />
                            <Link to="/explore" className="text-kas-primary font-bold hover:underline mt-1 inline-block">Cari dan Ikuti Open Play</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}