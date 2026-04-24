import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function MitraRegister() {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', company_name: '', license_tier_slug: 'pro'
    });

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const submitForm = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            console.log("Data Pendaftaran Mitra:", formData);
            setTimeout(() => {
                alert("Pendaftaran Berhasil! Arahkan ke Pembayaran...");
                setIsLoading(false);
            }, 1500);
        } catch (error) {
            console.error(error);
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-kas-bg flex flex-col font-sans text-kas-dark">
            <nav className="container mx-auto px-6 py-4">
                <Link to="/" className="text-2xl font-extrabold tracking-tight text-kas-primary">
                    Koleksi<span className="text-kas-soft">Kas.</span>
                </Link>
            </nav>

            <div className="flex-grow flex items-center justify-center p-6">
                <div className="max-w-4xl w-full grid md:grid-cols-2 bg-white rounded-3xl shadow-2xl overflow-hidden border border-kas-accent/30">
                    
                    <div className="bg-kas-primary p-10 text-white flex flex-col justify-between hidden md:flex">
                        <div>
                            <h2 className="text-3xl font-bold mb-4 leading-tight">Mulai Kelola Komunitasmu Secara Profesional.</h2>
                            <p className="text-kas-accent/90 leading-relaxed mb-8">
                                Bergabunglah dengan ratusan pengelola komunitas yang sudah beralih ke KoleksiKas.
                            </p>
                        </div>
                    </div>

                    <div className="p-10 lg:p-12">
                        <div className="mb-8">
                            <h3 className="text-2xl font-bold text-kas-dark">Daftar Mitra</h3>
                        </div>

                        <form onSubmit={submitForm} className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold mb-1">Nama Pengelola (Admin)</label>
                                <input name="name" value={formData.name} onChange={handleChange} type="text" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-kas-soft bg-kas-bg/50 outline-none" required />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-1">Email</label>
                                    <input name="email" value={formData.email} onChange={handleChange} type="email" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-kas-soft bg-kas-bg/50 outline-none" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1">No. WhatsApp</label>
                                    <input name="phone" value={formData.phone} onChange={handleChange} type="tel" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-kas-soft bg-kas-bg/50 outline-none" required />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-1">Nama Komunitas</label>
                                <input name="company_name" value={formData.company_name} onChange={handleChange} type="text" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-kas-soft bg-kas-bg/50 outline-none" required />
                            </div>

                            <button type="submit" disabled={isLoading} className="w-full py-4 mt-2 bg-kas-primary hover:bg-kas-dark text-white rounded-xl font-bold shadow-lg transition-all active:scale-95 disabled:opacity-70">
                                {isLoading ? 'Memproses...' : 'Lanjutkan ke Pembayaran'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}