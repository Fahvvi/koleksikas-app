import React, { useState } from 'react';
import { useParams } from 'react-router-dom';

export default function RegisterSession() {
    const { sessionId } = useParams();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone_wa: '',
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const submitForm = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Simulasi API Request (Nanti kita buka Axios-nya)
            console.log("Submit ke Session ID:", sessionId, "Data:", formData);
            
            setTimeout(() => {
                alert("Simulasi sukses! Arahkan ke QRIS...");
                setIsLoading(false);
            }, 1500);
            
        } catch (error) {
            console.error(error);
            alert("Terjadi kesalahan saat mendaftar.");
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-kas-bg flex items-center justify-center p-4 font-sans text-kas-dark">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-kas-accent/30">
                
                {/* Header Banner */}
                <div className="bg-kas-primary p-6 text-center text-white">
                    <h1 className="text-2xl font-bold tracking-wide">KoleksiKas</h1>
                    <p className="text-kas-accent text-sm mt-1">Minisoccer Akhir Pekan</p>
                </div>

                {/* Detail Info */}
                <div className="p-6 bg-kas-accent/10 border-b border-kas-accent/40">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-kas-soft">Tanggal</span>
                        <span className="text-sm font-bold text-kas-dark">25 Apr 2026</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-kas-soft">Waktu</span>
                        <span className="text-sm font-bold text-kas-dark">19:00 - 21:00</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-kas-soft">Biaya (QRIS)</span>
                        <span className="text-lg font-extrabold text-kas-primary">Rp 50.000</span>
                    </div>
                </div>

                {/* Form Area */}
                <form onSubmit={submitForm} className="p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-kas-dark mb-1">Nama Lengkap</label>
                        <input 
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            type="text" 
                            placeholder="Cth: Andi Striker"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-kas-soft focus:border-kas-soft transition-all outline-none bg-kas-bg/50"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-kas-dark mb-1">Nomor WhatsApp</label>
                        <input 
                            name="phone_wa"
                            value={formData.phone_wa}
                            onChange={handleChange}
                            type="tel" 
                            placeholder="Cth: 08123456789"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-kas-soft focus:border-kas-soft transition-all outline-none bg-kas-bg/50"
                            required
                        />
                        <p className="text-xs text-kas-soft mt-1">*Pastikan nomor aktif untuk menerima e-tiket</p>
                    </div>

                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full py-3.5 mt-4 bg-kas-primary hover:bg-kas-dark text-white rounded-xl font-bold text-lg shadow-lg shadow-kas-primary/30 transition-all active:scale-95 flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Memproses...' : 'Daftar & Bayar Sekarang'}
                    </button>
                </form>

            </div>
        </div>
    );
}