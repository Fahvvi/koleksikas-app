import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { CreditCard, ArrowLeft, KeyRound, Smartphone, ShieldCheck } from 'lucide-react';

export default function ForgotPassword() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        phone_wa: '',
        otp: '',
        password: '',
        password_confirmation: '',
        type: 'forgot' // Parameter penting untuk Backend
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // STEP 1: Minta OTP
    const handleRequestOtp = async (e) => {
        e.preventDefault();
        if (!formData.phone_wa) return;

        setIsLoading(true);
        try {
            const res = await axios.post('/api/v1/auth/request-otp', {
                phone_wa: formData.phone_wa,
                type: 'forgot'
            });
            
            Swal.fire({
                icon: 'success',
                title: 'OTP Terkirim!',
                text: res.data.message || 'Cek pesan WhatsApp Anda.',
                confirmButtonColor: '#842A3B'
            });
            setStep(2); // Lanjut ke Step 2
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Gagal',
                text: error.response?.data?.message || 'Nomor WhatsApp tidak ditemukan.',
                confirmButtonColor: '#842A3B'
            });
        } finally {
            setIsLoading(false);
        }
    };

    // STEP 2: Verifikasi OTP & Simpan Password Baru
    const handleResetPassword = async (e) => {
        e.preventDefault();
        
        if (formData.password !== formData.password_confirmation) {
            Swal.fire('Oops!', 'Konfirmasi kata sandi tidak cocok.', 'error');
            return;
        }

        setIsLoading(true);
        try {
            const res = await axios.post('/api/v1/auth/verify-otp', formData);
            
            Swal.fire({
                icon: 'success',
                title: 'Berhasil!',
                text: 'Kata sandi Anda telah berhasil diubah. Silakan login dengan kata sandi baru.',
                confirmButtonColor: '#842A3B'
            }).then(() => {
                navigate('/auth/login');
            });
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Gagal',
                text: error.response?.data?.message || 'OTP salah atau kedaluwarsa.',
                confirmButtonColor: '#842A3B'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-kas-bg flex items-center justify-center p-4 font-sans selection:bg-kas-accent selection:text-kas-dark">
            <div className="max-w-md w-full relative z-10">
                
                {/* Logo & Judul */}
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center justify-center gap-2 mb-6">
                        <div className="w-10 h-10 bg-kas-primary rounded-xl flex items-center justify-center shadow-lg shadow-kas-primary/30">
                            <CreditCard className="w-6 h-6 text-white" />
                        </div>
                        <span className="font-black text-2xl tracking-tight text-kas-dark">KoleksiKAS.</span>
                    </Link>
                    <h2 className="text-3xl font-black text-kas-dark tracking-tight">Pulihkan Akun</h2>
                    <p className="text-gray-500 font-medium mt-2">Jangan panik, kami bantu Anda masuk kembali.</p>
                </div>

                {/* Card Form */}
                <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 p-8">
                    
                    {step === 1 ? (
                        // FORM STEP 1
                        <form onSubmit={handleRequestOtp} className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Nomor WhatsApp Terdaftar</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Smartphone className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input 
                                        type="tel" 
                                        name="phone_wa" 
                                        value={formData.phone_wa} 
                                        onChange={handleChange} 
                                        className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 focus:border-kas-primary focus:ring-2 focus:ring-kas-primary/20 bg-gray-50 focus:bg-white outline-none transition-all" 
                                        placeholder="Cth: 08123456789" 
                                        required 
                                    />
                                </div>
                            </div>
                            <button 
                                type="submit" 
                                disabled={isLoading} 
                                className="w-full py-4 bg-kas-primary hover:bg-kas-dark text-white rounded-xl font-bold shadow-lg shadow-kas-primary/30 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isLoading ? 'Memproses...' : 'Kirim Kode OTP'}
                            </button>
                        </form>
                    ) : (
                        // FORM STEP 2
                        <form onSubmit={handleResetPassword} className="space-y-5 animate-fade-in">
                            <div className="bg-blue-50 text-blue-800 p-4 rounded-xl flex items-start gap-3 text-sm font-medium mb-2">
                                <ShieldCheck className="w-5 h-5 shrink-0 text-blue-500 mt-0.5" />
                                <p>Masukkan 8 digit OTP yang telah dikirim ke nomor <strong>{formData.phone_wa}</strong>.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Kode OTP</label>
                                <input 
                                    type="text" 
                                    name="otp" 
                                    value={formData.otp} 
                                    onChange={handleChange} 
                                    maxLength="8"
                                    className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-kas-primary focus:ring-2 focus:ring-kas-primary/20 bg-gray-50 focus:bg-white outline-none transition-all text-center text-xl font-black tracking-[0.2em]" 
                                    placeholder="••••••••" 
                                    required 
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Kata Sandi Baru</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <KeyRound className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input 
                                        type={showPassword ? "text" : "password"} 
                                        name="password" 
                                        value={formData.password} 
                                        onChange={handleChange} 
                                        className="w-full pl-11 pr-24 py-3.5 rounded-xl border border-gray-200 focus:border-kas-primary focus:ring-2 focus:ring-kas-primary/20 bg-gray-50 focus:bg-white outline-none transition-all" 
                                        placeholder="Minimal 6 karakter" 
                                        required 
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-4 flex items-center text-xs font-bold text-kas-soft hover:text-kas-primary transition-colors">
                                        {showPassword ? "TUTUP" : "LIHAT"}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Konfirmasi Kata Sandi</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <KeyRound className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input 
                                        type={showPassword ? "text" : "password"} 
                                        name="password_confirmation" 
                                        value={formData.password_confirmation} 
                                        onChange={handleChange} 
                                        className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 focus:border-kas-primary focus:ring-2 focus:ring-kas-primary/20 bg-gray-50 focus:bg-white outline-none transition-all" 
                                        placeholder="Ketik ulang kata sandi" 
                                        required 
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                disabled={isLoading} 
                                className="w-full py-4 mt-2 bg-kas-primary hover:bg-kas-dark text-white rounded-xl font-bold shadow-lg shadow-kas-primary/30 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {isLoading ? 'Menyimpan...' : 'Simpan Kata Sandi Baru'}
                            </button>
                        </form>
                    )}
                </div>

                <div className="mt-8 text-center">
                    <Link to="/auth/login" className="text-gray-500 font-bold hover:text-kas-primary transition-colors flex items-center justify-center gap-2">
                        <ArrowLeft className="w-4 h-4" /> Batal dan kembali ke Login
                    </Link>
                </div>
            </div>
        </div>
    );
}