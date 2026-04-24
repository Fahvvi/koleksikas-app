import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';

export default function Login() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({ email: '', password: '' });

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await axios.post('/api/v1/auth/login', formData);
            
            // --- PERBAIKI BAGIAN INI ---
            // Tambahkan .data satu kali lagi karena Axios membungkus response di .data, 
            // dan Laravel kamu juga membungkusnya di dalam 'data'
            const token = response.data.data.token; 
            const user = response.data.data.user;

            // Simpan ke brankas browser
            localStorage.setItem('auth_token', token);
            localStorage.setItem('user_role', user.role);

            // Arahkan sesuai Role
            if(user.role === 'super_admin') {
                navigate('/super-admin/dashboard');
            } else {
                navigate('/admin/dashboard');
            }
            
        } catch (error) {
            console.error("Detail Error:", error);
            Swal.fire({
                icon: 'error',
                title: 'Login Gagal',
                // Tangkap pesan dari backend jika ada, atau fallback
                text: error.response?.data?.message || 'Terjadi kesalahan sistem atau kredensial salah.',
                confirmButtonColor: '#842A3B'
            });
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-kas-bg flex items-center justify-center p-4 font-sans text-kas-dark">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-kas-accent/30 p-8">
                <div className="text-center mb-8">
                    <Link to="/" className="text-3xl font-extrabold tracking-tight text-kas-primary block mb-2">
                        Koleksi<span className="text-kas-soft">Kas.</span>
                    </Link>
                    <p className="text-kas-soft font-medium">Selamat datang kembali, Admin!</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-sm font-bold mb-2">Email</label>
                        <input 
                            name="email" value={formData.email} onChange={handleChange} type="email" 
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-kas-soft outline-none transition-all" 
                            placeholder="super@koleksikas.com" required 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-2">Password</label>
                        <input 
                            name="password" value={formData.password} onChange={handleChange} type="password" 
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-kas-soft outline-none transition-all" 
                            placeholder="••••••••" required 
                        />
                    </div>

                    <button type="submit" disabled={isLoading} className="w-full py-3.5 mt-4 bg-kas-primary hover:bg-kas-dark text-white rounded-xl font-bold shadow-lg shadow-kas-primary/30 transition-all active:scale-95 disabled:opacity-70">
                        {isLoading ? 'Memeriksa...' : 'Masuk ke Dashboard'}
                    </button>
                </form>
            </div>
        </div>
    );
}