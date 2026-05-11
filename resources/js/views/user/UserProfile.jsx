import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { ArrowLeft, User, Phone, ShieldCheck, Save, Eye, EyeOff } from 'lucide-react';

export default function UserProfile() {
    const [formData, setFormData] = useState({ name: '', phone_wa: '', password: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            setFormData({ name: user.name || '', phone_wa: user.phone_wa || '', password: '' });
        }
    }, []);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleUpdate = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.put('/api/v1/user/profile', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            // Update local storage dengan data baru
            localStorage.setItem('user', JSON.stringify(res.data.data));
            
            Swal.fire({
                toast: true, position: 'top', icon: 'success', title: 'Profil Diperbarui!',
                showConfirmButton: false, timer: 2000
            });
            setFormData({ ...formData, password: '' }); // Kosongkan field password
        } catch (error) {
            Swal.fire({
                icon: 'error', title: 'Gagal',
                text: error.response?.data?.message || 'Nomor WA mungkin sudah dipakai akun lain.',
                confirmButtonColor: '#842A3B', customClass: { popup: 'rounded-3xl' }
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans selection:bg-kas-accent selection:text-kas-dark pb-20">
            <div className="bg-white px-4 py-5 border-b border-gray-100 flex items-center gap-4 sticky top-0 z-30 shadow-sm">
                <Link to="/explore" className="p-2 bg-gray-50 rounded-full text-gray-500 hover:text-kas-dark hover:bg-gray-100 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-xl font-black text-kas-dark tracking-tight">Pengaturan Profil</h1>
            </div>

            <div className="max-w-xl mx-auto px-4 mt-8 animate-fade-in">
                <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-sm border border-gray-100">
                    <div className="w-20 h-20 bg-kas-primary/10 text-kas-primary rounded-full flex items-center justify-center font-black text-3xl mx-auto mb-6 border-4 border-white shadow-md">
                        {formData.name.charAt(0).toUpperCase() || 'U'}
                    </div>

                    <form onSubmit={handleUpdate} className="space-y-5">
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Nama Lengkap</label>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><User className="w-5 h-5" /></span>
                                <input name="name" type="text" required value={formData.name} onChange={handleChange} className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-kas-primary outline-none font-bold text-gray-800" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Nomor WhatsApp</label>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><Phone className="w-5 h-5" /></span>
                                <input name="phone_wa" type="tel" required value={formData.phone_wa} onChange={handleChange} className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-kas-primary outline-none font-bold text-gray-800" />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-50">
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Ganti Password <span className="text-[10px] normal-case font-medium">(Opsional)</span></label>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><ShieldCheck className="w-5 h-5" /></span>
                                <input name="password" type={showPassword ? "text" : "password"} value={formData.password} onChange={handleChange} placeholder="Biarkan kosong jika tidak diganti" className="w-full pl-12 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-kas-primary outline-none font-bold text-gray-800" />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" disabled={isLoading} className="w-full py-4 bg-kas-primary hover:bg-kas-dark text-white rounded-2xl font-black flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70 mt-4 shadow-lg shadow-kas-primary/30">
                            {isLoading ? 'Menyimpan...' : <><Save className="w-5 h-5" /> Simpan Perubahan</>}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}