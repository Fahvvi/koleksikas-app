import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

export default function SetPassword() {
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [phone, setPhone] = useState('');
    
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Ekstrak nomor HP dari URL query params (?phone=62822...)
        const params = new URLSearchParams(location.search);
        const phoneParam = params.get('phone');
        
        if (phoneParam) {
            setPhone(phoneParam);
        } else {
            MySwal.fire('Akses Ditolak', 'Link tidak valid. Nomor HP tidak ditemukan.', 'error')
                .then(() => navigate('/auth/login'));
        }
    }, [location, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (password !== passwordConfirmation) {
            return MySwal.fire('Oops!', 'Konfirmasi password tidak sama!', 'warning');
        }
        if (password.length < 8) {
            return MySwal.fire('Oops!', 'Password minimal harus 8 karakter!', 'warning');
        }

        setIsLoading(true);
        try {
            // Tembak API Backend
            const response = await axios.post('/api/v1/auth/set-password', {
                phone: phone,
                password: password,
                password_confirmation: passwordConfirmation // Pastikan dikirim untuk backend validation
            });

            MySwal.fire({
                icon: 'success',
                title: 'Aktivasi Berhasil!',
                text: response.data.message || 'Password berhasil dibuat. Silakan login.',
                confirmButtonText: 'Ke Halaman Login'
            }).then(() => {
                navigate('/auth/login');
            });
            
        } catch (error) {
            MySwal.fire('Gagal Menyimpan', error.response?.data?.message || 'Terjadi kesalahan pada sistem.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="bg-white p-8 md:p-10 rounded-3xl shadow-xl max-w-md w-full border border-gray-100">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                    </div>
                    <h2 className="text-2xl font-black text-gray-800">Aktivasi Akun</h2>
                    <p className="text-sm text-gray-500 mt-2">Buat password untuk melengkapi profil KoleksiKas kamu.</p>
                    <div className="mt-3 py-1 px-3 bg-gray-100 rounded-full inline-block text-xs font-mono text-gray-600">
                        {phone}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Password Baru</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Minimal 8 karakter"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Konfirmasi Password</label>
                        <input
                            type="password"
                            value={passwordConfirmation}
                            onChange={(e) => setPasswordConfirmation(e.target.value)}
                            placeholder="Ketik ulang password"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                            required
                        />
                    </div>
                    
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-blue-500/30 disabled:opacity-70 mt-4 active:scale-95"
                    >
                        {isLoading ? 'Menyimpan...' : 'Simpan & Login'}
                    </button>
                </form>
            </div>
        </div>
    );
}